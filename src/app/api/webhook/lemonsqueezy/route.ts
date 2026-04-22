import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payment/lemonsqueezy";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = (process.env.LEMONSQUEEZY_SIGNING_SECRET || "").trim();

    if (!signature || !secret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 401 });
    }

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const uid = customData?.uid;

    if (!uid) {
      // If we cannot map to a uid, we cannot update their plan
      console.warn(`[lemonsqueezy] Webhook received for ${eventName} but no custom_data.uid found`);
      return NextResponse.json({ received: true, ignored: true });
    }

    if (!adminDb) {
      console.error("[lemonsqueezy] adminDb not initialized");
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const profileRef = adminDb.collection("profile").doc(uid);
    const data = payload.data.attributes;

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused":
        // Handle active/past_due appropriately but safely grant 'pro' access
        const isPro = data.status === "active" || data.status === "past_due";
        await profileRef.set({
          plan: isPro ? "pro" : "free",
          subscription_source: "lemonsqueezy",
          lemonsqueezy_customer_id: data.customer_id,
          lemonsqueezy_subscription_id: String(payload.data.id),
          subscription_expires_at: data.renews_at || null,
          subscription_status: data.status,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        break;

      case "subscription_cancelled":
      case "subscription_paused":
        // Plan remains 'pro' until ends_at duration
        await profileRef.set({
          subscription_status: "cancelled",
          subscription_expires_at: data.ends_at || data.renews_at, // Will flip to free when current cycle expires
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        break;

      case "subscription_expired":
      case "subscription_payment_failed":
        // If expired or hard failed, immediately downgrade
        await profileRef.set({
          plan: "free",
          subscription_status: data.status,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        break;

      default:
        console.log(`[lemonsqueezy] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[lemonsqueezy] Webhook parsing error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
