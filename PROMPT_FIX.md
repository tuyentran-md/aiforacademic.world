# UI/UX Overhaul — AFA Pipeline

> **For:** Bi (ClawBot build agent)
> **Repo:** `aiforacademic.world` — Next.js 15 / React 19 / Tailwind 4
> **Branch:** work on `main` directly, commit when done
> **Rule:** Do NOT touch backend files (`src/lib/pipeline/`, `src/lib/llm/`, `src/app/api/`). This prompt is UI-only.

---

## Context

The pipeline app at `/app` works (Search → AVR → RIC) but the UX/UI is weak. These are the fixes needed, ordered by priority. Do ALL of them in one pass.

---

## FIX 1 — Restore Landing Page (CRITICAL)

**Problem:** `src/app/page.tsx` currently does `redirect("/app")`. The entire marketing landing page is gone — no hero, no tool cards, no email capture. Visitors see an empty chat.

**What to do:**

Restore the landing page at `/`. Use the git history to recover the old content (commit `6f08292` has the original). The landing page should have:

1. **Hero section** — keep the existing "AI tools for academic works" heading
2. **Pipeline CTA** — a prominent card above the tools grid:
```tsx
<Link href="/app" className="block rounded-2xl p-8 bg-gradient-to-br from-stone-900 to-stone-800 text-white hover:opacity-95 transition-opacity">
  <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">New</p>
  <p className="text-2xl font-serif font-bold mb-2">From question to manuscript in minutes</p>
  <p className="text-sm text-stone-400">Search literature → Generate draft → Check integrity — powered by AI.</p>
</Link>
```
3. **Tools grid** — the 4 tool cards (RIC, Translator, SRMA, AVR) as before
4. **Email capture** — the existing `<EmailCapture />` component
5. **Footer** — the existing `<Footer />` component

Do NOT redirect `/` to `/app`. The landing page IS the homepage.

---

## FIX 2 — Example Query Buttons on /app

**Problem:** User opens `/app` and sees an empty textarea. No idea what to type.

**What to do:**

In `LeftPanel.tsx`, when `query` is empty (before first search), show 3-4 clickable example query buttons above the chat input. When clicked, they fill the input AND auto-submit (call `onSearch`).

```tsx
const EXAMPLES = [
  "Outcomes of cleft palate repair techniques in children",
  "AI-assisted diagnosis in radiology: systematic review",
  "Laparoscopic versus open appendectomy in pediatric patients",
  "Pressure dressing after circumcision in children",
];
```

Style them as subtle pill buttons:
```
className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition text-left"
```

Place them in the empty-state area (replace the current dashed-border placeholder text). Label with a small header: "Try an example" in `text-[11px] uppercase tracking-widest text-stone-400`.

---

## FIX 3 — Auto-Chain Pipeline (HIGH IMPACT)

**Problem:** User must manually click "Continue" between each step. For a hackathon demo, this kills the magic. Pipeline should flow automatically.

**What to do:**

In `src/hooks/usePipeline.ts`, add auto-chain logic:

1. After `startSearch` completes successfully and `references.length > 0`:
   - Auto-select all references
   - Wait 1.5 seconds (so user sees the papers)
   - Auto-call `startAVR()`
   - Auto-switch `activeView` to 2

2. After `startAVR` completes successfully and `manuscript` is non-empty:
   - Wait 1.5 seconds
   - Auto-call `startRIC()`
   - Auto-switch `activeView` to 3

The user can still click tabs to go back and review earlier steps. The "Continue" buttons remain but are only needed if the user wants to re-run a step manually.

**Implementation hint:** In the `consumeSSE` handler, when you receive a `done` event for step 1, set a timeout that triggers step 2. Same for step 2 → step 3. Make sure to check that the component is still mounted (use a ref flag) to avoid calling on unmounted state.

Add a `autoChain` boolean state (default `true`). If user clicks a tab manually or edits the manuscript, set `autoChain = false` to pause auto-progression. User can re-enable by clicking "Auto" toggle or just click Continue manually.

---

## FIX 4 — Human-Friendly Log Messages

**Problem:** Log entries show developer jargon: `[PubMed] Fetching papers...`, `[System] 8 unique references after dedup`. Researchers don't know what "dedup" means.

**What to do:**

In `src/lib/pipeline/search/index.ts` (this is the ONLY backend file you may edit for this fix), update the `emit` log messages:

| Current message | New message |
|----------------|-------------|
| `Refining search query...` | `Preparing your search...` |
| `Searching: "${refinedQuery}"...` (PubMed) | `Searching medical databases...` |
| `Searching: "${refinedQuery}"...` (OpenAlex) | `Searching academic databases...` |
| `${allRefs.length} unique references after dedup` | `Found ${allRefs.length} relevant papers` |
| `Ranking by relevance...` | `Ranking papers by relevance...` |
| `Translating abstracts to Vietnamese...` | `Translating abstracts to Vietnamese...` (keep) |
| `Translated ${count} abstracts` | `Translation complete` |

