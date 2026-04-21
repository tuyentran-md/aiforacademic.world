import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminApp } from "@/lib/firebase/admin";

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

export async function GET(request: NextRequest) {
  try {
    const uid = await getAuthUid(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order");

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    if (!adminDb) {
      throw new Error("Admin DB not initialized");
    }

    const orderDoc = await adminDb.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = orderDoc.data();
    if (data?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ status: data?.status || "pending" });
  } catch (error) {
    console.error("[api/payment/status] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
