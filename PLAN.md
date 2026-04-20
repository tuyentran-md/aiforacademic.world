# AFA Workspace — Final Implementation Plan

> **Owner:** Tuyến Trần · **Date:** 2026-04-20
> **For:** Dev/Codex implementation · **Auditor:** Zi
> **Repo:** `aiforacademic.world` (Next.js 15, TypeScript, Tailwind, Gemini 2.5 Flash)
> **Goal:** Ship a polished Workspace that wins hackathon + gets cloud startup funding

---

## Context: What Already Exists

The site has 5 nav sections that work fine: **Homepage** (OK), **Tools** (static product pages), **Resources** (downloads), **Blog** (50+ posts, SEO), **About** (team).

The problem is **Workspace** (`/app`). It's the interactive core — the thing users actually use — and it's broken. This plan fixes it completely.

### What the Workspace currently has (code-level):
- **Search pipeline** — PubMed + OpenAlex, LLM ranking, SSE streaming. Backend works. Frontend UX broken.
- **RIC pipeline** — Tier-based constraint check + LLM audit, SSE streaming. Backend works. Frontend UX broken.
- **AVR pipeline** — Backend route + interface exist, but implementation is mock. Frontend `startAVR()` only switches to empty editor.
- **Translate endpoint** — `/api/pipeline/translate` exists, `translateReference()` in hook exists. Hardcoded to VI.
- **Firebase** — `client.ts`, `auth.ts`, `sessions.ts` scaffolded. Needs env vars to activate.
- **UI shell** — AppLayout (chat+canvas split), ChatPanel, CanvasPanel, FlagCard. All present.

### What's broken (audit findings):
1. **Search UX** — "Search literature" button fires `sendMessage("Find papers on ")` which triggers search with useless query. User never gets to type their topic.
2. **RIC UX** — Paste-only (no file upload), "Check Integrity" button hidden until manuscript exists, flow confusing.
3. **Translate** — Route hardcodes target language to "VI". Translate button on reference cards exists but may not render if search returns nothing.
4. **AVR** — `startAVR()` is empty shell. Does nothing except switch canvas tab.
5. **Idle screen** — "What are you working on?" with 2 buttons that both misfire. User has no idea what to do.

---

## Mindset — READ THIS BEFORE WRITING ANY CODE

This section is the most important part of the plan. If you skip it and go straight to code, the result will be broken again. Every bug in the previous implementation came from not understanding WHO the user is and WHAT this product is supposed to feel like.

### 1. Who is the user?

A Vietnamese clinician (surgeon, internist, pediatrician) at a public or private hospital. They have never published in an international journal. Their English is intermediate — they can read papers slowly but struggle to write. They have no idea what "pipeline," "SSE," "AVR," or "RIC" means.

They come to this app thinking one of two things:
- **"I have a research idea but I don't know where to start."**
- **"I have a draft paper and I want someone to check it before I submit."**

That's it. They are NOT developers. They are NOT researchers at MIT. They are busy doctors who have 30 minutes between surgeries to work on their paper. If they open the app and can't figure out what to do in 10 seconds, they close the tab and never come back.

### 2. What does this product feel like?

It feels like sitting next to a senior researcher who speaks your language. You tell them your idea, they pull up the right papers, help you structure a draft, and point out problems before you embarrass yourself at a journal.

It does NOT feel like a developer tool. It does NOT feel like a dashboard with tabs and pipelines. It does NOT feel like a chatbot that asks you to type magic commands.

### 3. The "Grandmother Test"

Before shipping any screen, ask: **"Could my grandmother figure out what to do next?"**

- If there's a blank screen with no clear action → FAIL
- If there's a button that uses jargon (AVR, RIC, pipeline) → FAIL
- If something fails silently (no error message to the user) → FAIL
- If the user has to know about a hidden feature to use it → FAIL
- If the user has to read documentation to understand the flow → FAIL

### 4. Three non-negotiable rules