Also in AVR and RIC log messages (in `src/lib/pipeline/avr/mock.ts` and `src/lib/pipeline/ric/index.ts`):
- `Analyzing references...` → `Preparing manuscript structure...`
- `Writing section: ${heading}...` → `Writing: ${heading}...` (keep but shorter)
- `Checking manuscript integrity...` → `Reviewing manuscript for issues...`
- `Analyzing: ${heading}...` → `Checking: ${heading}...`

---

## FIX 5 — Remove "Artifact" Label

**Problem:** Right panel header says "Artifact" — meaningless to researchers.

**What to do:**

In `RightPanel.tsx`:
- Remove the "Artifact" label (`<p>Artifact</p>`)
- Remove the `getArtifactLabel` and `getArtifactSummary` functions
- The section header should just show the Pipeline Tracker tabs (Papers/Draft/Review) directly
- Keep the Pipeline Tracker component but move it to be the primary header element
- Below the tabs, show a one-line contextual status: "8 papers found" / "Draft in progress..." / "Score: 78/100" depending on active view

---

## FIX 6 — Reduce Visual Noise (border-radius, shadows, typography)

**Problem:** Everything is `rounded-[28px]`+ with heavy custom shadows. Looks bubbly, not professional.

**What to do — apply globally across ALL pipeline components:**

### Border radius reduction
| Element type | Current | New |
|-------------|---------|-----|
| Main panels (LeftPanel, RightPanel outer) | `rounded-[32px]` | `rounded-2xl` (16px) |
| Cards (ReferenceCard, FlagCard, ArtifactShell) | `rounded-[24px]` or `rounded-[28px]` | `rounded-xl` (12px) |
| Inner containers (abstract box, manuscript preview) | `rounded-[28px]` or `rounded-2xl` | `rounded-lg` (8px) |
| Buttons | `rounded-full` | Keep `rounded-full` for pills, use `rounded-lg` for action buttons |
| Chat input outer | `rounded-[28px]` | `rounded-xl` |
| Textarea | `rounded-[22px]` | `rounded-lg` |

### Shadow reduction
Replace ALL custom shadows with Tailwind defaults:
| Current | New |
|---------|-----|
| `shadow-[0_22px_50px_rgba(17,17,16,0.06)]` | `shadow-lg` |
| `shadow-[0_20px_48px_rgba(17,17,16,0.08)]` | `shadow-lg` |
| `shadow-[0_16px_30px_rgba(17,17,16,0.12)]` | `shadow-md` |
| `shadow-[0_14px_34px_rgba(17,17,16,0.04)]` | `shadow-sm` |
| `shadow-[0_14px_32px_rgba(17,17,16,0.04)]` | `shadow-sm` |
| `shadow-[0_12px_32px_rgba(17,17,16,0.05)]` | `shadow-sm` |
| `shadow-[0_10px_24px_rgba(17,17,16,0.04)]` | `shadow-sm` |

### Typography cleanup
Standardize heading sizes:
| Role | Current (varies) | New |
|------|-------------------|-----|
| Page-level heading | `text-[1.7rem]`, `text-[1.9rem]`, `text-[2rem]` | `text-2xl` (1.5rem) |
| Section heading | varies | `text-xl` (1.25rem) |
| Card heading | varies | `text-base` font-semibold |

Remove excessive subtitle text. Each section does NOT need a `<p>` explaining what it does. The UI should be self-explanatory. Specifically delete these subtitle texts:
- "This pane keeps the outputs from the pipeline while the chat on the left handles the request."
- "Ask once. The artifact pane keeps the papers, draft, and review."
- "AFA turns your selected papers into a first manuscript structure here."
- "AFA will flag weak claims, missing support, and citation issues here."
- "When the pipeline runs, search, draft, and review updates will stream here."

Replace with shorter single-line statuses where needed.

---

## FIX 7 — Brand Color for Primary Actions

**Problem:** Everything is stone/gray. The brand color `#C4634E` (rust) is absent from the pipeline UI.

**What to do:**

Apply `#C4634E` (or Tailwind equivalent: custom class or inline style) to:
1. **Send button** — `bg-[#C4634E]` instead of `bg-stone-900`
2. **Continue / Run review buttons** — same `bg-[#C4634E]`
3. **Active pipeline step indicator dot** — `bg-[#C4634E]` instead of `bg-sky-400`
4. **Streaming cursor** — `bg-[#C4634E]` instead of `bg-violet-500`

Keep `bg-stone-900` for secondary actions (Reset, Copy, language toggle active state).

Also add a subtle brand accent to the pipeline page header bar:
```tsx
<div className="... border-l-4 border-[#C4634E] ...">
```

---

## FIX 8 — Pipeline Tracker Redesign

**Problem:** Current tracker is just 3 pill buttons with no visual flow.

**What to do:**

Redesign `PipelineTracker.tsx` to show a horizontal stepper with connecting lines:

