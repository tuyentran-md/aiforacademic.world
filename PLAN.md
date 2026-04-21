# AFA v2 — Three-Phase Research Platform

> **Owner:** Tuyến Trần · **Date:** 2026-04-21
> **For:** Codex / Antigravity implementation · **Repo:** `aiforacademic.world`
> **Stack:** Next.js 15 App Router · TypeScript · Tailwind · Gemini 2.5 Flash · Firebase Auth + Firestore · LemonSqueezy · Vercel
> **Deployment:** push to `main` → Vercel auto-deploy. Staged rollout via `NEXT_PUBLIC_*` feature flags.
> **Supersedes:** PLAN v1 (workspace layout redesign). v1 diagnosed the broken 2-panel layout correctly but prescribed the wrong fix. v2 is a full-product reframe.

---

## 0. What Changed from v1 — Read This First

PLAN v1 proposed a single-pane tool interface at `/app` with a 3-button toolbar (References / Draft / Check). That assumes the app is a linear pipeline. It is not.

User interviews revealed five concrete, **independent** use cases:

1. "Tôi đã viết xong bài, chỉ muốn check integrity" → Paper Checker only
2. "Tôi có bài, muốn trích TLTK ra `.ris` để nạp Zotero" → no tool exists yet
3. "Tôi muốn search tài liệu có source citations" (Perplexity-style) → weak search today
4. "Tôi có fulltext PDF, muốn dịch nguyên bài sang tiếng Việt" → `/trans` only does abstract
5. "Tôi có idea, muốn check feasibility trước khi làm" → AVR half-built

These are tools, not stages. v2 reorganises them by the researcher's mental model:

```
PHASE 1: READ            PHASE 2: WRITE             PHASE 3: CHECK
Literature Review   →    Research Mentor     →      Paper Checker
(search + fetch +        (validate idea +           (citations + AI +
 translate fulltext)      outline + draft)           plagiarism + peer review)
                                                     + Polish side-tool
```

A persistent **Workspace** layer sits above these tools: a Claude-style chat where Gemini invokes the 11 tool functions via function calling, with an artifact panel that persists results per-project.

### Key architectural changes

| Area | v1 / current | v2 |
|---|---|---|
| Workspace route | `/app` (2-panel split) | `/workspace` (chat + artifacts + projects) |
| RIC | `/ric` rewrites to `researchcheck.vercel.app` (external) | `/tools/paper-checker` (bring in-house) |
| Translator | `/trans` rewrites to `med-translator-swart.vercel.app` (external) | `/tools/literature-review#translate` (in-house, fulltext) |
| Tools hub | `/products` (legacy) | `/tools` (new hub) |
| SRMA | `/srma` (Python CLI landing) | **unchanged** |
| Data model | Firestore `sessions` (ephemeral, per-action) | Firestore `projects` (persistent, manuscript-scoped) |
| i18n | `LangContext` + hardcoded EN/VI strings in hook | `next-intl` + `messages/{en,vi}.json` |
| Payment | none in this repo (LS lives in researchcheck repo) | LemonSqueezy wired here + cross-product plan |
| Homepage | 4 tool cards (Research / AVR / RIC / SRMA) | 3 phase cards + live demo + stats |

### What's preserved (no rewrite)

- All `src/lib/pipeline/*` modules: `search/` (pubmed, openalex, dedup, translate.ts), `avr/` (index, interface, mock.ts), `ric/` (index), plus flat files `sse.ts`, `types.ts`, `manuscript.ts`, `json.ts`. Note: translate is a file *inside* `search/`, not a sibling folder.
- All `/api/pipeline/*` routes — extended, not replaced
- `src/hooks/useCanvas.ts` core — refactored into smaller hooks, not discarded
- `src/lib/firebase/*` client + admin — extended with project schema
- `/blog`, `/blog/[slug]`, `/resources`, `/about`, `/srma` — untouched
- EN/VI pipeline output language toggle (separate from UI locale)

---

## 1. Product Vision

**Positioning:** *"Three phases. From literature to publication."*

**Target user:** Vietnamese doctors (pediatric / general / plastic surgeons), clinical researchers. Windows of 30 minutes between surgeries. Low tolerance for multi-step flows. High trust earned by showing receipts (source URLs, API names, confidence scores).

**Dual-mode value proposition:**

- **Toolkit mode (`/tools/*`)** — "I need to do one thing fast." Upload → result. No login for 2-3 free uses. Each tool is self-contained.
- **Workspace mode (`/workspace`)** — "I'm working on a manuscript over weeks." Chat with AI mentor, it invokes tools, artifacts persist per project.

Same backend powers both. Same 11 tool functions. The difference is how the user accesses them — as task-focused one-shots, or as a conversation.

**Non-goals (explicit):**

- Not a general-purpose AI assistant — we are not ChatGPT
- Not a reference manager — we export to Zotero, we don't replace it
- Not a statistics package — R analysis stays as CLI in `bundle_cyborg_toolkit`
- Not a thesis generator — 30-page outputs don't fit 30-minute UX

---

## 2. Site Architecture

### 2.1 Routes

```
aiforacademic.world/
├── /                                ← Homepage (3-phase redesign)
├── /workspace                       ← NEW (replaces /app)
│   └── /workspace?project=<id>      ← project-scoped view
├── /tools                           ← NEW hub grid
│   ├── /tools/literature-review     ← NEW: Search · Fetch · Translate
│   ├── /tools/research-mentor       ← NEW: Validate · Outline · Draft
│   ├── /tools/paper-checker         ← MIGRATE from /ric (in-house)
│   └── /tools/polish                ← NEW side tool
├── /account/billing                 ← NEW (Pro subscription mgmt)
├── /resources                       ← unchanged
├── /blog, /blog/[slug]              ← unchanged
├── /about                           ← unchanged (i18n pass only)
├── /srma                            ← unchanged
└── /vi/*                            ← i18n mirror (next-intl)
```

