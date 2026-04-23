import { NextResponse } from "next/server";
import { adminApp, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    adminSdk: adminApp !== null && adminDb !== null,
    geminiKey: !!process.env.GOOGLE_AI_API_KEY,
    sepay: !!(process.env.SEPAY_MERCHANT_ID && process.env.SEPAY_SECRET_KEY),
    lsEnabled: process.env.NEXT_PUBLIC_LS_ENABLED === "true",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "(not set)",
  });
}
