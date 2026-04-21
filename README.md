# aiforacademic.world

AI-powered research platform for academic researchers. Three-phase workspace: Read → Write → Check, with a persistent chat + artifacts layer.

**Live:** https://aiforacademic.world
**Owner:** Tuyến Trần · **Stack:** Next.js 15 · TypeScript · Tailwind · Firebase · SePay + LemonSqueezy · Vercel

---

## Phases

1. **Read** — literature search (PubMed / Semantic Scholar), fulltext fetch, abstract + fulltext translation
2. **Write** — research mentor (validate idea, PICO outline, draft manuscript via AVR)
3. **Check** — citations, AI detection, plagiarism, peer-review stress test (RIC)

The AFA Workspace (`/app`) is a chat + artifact panel. The assistant invokes tool functions via function calling; artifacts persist per project in Firestore.

---

## Local development

```bash
npm install
npm run dev       # localhost:3000
npm run build     # production build
npm run lint
```

Requires Node 20+ (see `.nvmrc` if present).

---

## Deployment

- **Vercel** auto-deploys on push to `main`
- Project dashboard: https://vercel.com/tuyentran-mds-projects/aiforacademic
- Staged rollout via `NEXT_PUBLIC_*` feature flags

---

## Environment variables (Vercel Production)

### Firebase
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

### LLM provider
```
GEMINI_API_KEY                    # internal name for the model API key
```

### SePay (VN — QR / bank transfer)
```
SEPAY_MERCHANT_ID=SP-LIVE-TT45A678
SEPAY_SECRET_KEY=<secret>
NEXT_PUBLIC_SEPAY_SANDBOX=false
```

### LemonSqueezy (international — USD, subscription, tax)
```
LEMONSQUEEZY_API_KEY
LEMONSQUEEZY_WEBHOOK_SECRET
NEXT_PUBLIC_LS_ENABLED=false      # flip true when /pricing UI wired
```

### Admin dashboard
```
ADMIN_TOKEN=<random 32-char>      # cookie `admin_token` must match to unlock /admin
```

### App
```
NEXT_PUBLIC_APP_URL=https://aiforacademic.world
```

> ⚠️ Env vars pasted into Vercel may carry trailing `\n`. All env var reads in `src/lib/payment/sepay.ts` apply `.trim()` to defend against this (inherited lesson from tuyentranmd.com fix `ae4ce38`).

---

## Payment flow (SePay — Pro subscription)

**Pricing:** 249k VND/month · 2,490k VND/year

```
User clicks "Upgrade Pro"
  → POST /api/payment/create         (Bearer idToken; uid from token, NOT body)
  → Creates order AFA-PRO-{uid}-{ts} in Firestore (status: pending)
  → Returns SePay checkout URL (pre-signed query string)

User pays at SePay → SePay calls IPN webhook

  → POST /api/webhook/sepay          (receives raw body)
  → Verifies HMAC-SHA256 base64 signature (timingSafeEqual)
  → Gate: status === "PAID"
  → Updates profile/{uid}: plan=pro, expires_at=+30d or +365d
  → Updates orders/{orderId}: status=paid

User polls GET /api/payment/status?order=...  (ownership-gated: uid must match)
```

### Dual-domain IPN routing

SePay supports only ONE IPN URL per merchant. Both `tuyentranmd.com` and `aiforacademic.world` share merchant `SP-LIVE-TT45A678`.

**Router pattern:** IPN points to `https://tuyentranmd.com/api/payment/webhook`. TTM inspects the order prefix:
- `AFA-PRO-*` → forward raw body to `https://aiforacademic.world/api/webhook/sepay`
- `pro-*` / `IELTSPRAC-*` → handle locally on TTM

Order namespaces are disjoint, so there is no collision.

---

## Repo layout

```
src/
  app/                    Next.js App Router pages + API routes
    api/payment/          SePay order creation + status polling
    api/webhook/sepay/    SePay IPN handler
    api/pipeline/         AVR (draft) + RIC (integrity check) pipelines
    api/workspace/        Chat + tool-call routing
  lib/
    payment/sepay.ts      SePay client (lazy init, HMAC verify)
    firebase/             Admin + client SDK wrappers
    quota/                withQuota wrapper, free/pro limits
    pipeline/avr/         Academic Writing Reviewer (streams SSE)
  hooks/                  useChat, useCanvas, usePipeline
  components/             UI primitives + workspace shell
content/blog/             59 MDX blog posts
docs/                     Product plan + infra records
firestore.rules           Firestore security rules (paste into Firebase Console)
```

---

## Admin

`/admin` is a server-rendered dashboard showing live Firestore metrics: total users, active Pro, paid orders, month-to-date revenue, plus recent users/orders tables.

**Access:**
1. Set env `ADMIN_TOKEN=<random>` on Vercel (Production + Preview).
2. In the browser DevTools → Application → Cookies → add cookie `admin_token` with the same value, scoped to `aiforacademic.world`.
3. Visit `/admin`. Mismatched/absent cookie → 404 (no hint leaked).

## Payment strategy

Dual gateway on purpose:
- **SePay** — VN-first (QR / bank transfer). VN users often lack international cards.
- **LemonSqueezy** — international (USD card, subscription, tax compliance). Cleaner for recurring billing.

Profile field `subscription_source: "sepay" | "lemonsqueezy"` records which path the user came through.

---

## Pointers

- **Product plan:** `docs/PLAN.md` — v2 three-phase reframe (supersedes legacy Canvas spec)
- **DNS records:** `docs/DNS_BACKUP.md` — Hostinger MX/DKIM records preserved through Vercel DNS migration
- **Blog posts:** `content/blog/*.md` — rendered at `/blog/[slug]`