### 2.2 Route migration table

| Current | v2 destination | Strategy |
|---|---|---|
| `/app` | `/workspace` | 301 redirect. Delete `src/app/app/*` after dual-run period. |
| `/ric` (external rewrite) | `/tools/paper-checker` | Port UI from `researchcheck.vercel.app/ric` into `src/app/tools/paper-checker/`. Backend pipeline (`src/lib/pipeline/ric`) already exists in this repo — verify it's the same one `researchcheck` calls; if not, also port backend. Remove rewrite from `next.config.ts`. |
| `/trans` (external rewrite) | `/tools/literature-review` Translate tab | Port abstract-only translator + extend to fulltext. Remove rewrite. |
| `/products` | delete | Replaced by `/tools` hub. 301 to `/tools`. |

### 2.3 API routes — keep

- `POST /api/pipeline/search` (PubMed + OpenAlex)
- `POST /api/pipeline/avr` (manuscript draft streaming)
- `POST /api/pipeline/ric` (integrity audit)
- `POST /api/pipeline/translate` (abstract translation)
- `POST /api/subscribe` (proxy to tuyentranmd.com KV)

### 2.4 API routes — new

```
POST /api/pipeline/fetch              ← fulltext PDF cascade (Unpaywall, OpenAlex, EuropePMC, S2 — no Sci-Hub)
POST /api/pipeline/translate-fulltext ← chunked fulltext translation → .docx
POST /api/pipeline/validate           ← idea feasibility critique
POST /api/pipeline/outline            ← protocol generator
POST /api/pipeline/polish             ← prose refinement
POST /api/pipeline/extract-refs       ← manuscript → .ris + audit JSON
POST /api/pipeline/ric/citations      ← RIC scoped: citation verify only
POST /api/pipeline/ric/ai-detect      ← RIC scoped: AI-writing detector
POST /api/pipeline/ric/plagiarism     ← RIC scoped: plagiarism scan
POST /api/pipeline/ric/peer-review    ← RIC scoped: editor-style review

GET    /api/projects                  ← list user's projects
POST   /api/projects                  ← create project
GET    /api/projects/[id]             ← project detail
PATCH  /api/projects/[id]             ← rename / update stage
DELETE /api/projects/[id]             ← delete project

GET    /api/projects/[id]/artifacts   ← list artifacts
POST   /api/projects/[id]/artifacts   ← save artifact (called from pipeline completion)
PATCH  /api/projects/[id]/artifacts/[aid] ← pin/unpin, rename
DELETE /api/projects/[id]/artifacts/[aid]

POST /api/checkout                    ← LemonSqueezy checkout URL
POST /api/webhook/lemonsqueezy        ← subscription events
```

---

## 3. Tool Spec — Literature Review (Phase 1)

**Route:** `/tools/literature-review` · **Short tag:** LR · **Purpose:** Find, fetch, translate.

### 3.1 UI layout (matches existing Paper Checker 4-tab pattern)

Left: paste/upload area + mode selector. Middle: mode tabs. Right: results + history.

### 3.2 Tab A — Search

**Input:** free-text query + filters (year range, study type, abstract language)
**Process:** existing `POST /api/pipeline/search` (PubMed + OpenAlex, dedup, LLM rank, optional VI abstract translation)
**Output:** reference cards with title, authors, year, journal, DOI, abstract, citation count, relevance score
**Per-card actions:** Translate abstract · Copy citation · View source · **[↓ Fetch]** (chains into Fetch tab)

### 3.3 Tab B — Fetch

**Input:** single DOI · paste multi-line DOI list · CSV upload (column `doi`)
**Process:** `POST /api/pipeline/fetch` (NEW). Legal cascade in order: **Unpaywall → OpenAlex OA → Europe PMC → Semantic Scholar**. Explicitly **skip Sci-Hub and LibGen** (legal risk on Vercel).
**Output:** per-DOI row `[✓ downloaded | ⚠ no OA | ✗ failed]`, source name, file size, presigned download URL
**Storage:** PDFs written to Firebase Storage under `users/{uid}/fulltext/{doi-hash}.pdf` with 30-day TTL for free, permanent for Pro
**Miss handling:** display "Fulltext not freely available" + email-to-author template + library request link
**Per-row action:** **[🌐 Translate]** (chains into Translate tab with file prefilled)

### 3.4 Tab C — Translate

**Input:** PDF or DOCX upload (max 50MB) + target language (VI default, EN, JP/CN future)
**Process:** `POST /api/pipeline/translate-fulltext` (NEW)
- DOCX: extract via `mammoth` (already in deps)
- PDF: extract via `pdfjs-dist` or `pdf-parse`
- Chunk by paragraph with ~2000 tokens per chunk + 200-token overlap
- LLM translate each chunk preserving structure, figures, citations
- Reassemble into output DOCX with headings preserved
**Output:** downloadable `.docx` + in-page side-by-side preview (scroll-synced original ↔ translation)
**Retire:** `med-translator-swart.vercel.app/trans` rewrite after parity verified

### 3.5 Free / Pro gating (summary — full matrix in §10)

| | Anonymous | Free login | Pro |
|---|---|---|---|
| Search | 5/day | 20/day | unlimited |
| Fetch | 3/day | 10/day | unlimited + permanent storage |
| Translate abstract | unlimited | unlimited | unlimited |
| Translate fulltext | ✗ | 2/day | unlimited |

---

## 4. Tool Spec — Research Mentor (Phase 2)

**Route:** `/tools/research-mentor` · **Short tag:** RM (supersedes AVR in UI; keep AVR in blog/SEO) · **Purpose:** from idea to manuscript.