**Rule 1: Every failure must be visible.** If an API call fails, if a translation errors, if search returns nothing — the user MUST see a helpful message. `console.error` alone is NOT acceptable. The user doesn't have DevTools open. Every `catch` block must produce a user-facing message.

**Rule 2: Never fabricate.** The AVR tool generates a manuscript draft. The Results section MUST be `[PLACEHOLDER — insert your actual data here]`. If the LLM hallucinates statistics, patient numbers, or p-values, the product is worse than useless — it's dangerous. A clinician might submit fabricated data without realizing it. This is a medical research tool. Lives are downstream.

**Rule 3: Every screen must have an obvious next action.** The user should never wonder "what do I do now?" After search → "Select references, then click Draft." After draft → "Review your manuscript, then click Check Integrity." After integrity check → "Fix the flagged issues, then export." Every state has a visible call-to-action pointing to the next step.

### 5. What went wrong last time (and why)

The previous dev read the spec, understood the code structure, and implemented the features. But they didn't understand the USER. Result:

- Idle screen had a button that sent `"Find papers on "` (empty query) — because the dev wired the button to a function without thinking about what the user would actually experience.
- File upload was removed — because the dev focused on the "paste" code path and forgot that real doctors have .docx files, not clipboard text.
- "Check Integrity" button was hidden until manuscript existed — because the dev wrote a conditional render without thinking: "How does the user discover this feature?"
- Translate "disappeared" — because search returned bad results (from the broken idle screen) → no reference cards rendered → no translate buttons visible. A cascading failure that a user-first mindset would have caught.

**The pattern:** Every bug came from implementing code without simulating the user's journey. Before writing ANY component, mentally walk through: "User opens /app → sees what? → clicks what? → sees what next? → what if it fails?"

### 6. Mental model: Three tools, not a pipeline

```
┌──────────────────────────────────────────────┐
│                WORKSPACE                      │
│                                               │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ SEARCH  │──▶│  AVR    │──▶│  RIC    │    │
│  │         │   │ (Draft) │   │ (Check) │    │
│  └─────────┘   └─────────┘   └─────────┘    │
│       ▲                           ▲          │
│       │                           │          │
│  Can start                   Can start       │
│  from here                   from here       │
│  (idle screen)               (idle screen)   │
└──────────────────────────────────────────────┘
```

The arrow from Search → AVR → RIC is the **happy path** (find papers → draft → check). But RIC can also start independently — a user might have a finished paper and just want an integrity check. Search can also be used alone — just exploring literature.

Do NOT build it as a forced sequence. Every tool works on its own.

---

## Design Philosophy (Summary)

AFA Workspace = **research mentor in a browser**.

**Three tools, clearly separated:**

| Tool | What it does | Entry point | Jargon-free label |
|------|-------------|-------------|-------------------|
| **Search** | Find papers, read abstracts, translate | Idle screen search input | "Search literature" |
| **AVR** | Turn idea + references into structured manuscript draft | "Draft" button after selecting references | "Draft manuscript" |
| **RIC** | Check a manuscript for integrity issues | Idle screen "Check my paper" OR editor button | "Check my paper" |

The terms "AVR" and "RIC" are INTERNAL names. They must NEVER appear in the UI. Users see "Draft manuscript" and "Check integrity."

---

## Part 1: Fix the Idle Screen

### Current (broken):
```
"What are you working on?"
[Search literature]  [Check my paper]
```
Both buttons call `sendMessage()` which sends text directly to the chat regex router — fires search with garbage query or switches to empty editor.