```
  ①─────────②─────────③
 Papers     Draft     Review
  ✓ 8       ● Active   ○ Waiting
```

Structure:
```tsx
<div className="flex items-center gap-0">
  {steps.map((step, i) => (
    <Fragment key={step.id}>
      {/* Step circle + label */}
      <button onClick={...} className="flex flex-col items-center gap-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${completed ? 'bg-emerald-500 text-white' :
            active ? 'bg-[#C4634E] text-white animate-pulse' :
            'bg-stone-200 text-stone-500'}`}>
          {completed ? '✓' : step.number}
        </div>
        <span className="text-xs font-medium text-stone-600">{step.label}</span>
        <span className="text-[10px] text-stone-400">{step.badge}</span>
      </button>
      {/* Connecting line (not after last step) */}
      {i < steps.length - 1 && (
        <div className={`flex-1 h-0.5 mx-1 ${nextCompleted ? 'bg-emerald-400' : 'bg-stone-200'}`} />
      )}
    </Fragment>
  ))}
</div>
```

Badge text:
- Step 1: show count like "8 papers" or "Searching..."
- Step 2: "Ready" or "Writing..." or empty if locked
- Step 3: "78/100" or "Checking..." or empty if locked

Remove the "Locked" / "Empty" labels — just use dim styling for unavailable steps.

---

## FIX 9 — Shrink Chat Input

**Problem:** Textarea is `min-h-[148px]` (5 rows) — too tall for a single query.

**What to do in `ChatInput.tsx`:**

1. Change `rows={5}` → `rows={2}`
2. Change `min-h-[148px]` → `min-h-[72px]`
3. Shorten the placeholder:
```
"What's your research question?"
```
4. Move the "Press Enter to send" hint into the textarea placeholder or remove it (people know how Enter works)
5. After query is submitted and pipeline is running, collapse the input area to show just the submitted query as a small banner, not a big disabled textarea

---

## FIX 10 — Mobile Improvements

**Problem:** Mobile toggle says "Ask" / "Results" which is vague.

**What to do:**
- Rename "Ask" → "Chat"
- Rename "Results" → "Output"
- When pipeline is running on mobile, auto-switch to "Output" view so user sees the action

---

## Verification Checklist

After making all changes, verify:

- [ ] `npm run build` passes with 0 errors
- [ ] `/` shows the landing page (NOT a redirect to /app)
- [ ] `/app` shows the pipeline with example query buttons
- [ ] Clicking an example query starts the full pipeline automatically (auto-chain)
- [ ] Pipeline tracker shows connected steps with visual flow
- [ ] Brand color `#C4634E` appears on Send, Continue, active step
- [ ] No `rounded-[28px]` or `rounded-[32px]` remains in pipeline components
- [ ] No custom `shadow-[0_XXpx...]` remains in pipeline components
- [ ] Log messages are human-friendly (no "dedup", no raw tool names)
- [ ] "Artifact" label is gone from right panel
- [ ] Mobile works: Chat/Output toggle, auto-switch on run
- [ ] All existing routes still work: `/ric`, `/trans`, `/srma`, `/blog`, `/about`, `/resources`

---

## Files to Modify (exhaustive list)

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Restore landing page (recover from git history commit `6f08292`) + add Pipeline CTA |
| `src/app/app/page.tsx` | Update mobile toggle labels |
| `src/app/app/components/LeftPanel.tsx` | Example queries, reduce radius/shadow/typography |
| `src/app/app/components/ChatInput.tsx` | Shrink input, shorter placeholder |
| `src/app/app/components/RightPanel.tsx` | Remove "Artifact", reduce visual noise, contextual status |
| `src/app/app/components/PipelineTracker.tsx` | Full redesign with stepper + connecting lines |
| `src/app/app/components/ReferenceCard.tsx` | Reduce radius/shadow |
| `src/app/app/components/ReferenceList.tsx` | Reduce radius/shadow |
| `src/app/app/components/ManuscriptEditor.tsx` | Brand color buttons, reduce radius/shadow, remove subtitle |
| `src/app/app/components/IntegrityOverlay.tsx` | Brand color, reduce radius/shadow, remove subtitle |
| `src/app/app/components/FlagCard.tsx` | Reduce radius |
| `src/app/app/components/LogEntry.tsx` | Reduce radius |
| `src/hooks/usePipeline.ts` | Auto-chain logic |
| `src/lib/pipeline/search/index.ts` | Human-friendly log messages |
| `src/lib/pipeline/avr/mock.ts` | Human-friendly log messages |
| `src/lib/pipeline/ric/index.ts` | Human-friendly log messages |

**Do NOT modify any other files.** Specifically do not touch: `src/lib/llm/`, `src/app/api/pipeline/*/route.ts`, `src/lib/pipeline/types.ts`, `src/lib/pipeline/sse.ts`, `next.config.ts`, `package.json`.

Commit message: `fix(ui): overhaul pipeline UX — landing page, auto-chain, visual polish`
