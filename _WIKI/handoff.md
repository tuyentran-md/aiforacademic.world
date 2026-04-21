# Engineering Handoff

## PR 1: LemonSqueezy Webhook Integration
- Added edge API route `/api/webhook/lemonsqueezy` which securely validates the HMAC SHA-256 signature using `LEMONSQUEEZY_SIGNING_SECRET`.
- Validated payloads map to a `uid` appended via checkout custom data and automatically updates the `profile` document using Firebase Admin.
- The Billing Page logic was extracted to `BillingGrid.tsx` to dynamically parse the user context (`useAuth`) and append custom tracking params (`uid`) to the LemonSqueezy Checkout Session URL.

## PR 2 & 3: Quota Matrix, Rate Limiting & Usage (Firestore-only)
- Created `src/lib/quota-matrix.ts` translating PLAN.md (§10.1) business limits for free variants and tight thresholds for anonymous IPs.
- Implemented `src/lib/firebase/usage.ts` tracking nested `.counts.{function}` schemas automatically inside daily date docs.
- Added `withQuota` API route wrapper which processes the headers to secure usage using Admin SDK atomic inserts (`FieldValue.increment`).
- Wrapped core pipeline operations such as `workspace/chat`, `citations`, `search_papers`.

## PR 4: Legacy Migration
- Implemented `src/lib/firebase/migrate-sessions.ts` executing idempotent translation from former `sessions` collection over to native Projects and Artifact maps.
- Dynamically imported inside `src/lib/firebase/auth.ts` `onAuthStateChanged` to seamlessly map all alpha accounts to the new Pro-ready schema during next login.