### Target:
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [A logo]                              │
│              AI for Academic                             │
│     Your research mentor — from idea to manuscript      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ What's your research question?                    │  │
│  │ _________________________________________________ │  │
│  │                                      [Search →]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── or ──                                               │
│                                                         │
│  [ Check my paper ]     [ About our tools → ]           │
│                                                         │
└─────────────────────────────────────────────────────┘
```

### Implementation:

**File: `CanvasPanel.tsx`, idle state (lines 404-452)**

Replace the current idle block entirely:

1. Keep the "A" logo mark.
2. Replace "AFA" title with "AI for Academic". Subtitle: "Your research mentor — from idea to manuscript" (EN) / "Người hướng dẫn nghiên cứu — từ ý tưởng đến bản thảo" (VI).
3. **Primary action: Search input field** — A text input (not textarea) + submit button. On submit → call `onSendMessage(inputValue)` which routes through the chat regex to `startSearch()`. This is the ONLY way search triggers from idle — user types their question, then submits.
4. **Secondary actions:**
   - "Check my paper" → `onSelectTab("editor")` — opens editor for paste/upload.
   - "About our tools →" → link to `/products` page.
5. Remove the broken `onSendMessage("Find papers on ")` call entirely.

**Key change:** The idle screen has its OWN input field for search, separate from the chat input. When user submits here, the text goes through `sendMessage()` which hits the search regex. This guarantees the user's actual question reaches the pipeline.

---

## Part 2: Fix Search UX

### Problem:
Search backend works. The issue is: (a) bad trigger from idle screen (fixed in Part 1), (b) reference cards are fine but translate may fail silently.

### Fixes:

**2a. Translate endpoint — fix hardcoded language**

**File: `src/app/api/pipeline/translate/route.ts`**

Current line 33: `const translatedArray = await translateAbstracts([refMock], "VI");`

Change to accept `targetLanguage` from request body:

```typescript
// Add to body type:
let body: { id: string; abstract: string; targetLanguage?: "EN" | "VI" };

// Line 33 — use the provided language or default based on abstract language detection
const targetLang = body.targetLanguage || "VI";
const translatedArray = await translateAbstracts([refMock], targetLang);
```

**File: `src/hooks/useCanvas.ts`, `translateReference()` (line 561-565)**

Add language to the fetch body:

```typescript
body: JSON.stringify({
  id: ref.id,
  abstract: ref.abstract,
  targetLanguage: languageRef.current === "EN" ? "VI" : "EN",
}),
```

Logic: If user's UI language is EN → translate abstract to VI (Vietnamese researcher reading English papers). If UI language is VI → still translate to VI (same use case). Actually, most users are Vietnamese reading English abstracts, so defaulting to VI is correct. But the route should accept the parameter.

**2b. Error feedback on translate failure**

**File: `src/hooks/useCanvas.ts`, `translateReference()` catch block (line 579-581)**

Current: `console.error(error)` — silent failure.

Add user-visible feedback:

```typescript
} catch (error) {
  console.error(error);
  appendMessage({
    role: "agent",
    text: languageRef.current === "EN"
      ? "Translation failed. Please try again."
      : "Dịch thất bại. Vui lòng thử lại.",
  });
}
```

**2c. Empty search results — better guidance**

The empty state in CanvasPanel reference view (line 548-562) says "No references found. Try a different term." — this is fine. But after a failed search, also check if the chat message gives useful guidance.

In `useCanvas.ts`, the "done" handler for step 1 (line 262-270) already handles count === 0. This is fine. No change needed.

---

## Part 3: Fix RIC UX

### Problems:
1. No file upload — paste only.
2. "Check Integrity" button hidden until manuscript exists.
3. Flow is confusing — user doesn't know where to paste or what to do.

### Fixes:

**3a. Add file upload to editor view**

**File: `CanvasPanel.tsx`, editor view (lines 567-616)**

Add a file upload zone above the textarea:

```tsx
{/* Upload + paste zone */}
{!manuscript && (
  <div className="mb-4">
    <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all cursor-pointer">
      <input
        type="file"
        accept=".txt,.md,.doc,.docx,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
      <svg ...upload icon... />
      <p className="text-sm text-stone-500 mt-2">
        {language === "EN" ? "Upload your manuscript" : "Tải lên bản thảo"}
      </p>
      <p className="text-xs text-stone-400 mt-1">
        {language === "EN" ? ".txt, .md, .docx, or .pdf" : ".txt, .md, .docx, hoặc .pdf"}
      </p>
    </label>
    <div className="text-center text-xs text-stone-400 my-2">
      {language === "EN" ? "— or paste below —" : "— hoặc dán bên dưới —"}
    </div>
  </div>
)}
```

**File upload handler** — add to CanvasPanel or pass as prop:

```typescript
async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    const text = await file.text();
    onUpdateManuscript(text);
  } else if (file.name.endsWith('.docx')) {
    // Use mammoth.js to extract text from docx
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    onUpdateManuscript(result.value);
  } else if (file.name.endsWith('.pdf')) {
    // Use pdf.js to extract text
    // Or: show message that PDF text extraction is limited
    onUpdateManuscript(`[PDF uploaded: ${file.name} — paste text manually if extraction fails]`);
  }
}
```

Add `mammoth` to dependencies: `npm install mammoth`

**3b. Always show "Check Integrity" button**

**File: `CanvasPanel.tsx`, editor view header (lines 579-594)**

Current: `{manuscript && (<div className="flex gap-2">...buttons...</div>)}`

Change: Always show the Check Integrity button. Disable it when no manuscript. This way user sees the call-to-action immediately.

```tsx
<div className="flex gap-2">
  {manuscript && (
    <button onClick={() => navigator.clipboard.writeText(manuscript)} ...>
      Copy
    </button>
  )}
  <button
    onClick={() => onStartRIC()}
    disabled={!manuscript.trim()}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      manuscript.trim()
        ? "bg-[#C4634E] text-white hover:bg-[#b45743]"
        : "bg-stone-100 text-stone-400 cursor-not-allowed"
    }`}
  >
    {language === "EN" ? "Check Integrity" : "Kiểm tra toàn vẹn"}
  </button>
</div>
```