### 4.1 Three tabs

| Tab | Input | Output | API |
|---|---|---|---|
| 💡 **Validate** | Idea text (200–2000 chars) + optional field + target journal | Scored feasibility critique: novelty, methodological feasibility, publishability, red flags | `POST /api/pipeline/validate` (NEW) |
| 📋 **Outline** | Topic + study type (RCT / cohort / MA / SR / case-report / narrative / letter) | Markdown protocol: Background, PICO, Methods, Inclusion/Exclusion, Analysis plan | `POST /api/pipeline/outline` (NEW) |
| ✍️ **Draft** | References (manual paste / imported artifact) + outline (manual / imported) + article type | Streaming manuscript (blueprint → sections) | `POST /api/pipeline/avr` (existing, extended) |

### 4.2 Chaining UX

- **Validate → Outline:** button "Generate outline for this idea" → Outline tab pre-filled with topic + auto-picked study type
- **Outline → Draft:** button "Draft manuscript" → Draft tab with outline attached
- **Draft → Paper Checker:** button "Check this draft" → opens `/tools/paper-checker` with manuscript prefilled

### 4.3 Changes to `src/lib/pipeline/avr/`

Current: only `draft` logic (in `mock.ts` — filename legacy, content is real; rename to `draft.ts`).

Add:
- `validate.ts` — Gemini prompt: critique idea along novelty / feasibility / red-flags axes, return typed JSON
- `outline.ts` — Gemini prompt: PICO + I/E + analysis plan markdown for given study type
- Update `interface.ts` to expose 3 methods: `validateIdea`, `generateOutline`, `draftManuscript`

### 4.4 Free / Pro gating

| | Anonymous | Free login | Pro |
|---|---|---|---|
| Validate | 1/day | 5/day | unlimited |
| Outline | 1/day | 5/day | unlimited |
| Draft | ✗ | 1/day | unlimited |

---

## 5. Tool Spec — Paper Checker (Phase 3)

**Route:** `/tools/paper-checker` · **Short tag:** PC (supersedes RIC in UI; keep RIC in blog/SEO) · **Purpose:** 4-in-1 integrity suite + 2 export bridges.

### 5.1 Migration from external `/ric`

Current `/ric` is a Next.js rewrite to `researchcheck.vercel.app/ric`. **Bring UI in-house** — port the screen layout from the external app into `src/app/tools/paper-checker/`. Backend logic:

1. First check: does `researchcheck.vercel.app` use the same `/api/pipeline/ric` route that lives in this repo, or its own backend?
2. If same: UI port only, no backend work. Remove `/ric` rewrite from `next.config.ts`.
3. If different: also port the backend routes into this repo under `/api/pipeline/ric/*` sub-routes (§2.4).

LemonSqueezy Pro gate currently lives in the `researchcheck` repo. Reuse the LS store (variants `1540853` monthly, `1540891` yearly per handoff.md) but handle webhooks in this repo going forward. Coordinate with researchcheck owner before flipping.

### 5.2 Four sub-tabs (preserve existing UX)

Per screenshot: left paste area + middle icon-column of 4 tools + right results panel. **Do not redesign this screen.**

| Sub-tool | Input | Free output | Pro additions |
|---|---|---|---|
| **Citation Check** | Manuscript or ref list | All refs verified against 2 sources (CrossRef, OpenAlex) | 4 sources (add PubMed, Semantic Scholar), parallel |
| **AI Detector** | Manuscript text | Score + verdict (Human / AI / Mixed) | Detailed pattern list + rewrite suggestions |
| **Plagiarism Scan** | Manuscript text | Similarity % + source list, citation-aware | Source URLs + matched snippet excerpts |
| **Peer Review** | Manuscript text | Summary (structure, methods, stats, narrative) | Per-section detailed comments |

### 5.3 Two new CTAs

**In Citation Check output:**
- Button: **"Export refs to Zotero (.ris)"**
- Backend: `POST /api/pipeline/extract-refs` (NEW)
- Logic ported from `tools/research/ref_extract.py` (lives in TUYEN_OS, not in this repo; re-implement in TS using existing CrossRef client in `src/lib/pipeline/search/`)
- Output: `refs_clean.ris` + `ref_audit.json` (verified / unverified counts + source mapping)

**In Peer Review output:**
- Button: **"Polish this paper →"**
- Behavior: stores peer-review comments + manuscript in session storage, routes to `/tools/polish` with pre-fill
- See §6 for Polish tool

### 5.4 Free / Pro gating

See §10 for full matrix. Key cap: free users see 2 runs/day across all 4 sub-tools combined (matches current RIC free behavior per handoff.md).

---

## 6. Tool Spec — Polish (side tool)

**Route:** `/tools/polish` · **Purpose:** prose refinement. Used standalone or chained from Paper Checker's Peer Review.

### 6.1 UI (single-page, no tabs)

- Upload DOCX / paste text area
- Select journal style: Nature · BMJ · JAMA · generic academic (default)
- Optional **Context** textarea — ground-truth to prevent hallucination (PICO excerpt, stats results, study design notes)
- Optional **"Apply Peer Review suggestions"** toggle (auto-on if arriving from Paper Checker)
- Submit → stream diff view (side-by-side before / after with red-strike + green-add highlights)
- Download polished `.docx`

### 6.2 Backend

`POST /api/pipeline/polish` (NEW). Two implementation options, spike-decide in Week 6:

- **Option A (preferred):** TS re-implementation using Gemini 2.5 Flash with the same prompt contract as `tools/research/paper_polish.py`. Benefit: pure Vercel, no external service.
- **Option B:** Python subprocess via Cloud Run (the existing backend for some current AFA endpoints). Benefit: direct reuse of `paper_polish.py`. Cost: extra service to maintain.

