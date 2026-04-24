import { NextRequest, NextResponse } from "next/server";
import { checkQuota } from "@/lib/quota";
import { incrementUsage } from "@/lib/firebase/usage";
import { TrackedFunction, PlanLevel } from "@/lib/quota-matrix";
import crypto from "crypto";
import { adminDb, adminApp } from "@/lib/firebase/admin";
import "server-only";

/**
 * Verify Firebase ID token from Authorization header.
 * Returns uid if valid, null if anonymous/invalid.
 */
async function verifyAuth(req: NextRequest | Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.slice(7);
  if (!idToken || !adminApp) return null;

  try {
    // Use firebase-admin auth to verify the token
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    // Token expired / invalid → treat as anonymous
    return null;
  }
}

export async function withQuota(
  req: NextRequest | Request,
  functionName: TrackedFunction,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    // 1. Verify auth via Bearer token
    const uid = await verifyAuth(req);

    // 2. Determine plan from Firestore profile (Admin SDK)
    let plan: PlanLevel = "anon";
    if (uid && adminDb) {
      const profileDoc = await adminDb.collection("profile").doc(uid).get();
      if (profileDoc.exists) {
        const data = profileDoc.data();
        let userPlan = (data?.plan as PlanLevel) || "free";
        if (userPlan === "pro" && data?.subscription_expires_at) {
          const expiresAt = new Date(data.subscription_expires_at);
          if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
            userPlan = "free";
          }
        }
        plan = userPlan;
      } else {
        plan = "free";
      }
    }

    // 3. Hash IP for anonymous tracking
    const rawIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = crypto
      .createHash("sha256")
      .update(rawIp)
      .digest("hex")
      .substring(0, 16);

    // 4. Check quota
    const check = await checkQuota(uid, ipHash, functionName, plan);

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          resetAt: check.resetAt,
          upgradeUrl: "/account/billing",
        },
        { status: 429 }
      );
    }

    // 5. Run handler
    const response = await handler();

    // 6. Increment on success — awaited so Vercel serverless doesn't freeze the write
    if (response.ok) {
      try {
        await incrementUsage(uid, ipHash, functionName);
      } catch (err) {
        console.error(`[quota] Failed to increment ${functionName}`, err);
      }
    }

    return response;
  } catch (error) {
    console.error("[quota] Wrapper error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    const adminMissing = !adminDb;
    return NextResponse.json(
      {
        error: msg,
        ...(adminMissing && {
          hint: "FIREBASE_SERVICE_ACCOUNT_KEY env var is missing — quota cannot be tracked. Set it in .env.local (dev) and Vercel (prod).",
        }),
      },
      { status: 500 }
    );
  }
}
