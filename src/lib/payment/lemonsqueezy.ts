import crypto from "crypto";


/**
 * Verifies the LemonSqueezy webhook signature.
 * @param rawBody The raw buffer body of the request
 * @param signature The X-Signature header value
 * @param secret The signing secret configured in LemonSqueezy and Vercel ENV
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(digest, signatureBuffer);
  } catch (error) {
    console.error("[lemonsqueezy] verifyWebhookSignature failed", error);
    return false;
  }
}

/**
 * Builds a checkout URL pre-filling email and attaching persistent custom_data (uid).
 */
export function buildCheckoutUrl(
  variantId: string, 
  user: { uid: string; email?: string }
): string {
  const storeId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    console.warn("NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID missing, returning blank # fallback");
    return "#";
  }

  // Construct standard LemonSqueezy nested checkout URL
  const params = new URLSearchParams();
  
  if (user.email) {
    params.set("checkout[email]", user.email);
  }
  
  // Custom data passed in the checkout params will be attached to the subscription
  params.set("checkout[custom][uid]", user.uid);
  
  // Example variant ID: 12345
  return `https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}?${params.toString()}`;
}