**3c. Add Check Integrity button ALSO at the bottom of textarea**

After the word count display (line 609-614), add a prominent button:

```tsx
{manuscript.trim() && (
  <button
    onClick={() => onStartRIC()}
    className="mt-3 w-full py-2.5 rounded-xl bg-[#C4634E] text-white text-sm font-medium hover:bg-[#b45743] transition-colors"
  >
    {language === "EN" ? "Check Integrity →" : "Kiểm tra toàn vẹn →"}
  </button>
)}
```

---

## Part 4: Implement AVR

### Architecture Decision

The AVR spec (see `02_PRODUCT/AVR/`) describes a full FastAPI backend with PostgreSQL, ChromaDB, etc. That's the **long-term vision**.

For the Workspace MVP (hackathon + funding), we implement a **simplified AVR** that runs within the existing Next.js app using the LLM (Gemini) directly. No separate backend, no ChromaDB, no journal vector DB.

### What MVP AVR does:

```
Selected references + research question
     ↓
LLM: Detect study design + extract attributes (1 call)
     ↓
LLM: Generate structured abstract with [PLACEHOLDER] for results (1 call)
     ↓
Stream as manuscript_chunk events
```

This captures the core value: "turn a research question into a structured draft." The full constraint engine, gate, reviewer simulation — those come later when AVR gets its own backend.

### Implementation:

**File: `src/lib/pipeline/avr/real.ts` (NEW)**