**Anti-hallucination rules enforced:**
- Preserve all `[N]` / `(Author, Year)` citation markers verbatim
- Preserve all numerical values (N, means, CIs, p-values)
- Lock facts to Context textarea when provided
- Temperature ≤ 0.15

### 6.3 Free / Pro gating

| | Anonymous | Free login | Pro |
|---|---|---|---|
| Polish | 1/day | 3/day | unlimited |

---

## 7. Workspace Spec

**Route:** `/workspace` · **Replaces:** `/app` · **Purpose:** Claude-style chat + artifact panel where Gemini invokes the 11 tool functions across a project-scoped session.

### 7.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AFA · Workspace   [Project: JME v3 ▾]  [VI|EN] [Pro] [👤]  │
├──────────────────┬──────────────────────────────────────────┤
│ Chat (narrow)    │ Artifacts panel (wide)                   │
│                  │ ┌ Artifacts (3) ▾ ──────────────────┐   │
│ AI: Chào sếp,    │ │ ● Citation Check — 34 flags (now) │   │
│ hôm nay làm gì?  │ │ ○ Draft v1 — 1,234 từ             │   │
│                  │ │ ○ Refs — 8 papers                 │   │
│ User: check paper│ └────────────────────────────────────┘   │
│ [📎 paper.docx]  │ ┌───────────────────────────────────────┐│
│                  │ │ Citation Check                        ││
│ AI: [⚡ calling  │ │ Score 65/100 · 8 fabricated          ││
│  check_citations]│ │ [Export .ris] [Polish →]             ││
│ → 34 flags found │ │ ...                                   ││
│ [📄 see report] │ └───────────────────────────────────────┘│
│                  │                                           │
│ [⚙Tools] Gõ ... │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

Mobile: chat full-screen by default; artifact panel slides in as overlay when AI produces one; returns when user continues chatting.

### 7.2 New components (`src/app/workspace/components/`)

- `WorkspaceLayout.tsx` — root, replaces `AppLayout.tsx`
- `ProjectSwitcher.tsx` — header dropdown, lists recent projects + "New project"
- `ProjectDashboard.tsx` — `/workspace` landing when no project selected: grid of recent projects + CTA
- `ChatStream.tsx` — refactored `ChatPanel`. AI messages may contain inline `[📄 artifact ref]` tokens that scroll the artifact panel on click.
- `ArtifactPanel.tsx` — right column. History dropdown (pinned first, then newest-to-oldest). Latest-on-top by default.
- `ArtifactRenderer.tsx` — switches on `artifact.type` and delegates to specific renderers (paper cards, manuscript editor, citation report, AI score, plagiarism list, peer review comments, prose diff, outline markdown, feasibility critique, translation preview)
- `ToolMenu.tsx` — `[⚙ Tools]` popover button next to chat input. Lists 11 functions with search. Click inserts `@function_name` token + hint into input.

### 7.3 Gemini function calling — 11 functions

```ts
// src/lib/workspace/functions.ts
export const WORKSPACE_FUNCTIONS = {
  // Phase 1 — Literature Review
  search_papers:        (q: string, filters?: Filters) => Promise<Artifact<"paper_cards">>,
  fetch_fulltext:       (dois: string[]) => Promise<Artifact<"paper_cards">>,  // adds pdfUrl to each card
  translate_doc:        (fileId: string, target: Lang) => Promise<Artifact<"translation">>,

  // Phase 2 — Research Mentor
  validate_idea:        (idea: string, ctx?: {field?: string; journal?: string}) => Promise<Artifact<"feasibility">>,
  generate_outline:     (topic: string, study_type: StudyType) => Promise<Artifact<"outline">>,
  draft_manuscript:     (refIds: string[], outline?: string, type?: ArticleType) => Promise<Artifact<"manuscript">>,

  // Phase 3 — Paper Checker + Polish
  check_citations:      (ms: string) => Promise<Artifact<"citation_report">>,
  detect_ai_writing:    (ms: string) => Promise<Artifact<"ai_detect_score">>,
  scan_plagiarism:      (ms: string) => Promise<Artifact<"plagiarism_scan">>,
  peer_review:          (ms: string) => Promise<Artifact<"peer_review">>,
  polish_prose:         (ms: string, style?: JournalStyle, ctx?: string) => Promise<Artifact<"manuscript">>,
}
```

Each function is a thin wrapper over the corresponding `/api/pipeline/*` endpoint. The response is saved as an artifact in the current project and pushed to the artifact panel.

### 7.4 Two invocation modes

- **Implicit:** user types natural language, Gemini decides. System prompt instructs: clarify before major actions ("IMRaD or narrative? target journal? word count?"). Prevent premature tool calls.
- **Explicit:** user clicks `[⚙ Tools]` → picks function → `@function_name` inserted. Next turn scoped to that tool, Gemini must call it.

### 7.5 Chat is NOT a status log

v1's chat echoed `Searching...` / `Found 8 refs`. Pointless. v2's chat:
- Asks clarifying questions before major actions
- Explains function-call choices inline ("Em gọi `check_citations` vì sếp muốn kiểm tra ref — nếu muốn AI detect thì bấm [⚙] > detect_ai_writing")
- References previous artifacts in the same project (`[📄 Draft v1]` jump link)
- Summarises results with actionable next steps ("Score 65 — có 8 fake ref. Em đề xuất [Export .ris] để sếp fix manual, rồi [Polish →]")

### 7.6 Project scoping

- `/workspace` (no param) → `ProjectDashboard`: grid of recent projects + "New project" button
- `/workspace?project=<id>` → chat + artifacts for that project
- Dropdown in header switches project (updates URL)
- Each project has independent: message history, artifact stack, manuscript stage tag
- Scope constraints: a Free-login user has 1 project. Pro has unlimited. Switching on Free opens modal "Upgrade to save more projects."

