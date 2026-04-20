# AFA v2 — Refactor Spec

> **Owner:** Tuyến Trần (tuyentranmd.com)
> **Date:** 2026-04-20
> **For:** Antigravity (Claude Code) implementation
> **Auditor:** Zi (Claude Cowork) — will audit after implementation
> **Context:** Preparing for (1) "Built with Opus 4.7" hackathon (Apr 21–26), (2) AWS/Google Cloud for Startups applications

---

## 0. Guiding Principles

1. **This is NOT Perplexity.** Perplexity searches better than us, full stop. Our moat is the **AVR → RIC pipeline** — turning a research question into a draft manuscript with integrity checks. Search is a means, not the product.
2. **Academic identity.** The UI must look like it belongs in a research lab, not a SaaS dashboard. Clean, minimal, scholarly.
3. **Smooth flow.** The user journey is: ask a question → find papers → read/translate them → draft manuscript → check integrity. Each step should flow into the next without friction.
4. **Free-tier infrastructure.** No Supabase. Use Google Cloud free-tier services (Firestore, Firebase Auth) or other zero-cost options.

---

## 1. UI Overhaul — `/app` Route

### 1.1 Rename "Pipeline" → "Workspace"

**Current:** Nav menu shows "Pipeline" linking to `/app`.
**Change:** Rename to "Workspace" everywhere — nav link, page title, any references in code.

### 1.2 Visual Identity — Academic, Not SaaS

**Current problems:**
- Emoji-heavy buttons (🔍 ✍️ 🔬) look informal
- "AFA Assistant" + "Agentic Research Workspace" subtitle feels generic
- Color scheme (stone grays + terracotta accent) is OK but layout is cluttered
- Mobile tab labels "💬 Chat" / "🖥 Canvas" — too casual

**Changes:**

#### Header
- Remove subtitle "Agentic Research Workspace"
- Keep "AFA" logo mark (the terracotta "A" circle is fine)
- Title: just **"AFA"** or **"AI for Academic"** — no "Assistant"
- Language toggle: keep as-is (compact, functional)

#### Workspace Entry Screen (idle state)
Replace the 3 emoji-button chips with a **clean command palette / prompt area:**

```
┌─────────────────────────────────────────────┐
│                                             │
│   What are you working on?                  │
│                                             │
│   ┌───────────────────────────────────────┐ │
│   │ Ask a research question...            │ │
│   └───────────────────────────────────────┘ │
│                                             │
│   Quick actions:                            │
│   [ Search literature ]  [ Check my paper ] │
│                                             │
└─────────────────────────────────────────────┘
```

