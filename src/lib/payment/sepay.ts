import crypto from "crypto";

// Default Sandbox status is "true", unless explicitly set to "false"
const SEPAY_SANDBOX = process.env.NEXT_PUBLIC_SEPAY_SANDBOX !== "false";
// IMPORTANT: .trim() guards against trailing \n or spaces in Vercel env vars —
// previously caused signature mismatch on tuyentranmd.com (fix ae4ce38).
const SEPAY_MERCHANT_ID = (process.env.SEPAY_MERCHANT_ID || "").trim();
const SEPAY_SECRET_KEY = (process.env.SEPAY_SECRET_KEY || "").trim();

let sepayClient: unknown = null;

/**
 * Lazy init the SePay payment gateway client to prevent cold start failures
 * if env variables aren't properly configured yet in some contexts.
 */
export async function getSepayClient() {
  if (!sepayClient) {
    const { SePayPgClient } = await import("sepay-pg-node");
    sepayClient = new SePayPgClient({
      env: SEPAY_SANDBOX ? 'sandbox' : 'production',
      merchant_id: SEPAY_MERCHANT_ID,
      secret_key: SEPAY_SECRET_KEY,
    });
  }
  return sepayClient as {
    checkout: {
      initCheckoutUrl(): string;
      initOneTimePaymentFields(fields: Record<string, unknown>): Record<string, string>;
      signFields(fields: Record<string, unknown>): string;
    }
  };
}

export function buildOrderNumber(uid: string): string {
  return `AFA-PRO-${uid}-${Date.now()}`;
}

export function parseOrderNumber(orderNumber: string): { uid: string; timestamp: number } | null {
  const match = orderNumber.match(/^AFA-PRO-(.+)-(\d+)$/);
  if (match) {
    return {
      uid: match[1],
      timestamp: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * Verify HMAC-SHA256 signature from SePay webhook based on canonical query string.
 */
export function verifySignature(queryData: Record<string, string>, signature: string): boolean {
  if (!SEPAY_SECRET_KEY) {
    console.error("[SePay] Missing SEPAY_SECRET_KEY in env variables.");
    return false;
  }

  // SePay spec: sort keys alphabetically, ignoring the 'signature' key, build query, hmac
  const keys = Object.keys(queryData)
    .filter((k) => k !== "signature")
    .sort();

  const canonicalPairs = [];
  for (const k of keys) {
    if (queryData[k] !== undefined && queryData[k] !== null) {
      canonicalPairs.push(`${k}=${queryData[k]}`);
    }
  }

  const canonicalString = canonicalPairs.join("&");
  const computedHash = crypto
    .createHmac("sha256", SEPAY_SECRET_KEY)
    .update(canonicalString)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}