```typescript
import { callLLM } from "@/lib/llm";
import type { AVRModule } from "./interface";
import type { AVRRequest, Blueprint, SSEEvent } from "@/lib/pipeline/types";

export const avrReal: AVRModule = {
  async run(request: AVRRequest, emit: (event: SSEEvent) => void) {
    emit({
      type: "status",
      data: { status: "drafting", message: "Analyzing research question..." },
    });

    // Step 1: Build blueprint via LLM
    emit({
      type: "log",
      data: { tool: "AVR", message: "Building research blueprint...", timestamp: new Date().toISOString() },
    });

    const referenceContext = request.references
      .slice(0, 8)
      .map((r, i) => `[${i + 1}] ${r.title} (${r.authors.slice(0, 2).join(", ")}, ${r.year}). ${r.journal}. Abstract: ${r.abstract.slice(0, 300)}`)
      .join("\n\n");

    const blueprintResponse = await callLLM({
      messages: [
        {
          role: "system",
          content: `You are a research methodology expert. Analyze the user's research question and provided references. Return a JSON object with:
{
  "articleType": "original_research" | "case_report" | "systematic_review" | "narrative_review",
  "title": "suggested paper title",
  "studyDesign": "retrospective_cohort" | "prospective_cohort" | "cross_sectional" | "case_control" | "rct" | "diagnostic_accuracy" | "case_series",
  "population": "description of study population",
  "primaryEndpoint": "measurable primary outcome",
  "sections": [
    {"heading": "section name", "instructions": "what to write here", "referenceIds": ["ref-001"]}
  ]
}
Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Research question: ${request.query}\n\nReferences:\n${referenceContext}`,
        },
      ],
      responseFormat: "json",
      temperature: 0.2,
      maxTokens: 2048,
    });

    let blueprint: Blueprint;
    try {
      const parsed = JSON.parse(blueprintResponse);
      blueprint = {
        articleType: parsed.articleType || "original_research",
        title: parsed.title || request.query,
        sections: parsed.sections || [],
      };
    } catch {
      blueprint = {
        articleType: "original_research",
        title: request.query,
        sections: [
          { heading: "Introduction", instructions: "Background and study aim", referenceIds: [] },
          { heading: "Methods", instructions: "Study design and analysis", referenceIds: [] },
          { heading: "Results", instructions: "[PLACEHOLDER]", referenceIds: [] },
          { heading: "Discussion", instructions: "Interpretation and limitations", referenceIds: [] },
        ],
      };
    }

    emit({ type: "blueprint", data: blueprint });

    // Step 2: Generate manuscript section by section
    emit({
      type: "log",
      data: { tool: "AVR", message: "Generating structured manuscript...", timestamp: new Date().toISOString() },
    });

    const isVI = request.language === "VI";

    const manuscriptPrompt = `You are a senior research mentor helping a Vietnamese clinician write their first international paper.

Based on this blueprint and references, generate a structured manuscript draft.

RULES:
1. Write in English. Add Vietnamese explanatory notes in [brackets] for complex concepts.
2. Results section = [PLACEHOLDER] — do NOT fabricate data.
3. Conclusion must be conditional: "If results show X, then Y..."
4. Cite references as [1], [2], etc. matching the provided list.
5. Use IMRaD structure (Introduction, Methods, Results, Discussion).
6. Keep each section focused and concise (~200-400 words each).
7. Include a "Limitations" subsection in Discussion with at least 3 honest limitations.

Blueprint: ${JSON.stringify(blueprint)}

References:
${referenceContext}

Generate the full manuscript draft now.`;

    const manuscript = await callLLM({
      messages: [
        { role: "system", content: "You are a research writing mentor. Generate academic manuscripts." },
        { role: "user", content: manuscriptPrompt },
      ],
      temperature: 0.3,
      maxTokens: 4096,
    });

    // Stream in chunks (simulate streaming for better UX)
    const paragraphs = manuscript.split(/\n\n+/);
    for (const para of paragraphs) {
      emit({ type: "manuscript_chunk", data: { content: para + "\n\n" } });
    }

    emit({ type: "done", data: { step: 2 } });

    return { manuscript, blueprint };
  },
};
```

**File: `src/lib/pipeline/avr/index.ts` — swap mock for real:**

```typescript
import { type AVRModule } from "./interface";
import { avrReal } from "./real";

export const avrModule: AVRModule = avrReal;
```

**File: `src/hooks/useCanvas.ts` — wire `startAVR()`:**

Replace the current empty `startAVR()` (lines 477-479):