- Remove the emojis from quick action buttons. Use text-only with subtle borders.
- "Draft manuscript" button is NOT shown here (it's a downstream action after search, not a standalone entry point — AVR requires references).

#### Canvas Panel
- Remove emoji prefixes from tab labels: "References" not "🔍 References", "Draft" not "✍️ Draft", "Integrity" not "🔬 RIC Report"
- Tab label rename: "RIC Report" → "Integrity Report" (users don't know what "RIC" means)

#### Chat Panel
- Agent avatar: keep the "A" circle
- Remove "AI is processing..." text from typing indicator — the animation is enough
- Suggested action chips: remove emoji prefixes, use text only

#### Mobile
- Tab labels: "Chat" / "Canvas" (no emoji)

### 1.3 Typography & Color Refinements

- **Headings:** Keep Lora (serif). Good for academic feel.
- **Body:** Keep Inter (sans-serif). Clean and readable.
- **Canvas background:** `#FAF9F6` is good. Keep it.
- **Primary accent:** `#C4634E` (terracotta) — keep, it's distinctive.
- **Remove all emoji from UI chrome.** Emoji in user-generated content (chat) is fine. Emoji in buttons, tabs, headers, labels — remove.

### 1.4 Component Cleanup

These files are **unused** and should be deleted to reduce confusion:
- `src/app/app/components/PipelineTracker.tsx` — legacy step indicator
- `src/app/app/components/ManuscriptEditor.tsx` — duplicate of editor in CanvasPanel
- `src/app/app/components/ReferenceCard.tsx` — standalone version (inline version in CanvasPanel is used)
- `src/app/app/components/ReferenceList.tsx` — container wrapper (not used)
- `src/app/app/components/IntegrityOverlay.tsx` — alternate integrity display (not used)
- `src/app/app/components/ChatInput.tsx` — alternate input (not used)

After deletion, the component list should be:
```
src/app/app/components/
├── AppLayout.tsx      # Main layout (chat + canvas)
├── ChatPanel.tsx      # Chat messages + input
├── CanvasPanel.tsx    # Canvas states (idle, references, editor, integrity)
└── FlagCard.tsx       # Integrity flag display
```

---

## 2. Research Flow — Make It Smooth

### 2.1 Current Problem

The search works but stops at "here are your references." The user then has to manually:
- Click each reference to read the abstract
- Open external links to find full text
- Has no way to translate abstracts in-flow
- No way to get the PDF

**Goal:** Find paper → preview abstract → translate → access full text. One flow.

### 2.2 Enhanced Reference Card

Redesign `ReferenceCard` (the inline version in CanvasPanel) to support a richer interaction:

```
┌──────────────────────────────────────────────────┐
│ □  Title of the Paper Here                       │
│    Authors · Journal · 2024 · Cited: 42          │
│    ─────────────────────────────────────────────  │
│    Abstract (collapsed by default, click to       │
│    expand full text)...                           │
│                                                  │
│    [ Translate ▾ ]  [ Full text ↗ ]  [ Copy ]    │
│                                                  │
│    ┌─ Translation (appears below when clicked) ─┐│
│    │ Translated abstract in user's language...   ││
│    └────────────────────────────────────────────┘│
│                                                  │
│    pubmed                                        │
└──────────────────────────────────────────────────┘
```

**Changes:**
- **Abstract:** Collapsed by default. Click to expand full text (not truncated to 200 chars).
- **Translate button:** Dropdown showing target language (default: user's selected language). On click → calls `/api/pipeline/translate` → shows translated abstract **inline below the original**, not replacing it.
- **Full text link:** Opens DOI URL or PubMed/OpenAlex link in new tab. Label: "Full text ↗" (not "🔗 Link").
- **Copy button:** Copies formatted citation (Author et al., Year. Title. Journal.) — not just the title.
- **Remove emoji** from action buttons. Use text + subtle icons (SVG, not emoji).
- **Source badge:** Keep "pubmed" / "openalex" but style as small pill, lowercase.

### 2.3 Translation Flow

**Current:** `translateReference(id)` exists in `useCanvas` but UX is disconnected.

**Target flow:**
1. User clicks "Translate" on a reference card
2. Button shows loading state (spinner replacing text)
3. Translation appears inline below the original abstract
4. Translated text is cached on the Reference object (`abstractTranslated` field already exists)
5. If already translated, toggle show/hide (no re-fetch)

**Language detection:**
- Use the app's language toggle (EN/VI) as default target
- If the abstract is in English and user language is EN → translate to Vietnamese (useful for Vietnamese researchers)
- If the abstract is in English and user language is VI → translate to Vietnamese

### 2.4 Bulk Actions

Add a toolbar above the reference list when ≥1 reference is selected:

```
┌─────────────────────────────────────────────────┐
│  3 selected  ·  [ Translate all ]  [ Draft ▸ ]  │
└─────────────────────────────────────────────────┘
```

- **Translate all:** Batch translate selected references
- **Draft ▸:** Start AVR with selected references (replaces the suggested action chip in chat)

---

## 3. LLM Provider — Keep Gemini, Prepare Anthropic Stub

### 3.1 Current State

**Default LLM: Google Gemini 2.5 Flash** — keep as-is. No budget to run Anthropic API right now.

### 3.2 Conditional Swap (Hackathon only)

If accepted into the "Built with Opus 4.7" hackathon ($500 API credits provided), THEN swap:
- Implement `src/lib/llm/anthropic.ts` using `@anthropic-ai/sdk`
- Set `LLM_PROVIDER=anthropic`, `LLM_MODEL=claude-opus-4-7-20250415`
- This is a ~30 min task thanks to the existing abstraction layer

### 3.3 What to Do Now

- **Do NOT install `@anthropic-ai/sdk` yet**
- **Do NOT change `LLM_PROVIDER`** — keep `google`
- Keep the `anthropic.ts` stub file as-is (it already has the interface shape)
- The LLM abstraction in `src/lib/llm/index.ts` already supports provider switching via env var — no code changes needed there

---

## 4. AVR Module

### 4.1 Status

Dev (Antigravity) will implement AVR and commit directly to GitHub. This spec does NOT define AVR internals — that's dev's domain.

### 4.2 Integration Points

What the rest of the app needs from AVR:

**Input:**
```typescript
{
  query: string;           // Original research question
  references: Reference[]; // Selected references from search
  language: "EN" | "VI";   // Target language for manuscript
}
```

**Output (streamed via SSE):**
```typescript
// Step 1: Blueprint
{ type: "blueprint", data: Blueprint }

// Step 2: Manuscript chunks
{ type: "manuscript_chunk", data: { content: string } }

// Step 3: Done
{ type: "done", data: { step: 2 } }
```

**Blueprint type** (already defined in `types.ts`):
```typescript
interface Blueprint {
  articleType: string;
  title: string;
  sections: { heading: string; instructions: string; referenceIds: string[] }[];
}
```

### 4.3 UI Changes for AVR

- **Remove** the "🚧 AVR — Coming Soon" banner from the editor canvas state
- **Remove** the "coming soon" message from `startAVR()` in `useCanvas.ts`
- Editor should show the streamed manuscript as it arrives (already supported by `manuscript_chunk` SSE handler)
- After manuscript is generated, show two action buttons: **"Copy"** and **"Check Integrity"** (not "Run RIC")

---

## 5. Database — Free Tier Options

### 5.1 Recommendation: Firebase (free tier)

**Why Firebase over Supabase:**
- Firestore: 1 GiB storage, 50K reads/day, 20K writes/day — more than enough for early stage
- Firebase Auth: free for all auth methods (email, Google, etc.)
- No credit card required for Spark (free) plan
- Google Cloud ecosystem — helps with Google Cloud for Startups application

### 5.2 What to Store

**Users (Firebase Auth):**
- Email, display name, avatar
- Sign-up via Google OAuth (one-click, no friction)

**Sessions (Firestore: `sessions` collection):**
```typescript
{
  userId: string;
  query: string;
  language: "EN" | "VI";
  referenceIds: string[];      // Stored reference IDs
  manuscript?: string;         // Generated draft
  integrityScore?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**References (Firestore: `references` collection):**
```typescript
{
  // Same as Reference type, deduplicated by DOI
  doi: string;
  title: string;
  // ... etc
  cachedAt: Timestamp;
}
```

**Usage tracking (Firestore: `usage` collection):**
```typescript
{
  userId: string;
  action: "search" | "translate" | "avr" | "ric";
  timestamp: Timestamp;
  tokensUsed?: number;
}
```

### 5.3 Auth Flow

- Add a "Sign in with Google" button on the `/app` page
- Unauthenticated users can still use the app (guest mode) but sessions are not saved
- Authenticated users get session history in a sidebar

### 5.4 Implementation

```bash
npm install firebase firebase-admin
```

- `src/lib/firebase/client.ts` — Client-side Firebase init (Auth + Firestore)
- `src/lib/firebase/admin.ts` — Server-side Firebase Admin SDK (for API routes)
- `src/lib/firebase/auth.ts` — Auth hooks (useAuth)
- `src/lib/firebase/sessions.ts` — Session CRUD

### 5.5 Alternative: Turso (SQLite edge)

If Firebase feels too heavy:
- **Turso** free tier: 9 GB storage, 500 databases, 25M row reads/month
- Lightweight SQLite at the edge
- Use `@libsql/client` + Drizzle ORM
- Better for structured queries than Firestore

Dev's choice — either works. Priority: **zero cost, minimal setup**.

---

## 6. Deployment & Environment

### 6.1 Keep Vercel

Vercel is fine for the hackathon and current scale. No need to containerize yet.

### 6.2 Add Dockerfile (for cloud applications)

Even though we deploy on Vercel, having a Dockerfile strengthens AWS/Google Cloud applications — it shows we're "cloud-ready."

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.ts`:
```typescript
output: "standalone"
```

### 6.3 Environment Variables Summary

```env
# LLM (default: Gemini — swap to anthropic only if hackathon accepted)
LLM_PROVIDER=google
LLM_MODEL=gemini-2.5-flash
GOOGLE_AI_API_KEY=
# ANTHROPIC_API_KEY=            # uncomment if hackathon accepted

# Search APIs
NCBI_API_KEY=
OPENALEX_MAILTO=tuyen.tran97@gmail.com

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=   # JSON string, server-side only

# App
NEXT_PUBLIC_BASE_URL=https://aiforacademic.world
```

---

## 7. Hackathon-Specific Notes

### 7.1 Timeline

- **Apr 21 (Tue):** Registration opens. Submit application.
- **Apr 21–26:** Build week.
- **Apr 26 (Sat 8PM EDT):** Deadline.

### 7.2 What Judges Want

> "Show us the thing only you'd know to build, the problem in your work or community that takes weeks but should take hours."

**Our pitch:** "I'm a pediatric surgeon. Writing a research paper takes me weeks — literature search, synthesis, drafting, integrity checks. AFA does it in one conversation."

> Note: If accepted and given $500 credits, swap LLM to Opus 4.7 per §3.2 and add "Built entirely on Claude Opus 4.7" to the pitch.

### 7.3 Demo Flow (for submission video)

1. Open AFA Workspace
2. Type: "What is the current evidence on laparoscopic vs open appendectomy in children under 5?"
3. → Literature search runs, references stream in
4. Select 8 relevant papers → click "Translate all" (abstracts appear in Vietnamese)
5. Click "Draft" → AVR generates a structured manuscript
6. Click "Check Integrity" → RIC flags unsupported claims, shows score
7. Fix a flagged claim → re-run integrity check → score improves

**Total time: ~3 minutes.** What used to take 2 weeks.

### 7.4 Priorities for Hackathon Week

| Priority | Task | Required for demo? |
|----------|------|-------------------|
| P0 | UI cleanup (§1) | Yes |
| P0 | AVR implementation (§4) | Yes |
| P1 | Research flow improvements (§2) | Yes (translate + full text) |
| P1 | Component cleanup (§1.4) | Nice to have |
| P2 | Firebase auth + sessions (§5) | No (post-hackathon) |
| P2 | Dockerfile (§6) | No (for cloud applications) |
| Conditional | Swap LLM to Anthropic (§3.2) | Only if hackathon accepted ($500 credits) |

---

## 8. Post-Hackathon — Cloud Applications

### 8.1 AWS Activate / Google Cloud for Startups

**Previous rejection reasons (suspected):**
- Tool was `ric.tuyentranmd.com` — personal domain, looked like a side project
- No user auth, no database, no usage metrics
- No clear business model articulated

**What to fix:**
- Product domain: `aiforacademic.world` (professional, product-focused)
- Add Firebase Auth → show registered users count
- Add usage tracking → show API calls, sessions, papers processed
- Prepare a 1-pager: problem (researchers waste weeks), solution (AFA), traction (user count, sessions), tech stack (Gemini/Claude API, Firebase, Vercel), ask ($X credits for LLM inference at scale)

### 8.2 Metrics to Collect (pre-application)

After Firebase is set up, run the app for 2-4 weeks and collect:
- Registered users
- Sessions created
- Papers searched
- Manuscripts drafted
- Integrity checks run
- LLM tokens consumed (→ justifies credit request)

---

## 9. File Changes Summary

### New Files
```
src/lib/firebase/client.ts
src/lib/firebase/admin.ts
src/lib/firebase/auth.ts
src/lib/firebase/sessions.ts
Dockerfile
.env.example (update)
```

### Modified Files
```
src/components/Nav.tsx                    — "Pipeline" → "Workspace"
src/app/app/components/AppLayout.tsx      — header cleanup, mobile tabs
src/app/app/components/ChatPanel.tsx      — remove emoji from chips, typing indicator
src/app/app/components/CanvasPanel.tsx    — entry screen redesign, reference card redesign,
                                            tab labels, bulk actions toolbar, AVR banner removal
src/hooks/useCanvas.ts                   — remove AVR "coming soon", update startAVR()
next.config.ts                           — add output: "standalone"
package.json                             — add firebase (anthropic SDK only if hackathon accepted)
```

### Deleted Files
```
src/app/app/components/PipelineTracker.tsx
src/app/app/components/ManuscriptEditor.tsx
src/app/app/components/ReferenceCard.tsx
src/app/app/components/ReferenceList.tsx
src/app/app/components/IntegrityOverlay.tsx
src/app/app/components/ChatInput.tsx
```

---

## 10. Audit Checklist (for Zi)

After Antigravity implements, Zi will audit against:

**Phase 1 (now — P0/P1):**
- [ ] No emoji in UI chrome (buttons, tabs, labels, headers)
- [ ] "Pipeline" → "Workspace" everywhere
- [ ] Unused components deleted (6 files per §1.4)
- [ ] Entry screen redesigned (command palette, no emoji chips)
- [ ] AVR streams manuscript via SSE (mock removed)
- [ ] Reference card: expand abstract, translate inline, full text link, formatted copy
- [ ] Bulk translate + bulk draft actions work
- [ ] No regressions in search flow
- [ ] No regressions in RIC flow
- [ ] Mobile responsive (chat/canvas tabs work)
- [ ] Vietnamese language support still works

**Phase 2 (post-hackathon — P2):**
- [ ] Firebase auth (Google sign-in) works
- [ ] Sessions saved to Firestore
- [ ] Usage tracking writes to Firestore
- [ ] Dockerfile builds and runs
- [ ] `next.config.ts` has `output: "standalone"`

**Conditional (hackathon accepted):**
- [ ] Anthropic SDK implemented and works
- [ ] `LLM_PROVIDER=anthropic` produces correct responses
- [ ] All pipeline steps (search, AVR, RIC) work with Claude