### 7.7 Free / Pro gating in Workspace

| | Anonymous | Free login | Pro |
|---|---|---|---|
| Workspace chat | 3 messages/day, no save | 20 messages/day, 1 project, 3 artifacts saved | unlimited messages, unlimited projects, unlimited artifacts |
| Function calls | count against per-tool quota | count against per-tool quota | unlimited |
| Artifact export | view only | basic DOCX | DOCX + PDF + .ris |

---

## 8. Homepage Redesign

### 8.1 What's wrong with current homepage

- Hero sub "A small product studio" is filler
- Big black "From question to manuscript in minutes" banner is generic (every AI tool claims this)
- 4 cards (Research / AVR / RIC / SRMA) don't map to a coherent mental model
- "AVR Coming Soon" is misleading (AVR is now part of Research Mentor)
- No social proof, no usage numbers, no live demonstration
- Split primary CTA between "Workspace" and tool cards — user doesn't know where to click

### 8.2 New structure (top to bottom)

1. **Header** — unchanged, add language toggle
2. **Hero (compact, one screen):**
   - H1: "AI tools for academic work." (keep)
   - Sub: "Three phases. Literature → manuscript → publication."
   - **Stat line (dynamic):** e.g. "Checked 2,400 papers · Found 340 fabricated refs · 120 doctors onboard" — placeholder until M4 when M2 has shipped and produced real numbers
   - Primary CTA: **"Try Workspace free →"** → `/workspace`
   - Secondary CTA: "Browse tools" → `/tools`
3. **Live demo** (replaces big black banner):
   - 6-second looping MP4 screencast — upload paper → citation flags appear realtime
   - Alt for mobile + poor connections: annotated static screenshot
4. **Three-phase grid** (replaces 4-card):
   - 3 large cards, one per phase
   - Each card: icon, phase label (Phase 1/2/3), one-line description, 3-item feature list, "Try it →" link
   - Micro-stat under each if data available ("2,400 papers verified this month")
5. **Testimonials** (new, populate post-M4):
   - 1–2 short quotes from real VN doctors if available; otherwise omit until data exists
6. **How it works** (new):
   - 3-step horizontal flow: "1. Gather literature · 2. Draft with AI mentor · 3. Check before submit"
7. **Pricing summary:**
   - Free / Pro $10 mo / Pro $100 yr · link to full `/account/billing#pricing`
8. **Email capture** (existing `EmailCapture.tsx`)
9. **Footer** (existing)

### 8.3 Deletions from homepage

- Big black "From question to manuscript" banner
- "AVR Coming Soon" card
- "A small product studio" sub-headline
- Any claims without data (e.g. "used by top researchers") until we have proof

---

## 9. Data Model

### 9.1 New Firestore collections

```ts
users/{uid}/profile
{
  email: string
  plan: "free" | "pro_monthly" | "pro_yearly"
  lemonsqueezy_customer_id?: string
  subscription_expires_at?: Timestamp
  language_preference: "EN" | "VI"
  created_at: Timestamp
}

users/{uid}/projects/{projectId}
{
  title: string
  description?: string
  manuscript_stage: "idea" | "outline" | "draft" | "revising" | "submitted"
  tags: string[]
  artifact_count: number
  message_count: number
  created_at: Timestamp
  updated_at: Timestamp
}

users/{uid}/projects/{projectId}/messages/{messageId}
{
  role: "user" | "assistant" | "function"
  content: string
  function_name?: string   // if role === "function"
  function_args?: object
  function_result_artifact_id?: string
  created_at: Timestamp
}

users/{uid}/projects/{projectId}/artifacts/{artifactId}
{
  type: ArtifactType
  title: string            // auto-generated, user-editable
  payload: unknown         // type-specific; if >800KB move to Storage
  payload_storage_url?: string  // set if payload offloaded
  source_message_id: string
  source_function: string  // one of the 11 function names
  pinned: boolean
  created_at: Timestamp
}

users/{uid}/usage/{YYYY-MM-DD}
{
  counts: {
    search_papers: number
    fetch_fulltext: number
    translate_doc: number
    validate_idea: number
    generate_outline: number
    draft_manuscript: number
    check_citations: number
    detect_ai_writing: number
    scan_plagiarism: number
    peer_review: number
    polish_prose: number
  }
  workspace_messages: number
}

users/{uid}/fulltext/{doi_hash}    // Firebase Storage, not Firestore
  (PDF blobs, 30d TTL free, permanent Pro)
```

### 9.2 Kept collections (existing)

- `references/*` — shared cross-user cache of Reference objects by DOI
- `sessions/*` — **legacy**. Write one-time migration: on next login, convert each session to a minimal project with one message + one artifact.

### 9.3 Artifact payload size

Firestore doc limit = 1MB. Manuscripts can exceed this. Rule:
- If `JSON.stringify(payload).length > 800_000` → write payload to `users/{uid}/artifacts/{aid}.json` in Storage, store URL in `payload_storage_url`, leave `payload` as summary only
- ArtifactRenderer fetches from Storage on demand

### 9.4 Rate limiting

- Anonymous quotas: IP-based, Vercel KV (`ratelimit:{ip}:{function}:{YYYY-MM-DD}`)
- Authenticated: `users/{uid}/usage/{date}.counts.{function}` incremented atomically
- Middleware (`src/middleware.ts`) checks before routing to pipeline endpoints
- Reset: daily at 00:00 UTC (document in FAQ)

---

## 10. Free Tier + Pro Pricing

### 10.1 Full quota matrix