```typescript
async function startAVR() {
  const query = messages.find((m) => m.role === "user")?.text ?? "";
  if (!query.trim()) {
    appendMessage({
      role: "agent",
      text: languageRef.current === "EN"
        ? "Please search for references first, then click Draft."
        : "Vui lòng tìm tài liệu trước, sau đó bấm Viết bản thảo.",
    });
    return;
  }

  const refs = referencesRef.current.filter((r) =>
    selectedReferenceIdsRef.current.includes(r.id),
  );

  if (refs.length === 0) {
    appendMessage({
      role: "agent",
      text: languageRef.current === "EN"
        ? "Please select at least one reference to draft from."
        : "Vui lòng chọn ít nhất một tài liệu để viết.",
    });
    return;
  }

  setManuscript("");
  manuscriptRef.current = "";
  setErrorMessage(null);
  pushCanvas("editor", "Draft");

  appendMessage({
    role: "agent",
    text: languageRef.current === "EN"
      ? "Generating manuscript draft from selected references..."
      : "Đang tạo bản thảo từ các tài liệu đã chọn...",
  });

  try {
    if (userId) void trackUsage(userId, "avr");
    await consumeSSE(
      "/api/pipeline/avr",
      {
        query,
        references: refs,
        language: languageRef.current,
      },
      handleEvent,
    );
  } catch (error) {
    setStatus("error");
    const msg = error instanceof Error ? error.message : "AVR failed";
    setErrorMessage(msg);
    appendMessage({
      role: "agent",
      text: languageRef.current === "EN"
        ? `Draft generation failed: ${msg}`
        : `Tạo bản thảo thất bại: ${msg}`,
    });
  }
}
```

**File: `src/lib/pipeline/avr/mock.ts` — delete this file.**

---

## Part 5: Polish Chat Panel

### Minor fixes:

**5a. Welcome message — clearer, mentor tone**

**File: `useCanvas.ts`, welcome message (lines 103-109)**

Replace:
```
"Hi! I'm AFA Assistant. I can help you search literature, draft a manuscript (AVR), or check research integrity (RIC). What would you like to do?"
```

With:
```
"Welcome to AI for Academic. I'm your research mentor.\n\nStart by typing a research question in the Canvas — I'll find relevant papers, help you draft a manuscript, and check it for integrity issues before you submit."
```

Vietnamese:
```
"Chào mừng đến AI for Academic — trợ lý nghiên cứu của bạn.\n\nBắt đầu bằng cách nhập câu hỏi nghiên cứu ở Canvas bên phải — tôi sẽ tìm tài liệu, giúp bạn viết bản thảo, và kiểm tra trước khi nộp."
```

Drop jargon: no "AVR", no "RIC", no "literature search pipeline."

**5b. Fallback message — more helpful**

**File: `useCanvas.ts`, fallback in `sendMessage()` (lines 518-524)**

Replace the bullet-point fallback with something conversational:

```
EN: "I'm not sure what you'd like to do. Try typing a research question like 'What is the evidence for laparoscopic vs open appendectomy in children?' and I'll search for relevant papers."

VI: "Tôi chưa hiểu rõ yêu cầu. Hãy thử nhập câu hỏi nghiên cứu, ví dụ: 'So sánh phẫu thuật nội soi và mổ mở ruột thừa ở trẻ em' — tôi sẽ tìm tài liệu liên quan."
```

---

## Part 6: Mobile UX Fix

**File: `AppLayout.tsx`**

The mobile tab bar (lines 26-40) sits at `absolute top-0` and both panels have `pt-10 md:pt-0` to compensate. This works but the mobile tabs overlap with the main site Nav.

Verify: Does the site Nav (`Nav.tsx`) render on the `/app` page? If yes, mobile users see TWO navigation bars (site nav + chat/canvas tabs). Consider hiding the site Nav on `/app` route for mobile, or make the mobile tab bar part of the layout instead of absolute positioned.

This is a CSS-only fix — check on actual mobile viewport.

---

## Part 7: Firebase Activation

