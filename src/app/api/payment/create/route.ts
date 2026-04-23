import { NextRequest, NextResponse } from "next/server";
import { getSepayClient, buildOrderNumber } from "@/lib/payment/sepay";
import { adminDb, adminApp } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

async function getAuthUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice(7);
  if (!idToken || !adminApp) return null;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth: uid MUST come from verified token, never from body ──
    if (!adminApp) {
      console.error("[api/payment/create] Firebase admin SDK not initialized — check FIREBASE_SERVICE_ACCOUNT_KEY env var");
      return NextResponse.json({ error: "Server configuration error — payment unavailable" }, { status: 503 });
    }
    const uid = await getAuthUid(request);
    if (!uid) {
      return NextResponse.json({ error: "Authentication required — please sign in and try again" }, { status: 401 });
    }

    const body = await request.json();
    const { email, plan } = body as { email?: string; plan: "monthly" | "yearly" };

    if (!plan || (plan !== "monthly" && plan !== "yearly")) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const amountVND = plan === "yearly" ? 2490000 : 249000;
    const orderNumber = buildOrderNumber(uid);

    if (!adminDb) {
      throw new Error("Admin DB not initialized");
    }

    const expireTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await adminDb.collection("orders").doc(orderNumber).set({
      uid,
      email: email || null,
      plan,
      amountVND,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(expireTime),
    });

    const client = await getSepayClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const fields = client.checkout.initOneTimePaymentFields({
      operation: "PURCHASE",
      payment_method: "BANK_TRANSFER",
      order_invoice_number: orderNumber,
      order_amount: amountVND,
      currency: "VND",
      order_description: `AFA Pro ${plan}`,
      success_url: `${baseUrl}/payment/success?order=${orderNumber}`,
      cancel_url: `${baseUrl}/account/billing`,
    });

    const checkoutURL = client.checkout.initCheckoutUrl();
    const queryParams = new URLSearchParams(fields as Record<string, string>).toString();

    return NextResponse.json({
      checkoutURL: `${checkoutURL}?${queryParams}`,
      orderNumber,
    });
  } catch (error) {
    console.error("[api/payment/create] Failed to create SePay order:", error);
    return NextResponse.json({ error: "Internal payment creation error" }, { status: 500 });
  }
}