| Function | Anonymous (IP) | Free login | Pro $10/mo · $100/yr |
|---|---|---|---|
| `search_papers` | 5/day | 20/day | unlimited |
| `fetch_fulltext` | 3/day, 30d TTL | 10/day, 30d TTL | unlimited, permanent storage |
| `translate_doc` (abstract) | unlimited | unlimited | unlimited |
| `translate_doc` (fulltext) | ✗ | 2/day | unlimited |
| `validate_idea` | 1/day | 5/day | unlimited |
| `generate_outline` | 1/day | 5/day | unlimited |
| `draft_manuscript` | ✗ | 1/day | unlimited |
| `check_citations` (2 src) | 2/day total across all PC tools | 5/day (4 src) | unlimited (4 src, parallel) |
| `detect_ai_writing` (score) | ↑ same bucket | 5/day (+ patterns) | unlimited (+ patterns) |
| `scan_plagiarism` (% only) | ↑ same bucket | 5/day (+ URLs) | unlimited (+ URLs + snippets) |
| `peer_review` (summary) | ↑ same bucket | 3/day (per-section) | unlimited (per-section) |
| `polish_prose` | 1/day | 3/day | unlimited |
| `extract_refs` | 2/day | unlimited | unlimited |
| Workspace chat messages | 3/day, no save | 20/day, 1 project, 3 artifacts | unlimited, unlimited projects |
| Artifact export formats | — | DOCX | DOCX + PDF + .ris |

### 10.2 LemonSqueezy integration

- Store: reuse existing `researchcheck` store. Variants: `1540853` (monthly $10), `1540891` (yearly $100).
- **New in this repo:** `src/lib/payment/lemonsqueezy.ts` — checkout URL builder, customer portal link.
- Webhook endpoint: `POST /api/webhook/lemonsqueezy` — verify signature (`LEMONSQUEEZY_SIGNING_SECRET`), handle events:
  - `subscription_created` → set `plan = pro_monthly|pro_yearly`
  - `subscription_resumed` → same
  - `subscription_paused` / `subscription_cancelled` → keep access until `ends_at`, then downgrade
  - `subscription_expired` → set `plan = free`
- Coordinate with `researchcheck` repo owner to avoid double-charging during transition.
- Env vars: `LEMONSQUEEZY_TOKEN`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_SIGNING_SECRET`.

### 10.3 Gating UX

- **80% of daily quota:** warning toast "1 check left today — Upgrade for unlimited"
- **100% quota:** blocking modal with clear reset time + upgrade CTA
- **Pro-only feature click as free user:** inline upgrade CTA next to the feature (not a blocking modal — let user see what they're missing)
- **Expired Pro:** 7-day grace period with banner "Subscription expired. Renew to keep Pro features."

---

## 11. i18n Strategy

### 11.1 Library: `next-intl`

Install: `npm i next-intl`. Native Next.js 15 App Router support. Config via `next.config.ts` + `src/middleware.ts`.

### 11.2 File structure

```
src/
  messages/
    en.json              ← source of truth
    vi.json              ← translated
  i18n.ts                ← next-intl config (locales, default, timeZone)
  middleware.ts          ← locale detection + routing