Firebase code is already scaffolded. To activate:

1. Create Firebase project at console.firebase.google.com
2. Enable Authentication → Google sign-in
3. Create Firestore database (production mode, asia-southeast1)
4. Copy config values to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

5. Test: Sign in → search → verify session saved to Firestore.

**No code changes needed** — the `isConfigured()` guard in `client.ts` handles the "no env vars" case gracefully (guest mode).

---

## Part 8: Dockerfile (for cloud applications)

**File: `Dockerfile` (already exists from Antigravity commit)**

Verify it builds:

```bash
docker build -t afa .
docker run -p 3000:3000 --env-file .env.local afa
```

**File: `next.config.ts` — ensure `output: "standalone"` is set.**

---

## File Changes Summary

### New Files
```
src/lib/pipeline/avr/real.ts          — AVR implementation (MVP)
```

### Modified Files
```
src/app/app/components/CanvasPanel.tsx — Idle screen redesign, file upload, RIC button fixes
src/hooks/useCanvas.ts                — Wire startAVR(), fix welcome msg, fix translate lang
src/app/api/pipeline/translate/route.ts — Accept targetLanguage param
src/lib/pipeline/avr/index.ts         — Swap mock → real
package.json                          — Add mammoth
```

### Deleted Files
```
src/lib/pipeline/avr/mock.ts          — Replaced by real.ts
```

---

## Priority Order for Dev

| # | Task | Est. effort | Impact |
|---|------|-------------|--------|
| 1 | Fix idle screen (Part 1) | 30 min | Fixes "user doesn't know what to do" |
| 2 | Implement AVR real.ts + wire hook (Part 4) | 2 hours | Core feature — demo showstopper |
| 3 | Fix RIC: add file upload + button visibility (Part 3) | 1 hour | Fixes "RIC is broken" |
| 4 | Fix translate endpoint language (Part 2) | 15 min | Fixes silent translate failures |
| 5 | Polish chat messages (Part 5) | 15 min | Better first impression |
| 6 | Mobile UX check (Part 6) | 30 min | Ensures mobile works |
| 7 | Firebase activation (Part 7) | 30 min | Enables user tracking |
| 8 | Dockerfile verify (Part 8) | 15 min | Cloud application readiness |

**Total estimated: ~5 hours of focused dev work.**

---

## Acceptance Criteria (for audit)

After implementation, every one of these must work:

1. ✅ Open `/app` → see "AI for Academic" with search input field on canvas
2. ✅ Type "laparoscopic vs open appendectomy in children" → submit → references stream in
3. ✅ Click "Translate" on a reference → abstract translates inline (Vietnamese)
4. ✅ Click "Translate all" in bulk toolbar → all selected references translate
5. ✅ Click "Draft" in bulk toolbar → AVR generates manuscript → streams into editor
6. ✅ Editor shows generated manuscript with word count
7. ✅ Click "Check Integrity" → RIC runs → flags appear with score
8. ✅ Go to `/app` → click "Check my paper" → editor opens → can upload .docx file
9. ✅ Upload .docx → text extracted → "Check Integrity" button visible and works
10. ✅ Paste text into editor → "Check Integrity" button visible at top AND bottom
11. ✅ Mobile: chat/canvas tabs switch correctly, no overlapping navbars
12. ✅ All emoji removed from UI chrome (buttons, tabs, labels)
13. ✅ `npm run build` passes with zero errors
14. ✅ No console errors during normal usage flow

---

## What This Plan Does NOT Cover (Future)

- Full AVR backend (FastAPI, PostgreSQL, ChromaDB, constraint engine, gate, reviewer simulation) — see `02_PRODUCT/AVR/` specs
- Anthropic/Claude LLM swap — conditional on hackathon acceptance
- Paid tier / subscription — post-MVP
- Session history sidebar — post-MVP
- Research Roadmap export (PDF/Word) — post-MVP
- Novelty Check (PubMed scan for similar papers) — post-MVP
