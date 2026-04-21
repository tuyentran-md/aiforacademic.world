import { NextRequest, NextResponse } from "next/server";
import { verifySignature, parseOrderNumber } from "@/lib/payment/sepay";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    // Parse the JSON. Depending on how SePay sends it, it might be purely JSON
    const payload = JSON.parse(bodyText);

    // Some gateways send the signature in headers, but SePay usually sends it in query or payload
    // if using `sepay-pg-node` it might be a query parameter or body payload.
    // The user's repo from `tuyentranmd.com` uses query-based canonical hash typically,
    // though SePay's official webhook actually passes `Object.keys` for signature validation.
    // We will assume SePay webhook sends data as completely JSON payload and signature can be verified via the payload keys.

    if (!payload.signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifySignature(payload, payload.signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (payload.status !== "PAID") {
      console.log("[SePay] Ignored non-PAID webhook event:", payload.status);
      return NextResponse.json({ success: true, message: "Ignored non-PAID status" });
    }

    const order_invoice_number = payload.order_id || payload.order_invoice_number;
    if (!order_invoice_number) {
      return NextResponse.json({ error: "Missing order number" }, { status: 400 });
    }

    if (!adminDb) {
      throw new Error("Admin DB not initialized");
    }

    const orderRef = adminDb.collection("orders").doc(order_invoice_number);
    const orderDoc = await orderRef.get();

    let uid = "";
    let plan = "monthly";

    if (orderDoc.exists) {
      const data = orderDoc.data();
      uid = data?.uid;
      plan = data?.plan || "monthly";
    } else {
      // Fallback: parse uid from order number
      const parsed = parseOrderNumber(order_invoice_number);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid order number format" }, { status: 400 });
      }
      uid = parsed.uid;
      // We assume it's monthly if not found, though ideally it should always exist
      plan = "monthly";
    }

    if (!uid) {
      return NextResponse.json({ error: "Could not determine UID" }, { status: 400 });
    }

    // Determine expiration based on plan
    const daysToAdd = plan === "yearly" ? 365 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // 1. Update Profile collection
    await adminDb.collection("profile").doc(uid).set({
      plan: "pro",
      subscription_status: "active",
      subscription_source: "sepay",
      subscription_expires_at: expiresAt.toISOString(),
      sepay_order_number: order_invoice_number,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Update Order doc
    if (orderDoc.exists) {
      await orderRef.update({
        status: "paid",
        paidAt: FieldValue.serverTimestamp()
      });
    }

    console.log(`[SePay] Pro activated for uid: ${uid}, plan: ${plan}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/webhook/sepay] Error processing webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