```

### 11.3 URL convention

- `aiforacademic.world/*` = EN (default, no prefix)
- `aiforacademic.world/vi/*` = VI
- **Slugs stay English everywhere.** `/tools/paper-checker`, not `/vi/tools/kiem-tra-bai-bao`. Rationale: SEO consolidation, clean share links, easier redirects.

### 11.4 Migration from `LangContext`

Current state (per audit):
- `src/context/LangContext.tsx` — React context for UI EN/VI
- `src/lib/i18n.ts` — `pickLang(lang, en, vi)` helper
- `src/lib/server-lang.ts` — reads from cookie / URL
- `useCanvas` has hardcoded VI + EN strings inline

Migration path:
1. Install next-intl, set up `messages/en.json` with all current hardcoded strings
2. Migrate nav + homepage to `useTranslations()` first (highest traffic)
3. Migrate `/tools/*` pages as each is built in the roadmap
4. Migrate `/workspace` last (most text)
5. `messages/vi.json` — cold-read translate in Week 4 + 6
6. **Retire `LangContext`** only after every consumer is migrated — coordinate carefully

**Keep:** `useCanvas.language` (`"EN" | "VI"`). This controls **LLM output language** (user may want EN UI with VI manuscript output, or vice versa). Rename variable to `canvas.outputLanguage` for clarity vs. UI locale.

### 11.5 Enforcement

- ESLint rule: no hardcoded string literals in JSX under `src/app/tools/**` and `src/app/workspace/**`
- Must go through `t('key')`. Exceptions allowlisted per-file (e.g. brand names).

### 11.6 SEO

- `<link rel="alternate" hreflang="en">` and `hreflang="vi"` in root layout for every page
- `sitemap.xml` includes both locales
- `robots.txt` allows both

---

## 12. Implementation Roadmap (8 weeks, 2 parallel tracks)

- **Track A (Tools):** one Codex/Antigravity agent leads
- **Track B (Workspace):** one Codex/Antigravity agent leads
- **Shared track (data model, i18n, auth, payment):** Zi coordinates, both agents consume

### 12.1 Week-by-week

| Wk | Track A — Tools | Track B — Workspace | Shared |
|----|----|----|----|
| **1** | Create `/tools` hub grid. Port `/ric` UI into `/tools/paper-checker` (keep 4 sub-tabs, no feature change yet). Set up shared tool-page pattern (header, input panel, result panel, history sidebar). | Delete `/app/*`. Scaffold `/workspace/*` folder. Create `WorkspaceLayout`, `ProjectDashboard`, `ChatStream` shells (no functionality). | Install `next-intl`. Create `messages/en.json`. Migrate nav + homepage to `t()`. Scaffold new Firestore collections (`projects`, `artifacts`, `profile`). |
| **2** | Build `/tools/literature-review` Search tab (reuse existing API) + Fetch tab (new `/api/pipeline/fetch` legal cascade). | Wire `useProject()` hook. Project CRUD UI (create, rename, delete, switch). | Auth flow → new user profile model. LemonSqueezy webhook handler. |
| **3** | Build Translate tab (fulltext via mammoth + pdfjs + chunked LLM). Retire `/trans` rewrite. | Wire Gemini function calling for Phase 1 functions (`search_papers`, `fetch_fulltext`, `translate_doc`). Artifact save + render. | `vi.json` pass for migrated strings. Rate-limit middleware (`src/middleware.ts`). |
| **4** | Build `/tools/research-mentor` with 3 tabs. New `validate.ts` + `outline.ts` in `src/lib/pipeline/avr/`. Reuse existing AVR for Draft. | Wire Phase 2 functions. Implement chain behavior (artifact → function input). | Vercel staging deploy. Homepage: delete banner, add 3-phase grid, stats placeholders. |
| **5** | Paper Checker enhancements: "Export .ris" button + `/api/pipeline/extract-refs`. New RIC sub-routes (`/api/pipeline/ric/{citations,ai-detect,plagiarism,peer-review}`). | Wire Phase 3 functions. Implement `check_citations`, `detect_ai_writing`, `scan_plagiarism`, `peer_review` in function table. | Free tier gating live. Pro upgrade flow E2E test with LS sandbox. |
| **6** | Build `/tools/polish`. `/api/pipeline/polish` (spike: TS re-impl vs. Python subprocess; pick TS if quality acceptable). "Polish this →" CTA from Paper Checker Peer Review. | Wire `polish_prose` function. Implement `[⚙ Tools]` popover. Inline artifact references in AI messages. | Full `vi.json` pass. Homepage live demo MP4 recorded + embedded. |
| **7** | Polish 3 tool pages: loading states, error handling, empty states, mobile responsive. Per-tool History panel (recent runs). | Artifact pin/unpin, artifact export (docx/pdf/ris), artifact search within project. Offload-to-Storage for >800KB payloads. | Performance audit (Lighthouse). Error tracking (Sentry). Analytics events: signup → first-tool-use → upgrade funnel. |
| **8** | QA pass across all tools vs. acceptance criteria. Fix blockers. | Workspace invite-only beta (50 users, via `NEXT_PUBLIC_WORKSPACE_BETA_ALLOWLIST`). | Public launch. Submit hackathon "Built with Opus 4.7" (Apr 21-26 if still open; else next cycle). Email campaign to existing subscribers. |

### 12.2 Parallelization notes

- Track A each tool is standalone — can ship weekly even if Workspace slips
- Track B depends on Track A for function backends — pipelined, not blocked (Workspace calls backend via fetch, not imports)
- Shared track continuous, blocks neither
- i18n migration is incremental per file — never a blocker for feature work

### 12.3 Effort estimate

- Codex/Antigravity: ~400 hours total (~50h/wk)
- Zi planning + review + coord: ~80 hours (~10h/wk)
- Sếp review + UX feedback + cold-reads: ~40 hours (~5h/wk)

### 12.4 Staged rollout flags

```
NEXT_PUBLIC_WORKSPACE_V2_ENABLED=false    # Week 1-7, flip true Week 8
NEXT_PUBLIC_WORKSPACE_BETA_ALLOWLIST=...   # comma-separated uids for Week 8 beta
NEXT_PUBLIC_TOOLS_ENABLED=true             # Week 1+
NEXT_PUBLIC_LEGACY_APP_REDIRECT=false      # flip true when /app → /workspace ready
```

---

## 13. Acceptance Criteria

Each numbered item must be verifiable by reading output or running a command. Antigravity must confirm all before Week 8 close.

### Architecture
1. ☐ `/tools` hub renders grid with 4 cards (3 phase + Polish)
2. ☐ `/app` redirects to `/workspace` (301)
3. ☐ `/ric` redirects to `/tools/paper-checker` (or renders in-house)
4. ☐ `/trans` redirects to `/tools/literature-review?tab=translate`
5. ☐ `npm run build` passes with zero errors
6. ☐ Vercel auto-deploy succeeds on push to `main`
7. ☐ `next.config.ts` rewrites to `researchcheck.vercel.app` and `med-translator-swart.vercel.app` are removed

### Literature Review
8. ☐ Search tab: common query (e.g. "laparoscopic appendectomy in children") returns ≥5 refs within 15s
9. ☐ Fetch tab: 5 valid open-access DOIs, ≥60% return a fulltext PDF from legal sources
10. ☐ Fetch tab: NO Sci-Hub or LibGen sources in code or in response
11. ☐ Translate tab: 2000-word DOCX produces a VI `.docx` within 60s, structure preserved

### Research Mentor
12. ☐ Validate returns structured critique with novelty / feasibility / red-flags sections
13. ☐ Outline returns PICO + I/E + analysis plan markdown for study type "RCT"
14. ☐ Draft streams section-by-section and completes within 2 min for a 5-ref draft
15. ☐ Validate → Outline → Draft chaining preserves context across tabs

### Paper Checker
16. ☐ Citation Check verifies refs against CrossRef + OpenAlex on Free, + PubMed + S2 on Pro
17. ☐ "Export .ris" produces a RIS file that imports cleanly into Zotero (manual test)
18. ☐ AI Detector returns score 0-100 + verdict
19. ☐ Plagiarism Scan returns % + source list (citation-aware)
20. ☐ Peer Review returns editor-style comments
21. ☐ "Polish this →" CTA routes to `/tools/polish` with manuscript + peer-review context prefilled

### Polish
22. ☐ Upload + submit produces polished markdown with citation markers preserved verbatim
23. ☐ Context textarea demonstrably reduces hallucination (test against planted-fact prompt)

### Workspace
24. ☐ Project Dashboard lists user's projects sorted by `updated_at`
25. ☐ Create project → switches to chat + empty artifact panel
26. ☐ AI calls function on intent match; artifact appears in panel
27. ☐ `[⚙ Tools]` popover shows 11 functions; click inserts `@name` into input
28. ☐ Switch project → chat + artifacts reload correctly
29. ☐ Inline `[📄 artifact-ref]` tokens in chat are clickable; scroll the artifact panel to that artifact
30. ☐ AI asks clarifying questions before major actions (tested with prompt "draft a paper")

### Data + Auth + Pay
31. ☐ Firebase signup auto-creates `users/{uid}/profile` with `plan = "free"`
32. ☐ LemonSqueezy webhook updates `plan` within 10s of sandbox subscription event
33. ☐ Free user hits quota → blocking modal with upgrade CTA
34. ☐ Pro user has no rate limit on any endpoint
35. ☐ `sessions` → `projects` one-time migration runs on login for legacy users

### i18n
36. ☐ Language toggle changes all visible UI copy
37. ☐ `aiforacademic.world/vi/tools/paper-checker` renders VI copy
38. ☐ No hardcoded strings in `src/app/tools/**` or `src/app/workspace/**` (ESLint rule passes)
39. ☐ `<link rel="alternate" hreflang>` tags present in root layout

### Homepage
40. ☐ Hero shows 3-phase mental model, not 4 tool cards
41. ☐ Live demo MP4 loops on desktop, static fallback on mobile
42. ☐ Stats line shows real numbers (not "Coming Soon" or placeholder)

---

## 14. Migration Notes (PLAN v1 → v2)

### 14.1 Preserve from v1

- `src/hooks/useCanvas.ts` core logic (refactor into `useProject`, `useChat`, `useArtifacts`; don't rewrite SSE handling)
- `src/lib/pipeline/*` all libs
- `/api/pipeline/*` all existing routes (extend, don't replace)
- File upload pipeline with `mammoth`
- Firebase Auth + Firestore client/admin setup
- EN/VI pipeline output language toggle (rename to `outputLanguage` for clarity)
- Existing env vars (don't rename)

### 14.2 Deprecate from v1

- `src/app/app/components/AppLayout.tsx` — rewrite as `WorkspaceLayout.tsx`
- `src/app/app/components/CanvasPanel.tsx` — split into `ArtifactPanel` + `ArtifactRenderer`
- `src/app/app/components/ChatPanel.tsx` — rewrite as `ChatStream` with function-call awareness
- Mobile "Chat | Canvas" tab bar — delete; mobile becomes chat-first with artifact overlay
- `src/context/LangContext.tsx` — retire after next-intl migration complete
- `sessions` Firestore collection — migrate to `projects`, then drop
- Homepage 4-card layout, big black banner, "AVR Coming Soon"
- `/products` route — delete, 301 to `/tools`
- `next.config.ts` rewrites for `/ric` and `/trans` — remove after in-house migration

### 14.3 Breaking changes + handling

- Existing `/app` bookmarks → 301 redirect (keep dual-running 2 weeks)
- Existing `/ric` bookmarks → 301 redirect (or internal rewrite if we keep the domain pointing externally temporarily)
- Existing sessions data → one-time migration on next login
- Any existing Pro subscribers in `researchcheck` repo → coordinate with owner to avoid double-charge; consider unified customer record keyed by email

### 14.4 Rollback plan

- Git tag `pre-v2-redesign` before Week 1 merge
- Feature flag `NEXT_PUBLIC_WORKSPACE_V2_ENABLED` — default off until Week 8
- Keep `/app` live alongside `/workspace` for 2 weeks post-launch
- Remove `/app` only after 48 hours consecutive zero traffic

---

## 15. What NOT to Change

- `src/app/blog/*` — static MDX pipeline works, leave alone
- `src/app/resources/*` — Gumroad external links, no dynamic data
- `src/app/about/*` — leave (i18n pass only)
- `src/app/srma/*` — external Python CLI landing, leave
- `src/lib/pipeline/search/*` — only add `fetch.ts` and extend `translate.ts`, do not refactor internals
- `src/lib/pipeline/ric/*` — only add sub-route handlers, do not refactor
- `src/lib/firebase/*` client/admin — extend with new collections, do not rewrite
- `src/lib/pipeline/sse.ts` — SSE setup is correct
- Existing env var names — only add new ones, never rename

---

## 16. Open Decisions Deferred to Implementation

- **Plagiarism Scan backend:** Copyleaks API (paid, accurate), CrossRef Similarity Check (free, limited), or LLM-based semantic similarity? Spike in Week 5.
- **Polish backend:** TS re-implementation (Vercel-native) vs. Python subprocess (reuse `paper_polish.py`) vs. Cloud Run service? Spike in Week 6, prefer TS if output quality matches.
- **Artifact Storage offload threshold:** 800KB chosen as conservative default under 1MB Firestore cap; validate in Week 2 once real manuscripts are saved.
- **Search quality upgrade:** current ranking loses to Perplexity per founder feedback. In-scope: prompt-only refinement in Week 7. Out-of-scope: full retrieval/rerank rewrite — defer to v3.
- **`researchcheck.vercel.app` backend parity:** verify it uses this repo's `/api/pipeline/ric` before assuming UI-only port. If divergent, also port backend logic.
- **Cross-product unified account:** user may have Pro in `researchcheck` store already; on login detect by email and grant Pro on AFA. Implementation detail in Week 2.

---

**End of PLAN v2.** Next action: sếp cold-reads → flag anything wrong → hand to Codex/Antigravity for Week 1 implementation.
