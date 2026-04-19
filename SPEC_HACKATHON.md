# AFA (AI For Academic) — Hackathon Edition: Full Build Spec

> **Audience:** Bi (ClawBot) — build agent. Đọc spec này rồi code. Không cần hỏi thêm.
> **Repo:** `aiforacademic.world` (Next.js 15 / React 19 / Tailwind 4 / TypeScript 5)
> **Deploy:** Vercel
> **Date:** 2026-04-19

---

## Table of Contents

1. [Goals & Constraints](#1-goals--constraints)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Models & Types](#3-data-models--types)
4. [API Routes Spec](#4-api-routes-spec)
5. [Pipeline Orchestration](#5-pipeline-orchestration)
6. [UI Spec — Split-View Layout](#6-ui-spec--split-view-layout)
7. [Tool 1: Search & Translator](#7-tool-1-search--translator)
8. [Tool 2: AVR (The Architect & Writer)](#8-tool-2-avr-the-architect--writer)
9. [Tool 3: RIC (The Auditor)](#9-tool-3-ric-the-auditor)
10. [SRMA (Standalone)](#10-srma-standalone)
11. [Existing Pages to Keep](#11-existing-pages-to-keep)
12. [Environment Variables](#12-environment-variables)
13. [File Structure (Target)](#13-file-structure-target)
14. [Implementation Order](#14-implementation-order)
15. [Non-Goals (Hackathon Scope)](#15-non-goals-hackathon-scope)

---

## 1. Goals & Constraints

### What we're building
A unified AI-powered research assistant that chains 3 tools in a pipeline:

```
User Query → [Search & Translate] → [AVR: Draft] → [RIC: Audit] → Final Output
```

Plus SRMA as a standalone tool (not part of the pipeline).

### Hackathon success criteria
- **One-page demo:** User types a research question → watches the pipeline work in real-time → gets a draft manuscript with integrity report
- **Split-view UI:** Left = chat/control, Right = dynamic workspace showing pipeline output
- **Streaming:** All LLM outputs stream to UI in real-time
- **Client-side orchestration:** The React app explicitly runs Search → AVR → RIC as separate streaming steps

### Constraints
- **LLM API:** Google Gemini (`gemini-2.5-flash`) for now. Architecture MUST be provider-agnostic so we can swap to Anthropic Claude later. All LLM calls go through a single abstraction layer.
- **No auth/payment** for hackathon — strip LemonSqueezy/subscription logic from pipeline pages (keep on standalone RIC page if needed)
- **AVR module:** Define the interface only. Implementation will be plugged in by a separate dev. Provide a mock/placeholder that returns sample output so the pipeline demo works end-to-end.
- **Budget:** PubMed & OpenAlex APIs are free. Gemini Flash is cheap. No paid API dependencies.

---

## 2. Architecture Overview

### Current → Target

**Current (microservice):**
```
aiforacademic.world (landing + blog)
  ├── /ric → proxy to researchcheck.vercel.app
  ├── /trans → proxy to med-translator-swart.vercel.app
  ├── /srma → static page (Python CLI tool)
  └── /products, /blog, /about, /resources → static pages
```

**Target (monolith):**
```
aiforacademic.world
  ├── / → redirect to /app (current product decision)
  ├── /app → NEW: Pipeline UI (split-view, the main hackathon feature)
  ├── /ric → KEEP proxy (standalone RIC still accessible)
  ├── /trans → KEEP proxy (standalone Translator still accessible)
  ├── /srma → KEEP (standalone page)
  ├── /blog, /resources → KEEP as-is
  ├── /about → KEEP, but simplified into a compact Q&A / tab layout
  │
  ├── /api/pipeline/search → NEW: Search & Translate tool
  ├── /api/pipeline/avr → NEW: AVR tool (placeholder)
  ├── /api/pipeline/ric → NEW: RIC integrity check tool
  └── /api/pipeline/smoke → NEW: SSE smoke test route
```

### Key architectural decisions
1. **SSE (Server-Sent Events)** for streaming pipeline state + LLM output to the client. NOT WebSocket — simpler, works on Vercel serverless.
2. **No server-side pipeline orchestrator:** there is NO `/api/pipeline/run` route. Search, AVR, and RIC each expose their own `POST` SSE endpoint, and the client drives sequencing. This removes the earlier ambiguity around LLM-driven orchestration and makes retries/auditing simpler.
3. **Stateless:** No database for the pipeline. All state lives in the SSE stream for the duration of a request. Context (papers, drafts) passed between tools via in-memory objects on the server.
4. **Vercel function timeout:** Vercel Hobby = 60s, Pro = 300s. Pipeline may need Pro plan OR we chunk into multiple requests with client-side orchestration. **Decision: Use client-side orchestration** — the client calls each step sequentially, passing context forward. This is more resilient and debuggable.
5. **Client transport:** Because these streaming routes are `POST` endpoints, the browser consumes SSE via `fetch` + `ReadableStream` parsing, NOT native `EventSource`.

### Revised architecture: Client-Side Orchestration

```
Client (React)
  │
  ├── Step 1: POST /api/pipeline/search  → SSE stream → { references[] }
  │     (client stores references in state)
  │
  ├── Step 2: POST /api/pipeline/avr     → SSE stream → { manuscript }
  │     (client sends references + query, stores manuscript)
  │
  └── Step 3: POST /api/pipeline/ric     → SSE stream → { integrityReport }
        (client sends manuscript + references, stores report)
```

Benefits:
- Each step is independent, fits in Vercel timeout
- User can see progress between steps
- If one step fails, user can retry just that step
- Easy to add manual intervention between steps (edit draft before RIC check)

### Audit notes

These points are intentionally locked for future review:
- `/api/pipeline/run` is out of scope and should not be introduced later without revising this spec
- `EventSource` is not the client transport for the pipeline because all streaming routes are `POST`
- Phase 1 is only considered complete when the SSE smoke route exists and streams successfully

---

## 3. Data Models & Types

Create file: `src/lib/pipeline/types.ts`

```typescript
// ─── Reference (output of Search & Translate) ────────────────────────

export interface Reference {
  id: string;                    // unique within session (e.g., "ref-001")
  source: "pubmed" | "openalex"; // which API found it
  pmid?: string;                 // PubMed ID if from PubMed
  openalexId?: string;           // OpenAlex ID if from OpenAlex
  doi?: string;
  title: string;
  authors: string[];             // ["Smith J", "Doe A"]
  journal: string;
  year: number;
  abstract: string;              // original language
  abstractTranslated?: string;   // Vietnamese translation (if user lang = VI)
  url: string;                   // link to full text or DOI resolver
  citationCount?: number;        // from OpenAlex
  relevanceScore?: number;       // 0-1, assigned by LLM after ranking
  meshTerms?: string[];          // MeSH terms from PubMed
  concepts?: string[];           // concepts from OpenAlex
}

// ─── Pipeline Session State ──────────────────────────────────────────

export interface PipelineSession {
  id: string;                    // UUID
  query: string;                 // original user query
  language: "EN" | "VI";         // user's preferred language
  status: PipelineStatus;
  currentStep: 1 | 2 | 3;
  references: Reference[];       // populated after step 1
  manuscript: string;            // populated after step 2 (markdown)
  blueprint: Blueprint;          // populated during step 2
  integrityReport: IntegrityReport; // populated after step 3
  createdAt: string;             // ISO timestamp
}

export type PipelineStatus =
  | "idle"
  | "searching"
  | "translating"
  | "drafting"
  | "auditing"
  | "completed"
  | "error";

// ─── AVR Blueprint ───────────────────────────────────────────────────

export interface Blueprint {
  articleType: ArticleType;
  title: string;
  sections: BlueprintSection[];
}

export type ArticleType =
  | "case_report"
  | "narrative_review"
  | "systematic_review"
  | "original_research"
  | "letter_to_editor"
  | "editorial"
  | "brief_communication";

export interface BlueprintSection {
  heading: string;               // e.g., "Introduction", "Methods"
  instructions: string;          // what this section should contain
  referenceIds: string[];        // which references to cite here
}

// ─── RIC Integrity Report ────────────────────────────────────────────

export interface IntegrityReport {
  overallScore: number;          // 0-100
  flags: IntegrityFlag[];
  summary: string;               // 2-3 sentence summary
}

export interface IntegrityFlag {
  id: string;
  severity: "error" | "warning" | "info";
  type: FlagType;
  location: {
    sectionHeading: string;      // which section
    paragraphIndex: number;      // which paragraph (0-indexed)
    textSnippet: string;         // the flagged text (≤200 chars)
  };
  message: string;               // explanation of the issue
  suggestion?: string;           // how to fix it
  relatedReferenceIds?: string[]; // which references are relevant
}

export type FlagType =
  | "unsupported_claim"          // claim not backed by any reference
  | "misquoted_statistic"        // number doesn't match source
  | "logical_inconsistency"      // contradicts earlier statement
  | "missing_citation"           // needs a citation but has none
  | "hallucinated_reference"     // cites a reference not in the context
  | "overclaiming"               // conclusion stronger than evidence
  | "methodology_concern"        // methodological issue flagged
  | "factual_error";             // verifiably wrong fact

// ─── SSE Event Types ─────────────────────────────────────────────────

export type SSEEvent =
  | { type: "status"; data: { status: PipelineStatus; message: string } }
  | { type: "log"; data: { tool: string; message: string; timestamp: string } }
  | { type: "reference"; data: Reference }                    // streamed one by one
  | { type: "manuscript_chunk"; data: { content: string } }   // streamed text
  | { type: "blueprint"; data: Blueprint }                    // sent once
  | { type: "integrity_flag"; data: IntegrityFlag }           // streamed one by one
  | { type: "integrity_summary"; data: { score: number; summary: string } }
  | { type: "error"; data: { code: string; message: string } }
  | { type: "done"; data: { step: 1 | 2 | 3 } };

// ─── API Request/Response ────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  language: "EN" | "VI";
  maxResults?: number;           // default 10, max 20
}

export interface AVRRequest {
  query: string;
  references: Reference[];
  articleType?: ArticleType;     // if user specifies, otherwise LLM decides
  language: "EN" | "VI";
}

export interface RICRequest {
  manuscript: string;            // markdown
  references: Reference[];
  language: "EN" | "VI";
}
```

---

## 4. API Routes Spec

### 4.1 LLM Abstraction Layer

Create file: `src/lib/llm/index.ts`

```typescript
// Provider-agnostic LLM client
// Currently wraps Google Gemini. Will swap to Anthropic Claude later.
// ALL LLM calls in the app MUST go through this module.

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;        // for tool role messages
}

export interface LLMToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface LLMStreamCallbacks {
  onText: (chunk: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<string>;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamLLM(opts: {
  messages: LLMMessage[];
  tools?: LLMToolDef[];
  callbacks: LLMStreamCallbacks;
  model?: string;              // default from env
  temperature?: number;        // default 0.3
  maxTokens?: number;          // default 4096
}): Promise<void>;

// Non-streaming variant for simple calls (e.g., translation, classification)
export async function callLLM(opts: {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}): Promise<string>;
```

**Implementation notes:**
- Use `@google/generative-ai` SDK (already supports streaming + tool calling)
- Wrap in try/catch, return structured errors
- Rate limit: implement simple token bucket (10 req/min for hackathon)
- Model default: `gemini-2.5-flash` (fast, cheap, good enough)

### 4.2 POST /api/pipeline/smoke

**Purpose:** Verify SSE infrastructure before building the full pipeline.

**Route:** `POST /api/pipeline/smoke`

**Response:** SSE stream with a few simple events:
1. `status: { status: "idle", message: "Smoke test started" }`
2. `log: { tool: "System", message: "hello from SSE", timestamp: "..." }`
3. `done: { step: 1 }`

This route exists only for infrastructure validation and auditability of Phase 1 completion.

### 4.3 POST /api/pipeline/search

**Purpose:** Execute Search & Translate step.

**Request body:** `SearchRequest`

**Response:** SSE stream with events:
1. `status: { status: "searching", message: "Searching PubMed and OpenAlex..." }`
2. `log: { tool: "PubMed", message: "Fetching papers for: [refined query]..." }`
3. `log: { tool: "OpenAlex", message: "Fetching papers for: [refined query]..." }`
4. `reference: Reference` (one per paper found, streamed as processed)
5. `log: { tool: "Translator", message: "Translating abstracts..." }` (if VI)
6. `status: { status: "completed", message: "Found N references" }`
7. `done: { step: 1 }`

**Internal flow:**
1. Call LLM to refine user query into search terms (1 call, non-streaming)
2. Call PubMed E-utilities (efetch/esearch) + OpenAlex API in parallel
3. Deduplicate by DOI
4. Call LLM to rank by relevance & assign `relevanceScore` (1 call)
5. If language = VI, call LLM to translate abstracts in batch
6. Stream each reference to client

### 4.4 POST /api/pipeline/avr

**Purpose:** Generate blueprint + draft manuscript.

**Request body:** `AVRRequest`

**Response:** SSE stream with events:
1. `status: { status: "drafting", message: "Analyzing references..." }`
2. `blueprint: Blueprint` (sent once after LLM decides structure)
3. `log: { tool: "AVR", message: "Writing section: [heading]..." }`
4. `manuscript_chunk: { content: "..." }` (streamed text, Markdown format)
5. `status: { status: "completed", message: "Manuscript draft complete" }`
6. `done: { step: 2 }`

**IMPORTANT — AVR PLACEHOLDER:**
AVR implementation will be plugged in by a separate dev. For now, create a mock:

```typescript
// src/lib/pipeline/avr-mock.ts
// This mock will be replaced by the real AVR module.
// It uses the LLM directly to generate a simple draft.

export async function runAVR(
  request: AVRRequest,
  emitSSE: (event: SSEEvent) => void
): Promise<{ manuscript: string; blueprint: Blueprint }> {
  // 1. Call LLM to decide article type + generate blueprint
  // 2. Call LLM to write manuscript section by section, streaming chunks
  // 3. Return final manuscript + blueprint

  // The real AVR will have its own sophisticated logic.
  // This mock just wraps LLM calls with good prompts.
}
```

**Mock AVR system prompt:**
```
You are an academic writing assistant. Given a research question and a set of references with abstracts, you will:

1. Decide the most appropriate article type (case report, narrative review, etc.)
2. Create a section-by-section blueprint
3. Write each section, citing references by their ID (e.g., [ref-001])

Rules:
- Only cite references provided in the context. Never invent references.
- Use academic tone appropriate for the target journal.
- Include proper in-text citations for every factual claim.
- Flag any section where available references are insufficient with [NEEDS_MORE_EVIDENCE].
- Output in Markdown format with ## headings for each section.
```

### 4.5 POST /api/pipeline/ric

**Purpose:** Audit the manuscript against the references.

**Request body:** `RICRequest`

**Response:** SSE stream with events:
1. `status: { status: "auditing", message: "Checking manuscript integrity..." }`
2. `log: { tool: "RIC", message: "Analyzing section: [heading]..." }`
3. `integrity_flag: IntegrityFlag` (streamed one by one as found)
4. `integrity_summary: { score: number, summary: string }`
5. `status: { status: "completed", message: "Integrity check complete" }`
6. `done: { step: 3 }`

**RIC system prompt:**
```
You are a research integrity auditor. Given a manuscript draft and its source references, your job is to:

1. Read the manuscript section by section.
2. For each factual claim, statistic, or conclusion:
   a. Check if it is supported by the provided references.
   b. Check if the numbers/statistics match the source.
   c. Check for logical consistency with other parts of the manuscript.
3. Flag any issues found.

Output a JSON array of flags, each with:
- severity: "error" | "warning" | "info"
- type: one of [unsupported_claim, misquoted_statistic, logical_inconsistency, missing_citation, hallucinated_reference, overclaiming, methodology_concern, factual_error]
- location: { sectionHeading, paragraphIndex, textSnippet }
- message: explanation
- suggestion: how to fix (optional)
- relatedReferenceIds: which refs are relevant (optional)

After all flags, provide:
- overallScore: 0-100 (100 = no issues found)
- summary: 2-3 sentence integrity assessment

Be thorough but fair. Distinguish between genuine errors and minor stylistic issues.
```

### 4.6 SSE Helper

Create file: `src/lib/pipeline/sse.ts`

```typescript
// Helper to create SSE responses for Next.js App Router

export function createSSEStream(): {
  stream: ReadableStream;
  emit: (event: SSEEvent) => void;
  close: () => void;
} {
  // Uses TransformStream to create a readable stream
  // emit() writes `data: JSON\n\n` format
  // close() sends final event and closes stream
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

---

## 5. Pipeline Orchestration

The pipeline is orchestrated **client-side.** The React app manages the state machine:

```
[IDLE] → user submits query
  → [STEP_1_SEARCH] → POST /api/pipeline/search → collect references
    → [STEP_1_DONE] → user can review references, optionally remove/add
      → [STEP_2_AVR] → POST /api/pipeline/avr → stream manuscript
        → [STEP_2_DONE] → user can edit manuscript before audit
          → [STEP_3_RIC] → POST /api/pipeline/ric → stream flags
            → [STEP_3_DONE] → user sees final report
              → [COMPLETED]
```

### Pipeline state hook

Create file: `src/hooks/usePipeline.ts`

```typescript
export function usePipeline() {
  // State
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [query, setQuery] = useState("");
  const [references, setReferences] = useState<Reference[]>([]);
  const [manuscript, setManuscript] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Actions
  async function startSearch(query: string, language: "EN" | "VI") { ... }
  async function startAVR(articleType?: ArticleType) { ... }
  async function startRIC() { ... }
  function reset() { ... }

  // Each action:
  // 1. Sets status to the appropriate state
  // 2. POSTs to the API with fetch + ReadableStream parsing
  // 3. Processes SSE events, updating state incrementally
  // 4. Sets status to completed/error when done

  return {
    status, currentStep, query, references, manuscript,
    blueprint, integrityReport, logs,
    startSearch, startAVR, startRIC, reset,
    // Helpers
    removeReference, updateManuscript,
  };
}
```

---

## 6. UI Spec — Split-View Layout

### Route: `/app`

This is the main pipeline page. Full-viewport split-view layout.

### 6.1 Overall Layout

```
┌─────────────────────────────────────────────────────────┐
│  Nav (existing, keep as-is)                             │
├──────────────┬──────────────────────────────────────────┤
│              │  Pipeline Tracker (top bar)               │
│  LEFT COL    │  [ 1. Search ] ── [ 2. AVR ] ── [ 3. RIC]│
│  (30-35%)    ├──────────────────────────────────────────┤
│              │                                          │
│  Chat &      │  RIGHT COL: Dynamic Workspace            │
│  Agent Log   │  (65-70%)                                │
│              │                                          │
│              │  Content changes per step:                │
│              │  Step 1 → Reference list                  │
│              │  Step 2 → Manuscript editor               │
│              │  Step 3 → Manuscript + integrity overlay  │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  (No footer on /app — full viewport)                    │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Left Column: Command & Control

Create file: `src/app/app/components/LeftPanel.tsx`

```
┌─────────────────────┐
│  AFA Pipeline        │  ← header with logo
│  [Pipeline] [SRMA]  │  ← tab switcher (future: Settings)
├─────────────────────┤
│                     │
│  Agent Log Area     │  ← scrollable, auto-scroll to bottom
│                     │
│  > Searching PubMed │  ← real-time log entries
│    for "cleft..."   │
│  > Found 8 papers   │
│  > Translating...   │
│  > [Tool: Search]   │
│    ✓ Complete        │
│  > [Tool: AVR]      │
│    Writing section   │
│    "Introduction"... │
│                     │
├─────────────────────┤
│  ┌─────────────────┐│  ← chat input (bottom-pinned)
│  │ Ask a question   ││
│  │ or give a task   ││
│  │          [Send ▶]││
│  └─────────────────┘│
│  EN | VI             │  ← language toggle
└─────────────────────┘
```

**Agent Log entry component:**
```typescript
interface LogEntry {
  id: string;
  tool: string;           // "System" | "Search" | "PubMed" | "OpenAlex" | "Translator" | "AVR" | "RIC"
  message: string;
  timestamp: string;
  status?: "running" | "done" | "error";
}
```

Each entry renders as:
```
> [Tool: PubMed] Fetching 10 papers on "cleft palate repair outcomes"...
```

With color coding per tool:
- System → gray
- PubMed → blue
- OpenAlex → orange
- Translator → green
- AVR → purple
- RIC → red

**Chat input:**
- Multiline textarea, auto-resize
- Submit on Enter (Shift+Enter for newline)
- Disabled while pipeline is running (show "Pipeline running..." placeholder)
- Language toggle: small `EN | VI` toggle below input

### 6.3 Right Column: Dynamic Workspace

Create file: `src/app/app/components/RightPanel.tsx`

#### Pipeline Tracker (top bar)

```
[ 1. Search & Translate ] ─── [ 2. AVR Blueprint ] ─── [ 3. RIC Integrity ]
      ✓ Complete                   ● Active               ○ Pending
```

- Steps rendered as connected nodes
- States: `pending` (gray circle), `active` (pulsing blue dot), `completed` (green checkmark), `error` (red X)
- Clicking a completed step switches the workspace view back to that step's output

#### Step 1 View: Reference List

Create file: `src/app/app/components/ReferenceList.tsx`

```
┌──────────────────────────────────────────────────────┐
│  References (8 found)                    [Continue ▶] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ☑ [ref-001] Smith et al. (2023)                  ││
│  │   "Outcomes of cleft palate repair: a systematic ││
│  │    review of 25 years of evidence"               ││
│  │   Journal of Plastic Surgery · DOI: 10.1xxx     ││
│  │   Cited: 45 · Relevance: 0.95                   ││
│  │   ┌─ Abstract ──────────────────────────────┐    ││
│  │   │ Background: Cleft palate repair remains  │    ││
│  │   │ one of the most common...                │    ││
│  │   │ [Show Vietnamese translation ▾]          │    ││
│  │   └──────────────────────────────────────────┘    ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ☑ [ref-002] Nguyen et al. (2024)                 ││
│  │   ...                                            ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  (more references...)                                │
└──────────────────────────────────────────────────────┘
```

Features:
- Checkbox to include/exclude references before sending to AVR
- Expandable abstract (collapsed by default, show first 2 lines)
- If VI language, toggle to show translated abstract
- Badge for source (PubMed blue, OpenAlex orange)
- Sort by: relevance (default) | year | citations
- **"Continue ▶"** button in header → proceeds to Step 2 with selected references

#### Step 2 View: Manuscript Editor

Create file: `src/app/app/components/ManuscriptEditor.tsx`

```
┌──────────────────────────────────────────────────────┐
│  Blueprint: Narrative Review         [Run RIC Check ▶]│
│  ┌────────────────────────────────────────────────┐  │
│  │ Sections: Introduction · Methods · Results ·   │  │
│  │           Discussion · Conclusion              │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ## Introduction                                     │
│                                                      │
│  Cleft palate is one of the most common congenital   │
│  craniofacial anomalies, affecting approximately     │
│  1 in 700 live births worldwide [ref-001]. The       │
│  surgical management of cleft palate has evolved      │
│  significantly over the past several decades...      │
│  |  ← streaming cursor                              │
│                                                      │
│  ## Methods                                          │
│                                                      │
│  (streaming...)                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Features:
- Blueprint summary bar at top (clickable sections to jump)
- Manuscript renders as Markdown (use `react-markdown` or similar)
- During streaming: show pulsing cursor at insertion point
- After streaming complete: manuscript becomes editable (contentEditable or textarea with Markdown preview toggle)
- **Reference links:** `[ref-001]` renders as clickable tags that show the reference details in a tooltip/popover
- **"Run RIC Check ▶"** button → proceeds to Step 3

#### Step 3 View: Integrity Report Overlay

Create file: `src/app/app/components/IntegrityOverlay.tsx`

```
┌──────────────────────────────────────────────────────┐
│  Integrity Score: 78/100               [Export ▼]    │
│  3 errors · 5 warnings · 2 info                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ## Introduction                                     │
│                                                      │
│  Cleft palate is one of the most common congenital   │
│  craniofacial anomalies, affecting approximately     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░ 1 in 700 live births worldwide [ref-001].     ░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│       ▲ WARNING: Statistic "1 in 700" — ref-001      │
│         states "1 in 600-800 depending on ethnicity". │
│         Consider adding nuance. [Dismiss] [Fix ▶]    │
│                                                      │
│  The surgical management has evolved significantly    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░ with cure rates exceeding 95% [ref-003].      ░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│       ▲ ERROR: ref-003 does not mention "95% cure    │
│         rate". This appears to be unsupported.       │
│         [Dismiss] [Fix ▶]                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Features:
- Score badge at top (color coded: ≥80 green, 60-79 yellow, <60 red)
- Summary counts by severity
- Manuscript text displayed with highlighted problem areas:
  - **Error** → red background highlight + red left border
  - **Warning** → yellow background highlight + yellow left border
  - **Info** → blue background highlight + blue left border
- Each flag shows inline comment box below the highlighted text
- **[Dismiss]** removes the flag from view
- **[Fix ▶]** → future feature (auto-fix with LLM). For hackathon: just label it "Coming soon"
- **[Export ▼]** dropdown: "Download as Markdown" | "Copy to clipboard"

### 6.4 Responsive behavior

- **Desktop (≥1024px):** Full split-view as specified
- **Tablet (768-1023px):** Left panel collapses to icon strip (expandable drawer). Right panel takes full width.
- **Mobile (<768px):** Single column. Top tabs: "Chat" | "Workspace". Toggle between panels.

### 6.5 Color & Design System

Keep existing design tokens from the repo:
- Font: Inter (sans) + Lora (serif, for manuscript text)
- Primary accent: `#C4634E` (rust/terracotta)
- Background: white with dot grid (existing `globals.css`)
- Tool colors as specified above

Pipeline-specific additions:
```css
--pipeline-search: #3B82F6;   /* blue-500 */
--pipeline-avr: #8B5CF6;      /* violet-500 */
--pipeline-ric: #EF4444;      /* red-500 */
--pipeline-success: #22C55E;  /* green-500 */
--pipeline-warning: #F59E0B;  /* amber-500 */
--flag-error-bg: #FEF2F2;     /* red-50 */
--flag-warning-bg: #FFFBEB;   /* amber-50 */
--flag-info-bg: #EFF6FF;      /* blue-50 */
```

---

## 7. Tool 1: Search & Translator

### 7.1 Search APIs

#### PubMed E-utilities

Create file: `src/lib/pipeline/search/pubmed.ts`

```typescript
// PubMed E-utilities API
// Docs: https://www.ncbi.nlm.nih.gov/books/NBK25497/

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function searchPubMed(query: string, maxResults: number = 10): Promise<Reference[]> {
  // Step 1: esearch — get PMIDs
  // GET ${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=${maxResults}&retmode=json
  //
  // Step 2: efetch — get full records
  // GET ${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&rettype=xml&retmode=xml
  //
  // Step 3: Parse XML → Reference objects
  //
  // Rate limit: max 3 requests/second without API key, 10/sec with API key
  // For hackathon: no API key needed, just respect rate limit
}
```

**PubMed query refinement prompt (called by LLM):**
```
Given the user's research question, generate an optimized PubMed search query using MeSH terms and Boolean operators. Return ONLY the query string, nothing else.

User question: "{query}"

Tips:
- Use MeSH terms when appropriate (e.g., "Cleft Palate"[MeSH])
- Use Boolean operators (AND, OR, NOT)
- Include relevant subheadings
- Limit to last 10 years if the question is about current practice
- Add publication type filters if appropriate (e.g., Review[pt])
```

#### OpenAlex

Create file: `src/lib/pipeline/search/openalex.ts`

```typescript
// OpenAlex API
// Docs: https://docs.openalex.org/

const OPENALEX_BASE = "https://api.openalex.org";

export async function searchOpenAlex(query: string, maxResults: number = 10): Promise<Reference[]> {
  // GET ${OPENALEX_BASE}/works?search=${query}&per_page=${maxResults}&sort=relevance_score:desc
  //
  // Headers: { "User-Agent": "AFA/1.0 (mailto:tuyen.tran97@gmail.com)" }
  // (OpenAlex asks for a mailto for polite pool — faster rate limits)
  //
  // Parse response → Reference objects
  // OpenAlex provides: title, authors, doi, publication_year, cited_by_count,
  //   abstract_inverted_index (needs reconstruction), concepts, primary_location
}

// OpenAlex abstract comes as inverted index — need to reconstruct
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  // { "The": [0], "study": [1], "found": [2] } → "The study found"
}
```

### 7.2 Deduplication

Create file: `src/lib/pipeline/search/dedup.ts`

```typescript
export function deduplicateReferences(refs: Reference[]): Reference[] {
  // 1. Exact DOI match → keep the one with more metadata
  // 2. Fuzzy title match (Levenshtein distance < 0.1 of title length) → merge
  // 3. Assign unique IDs (ref-001, ref-002, ...)
}
```

### 7.3 Translation

Translation uses the LLM abstraction layer (NOT a separate translation API):

```typescript
// src/lib/pipeline/search/translate.ts

export async function translateAbstracts(
  refs: Reference[],
  targetLang: "VI"
): Promise<Reference[]> {
  // Batch translate: send all abstracts in one LLM call
  // System prompt: "Translate these academic abstracts to Vietnamese.
  //   Preserve all technical terms, statistics, p-values, confidence intervals,
  //   gene names, drug names, and proper nouns. Return as JSON array matching input order."
  // Input: JSON array of { id, abstract }
  // Output: JSON array of { id, abstractTranslated }
}
```

### 7.4 Full Search Flow

Create file: `src/lib/pipeline/search/index.ts`

```typescript
export async function runSearch(
  request: SearchRequest,
  emit: (event: SSEEvent) => void
): Promise<Reference[]> {
  // 1. Refine query with LLM
  emit({ type: "log", data: { tool: "System", message: "Refining search query...", timestamp: now() } });
  const refinedQuery = await refineQuery(request.query);

  // 2. Search PubMed + OpenAlex in parallel
  emit({ type: "log", data: { tool: "PubMed", message: `Searching: "${refinedQuery}"...`, timestamp: now() } });
  emit({ type: "log", data: { tool: "OpenAlex", message: `Searching: "${refinedQuery}"...`, timestamp: now() } });
  const [pubmedRefs, openalexRefs] = await Promise.all([
    searchPubMed(refinedQuery, request.maxResults || 10),
    searchOpenAlex(refinedQuery, request.maxResults || 10),
  ]);

  // 3. Deduplicate
  const allRefs = deduplicateReferences([...pubmedRefs, ...openalexRefs]);
  emit({ type: "log", data: { tool: "System", message: `${allRefs.length} unique references after dedup`, timestamp: now() } });

  // 4. LLM ranking
  emit({ type: "log", data: { tool: "System", message: "Ranking by relevance...", timestamp: now() } });
  const rankedRefs = await rankReferences(allRefs, request.query);

  // 5. Stream each reference to client
  for (const ref of rankedRefs) {
    emit({ type: "reference", data: ref });
  }

  // 6. Translate if VI
  if (request.language === "VI") {
    emit({ type: "log", data: { tool: "Translator", message: "Translating abstracts to Vietnamese...", timestamp: now() } });
    const translatedRefs = await translateAbstracts(rankedRefs, "VI");
    // Re-emit translated versions (client should update)
    for (const ref of translatedRefs) {
      emit({ type: "reference", data: ref });
    }
    return translatedRefs;
  }

  return rankedRefs;
}
```

---

## 8. Tool 2: AVR (The Architect & Writer)

### PLACEHOLDER IMPLEMENTATION

AVR is being built by a separate dev. This section defines:
1. The **interface** that the real AVR must conform to
2. A **mock implementation** so the pipeline demo works

### 8.1 AVR Interface

Create file: `src/lib/pipeline/avr/interface.ts`

```typescript
/**
 * AVR Module Interface
 * The real AVR implementation must export a function matching this signature.
 * It receives references + query, and streams a manuscript back via SSE events.
 */
export interface AVRModule {
  run(
    request: AVRRequest,
    emit: (event: SSEEvent) => void
  ): Promise<{ manuscript: string; blueprint: Blueprint }>;
}
```

### 8.2 AVR Mock

Create file: `src/lib/pipeline/avr/mock.ts`

```typescript
import { AVRModule } from "./interface";
import { callLLM, streamLLM } from "@/lib/llm";

/**
 * Mock AVR implementation.
 * Uses LLM directly to generate a simple draft.
 * Will be replaced by the real AVR module.
 */
export const avrMock: AVRModule = {
  async run(request, emit) {
    // Step 1: Determine article type + create blueprint
    emit({ type: "status", data: { status: "drafting", message: "Creating blueprint..." } });

    const blueprintJson = await callLLM({
      messages: [
        { role: "system", content: BLUEPRINT_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({
          query: request.query,
          references: request.references.map(r => ({
            id: r.id, title: r.title, abstract: r.abstract, year: r.year
          })),
          preferredType: request.articleType || "auto"
        })}
      ],
      responseFormat: "json",
      temperature: 0.2,
    });

    const blueprint: Blueprint = JSON.parse(blueprintJson);
    emit({ type: "blueprint", data: blueprint });

    // Step 2: Write manuscript section by section
    let fullManuscript = "";

    for (const section of blueprint.sections) {
      emit({ type: "log", data: {
        tool: "AVR",
        message: `Writing section: ${section.heading}...`,
        timestamp: new Date().toISOString()
      }});

      const relevantRefs = request.references.filter(r =>
        section.referenceIds.includes(r.id)
      );

      await streamLLM({
        messages: [
          { role: "system", content: SECTION_WRITER_PROMPT },
          { role: "user", content: JSON.stringify({
            sectionHeading: section.heading,
            instructions: section.instructions,
            references: relevantRefs,
            articleType: blueprint.articleType,
            query: request.query,
            language: request.language,
          })}
        ],
        temperature: 0.4,
        maxTokens: 2048,
        callbacks: {
          onText: (chunk) => {
            fullManuscript += chunk;
            emit({ type: "manuscript_chunk", data: { content: chunk } });
          },
          onToolCall: async () => "",  // no tools for writing
          onDone: () => {},
          onError: (err) => {
            emit({ type: "error", data: { code: "AVR_WRITE_ERROR", message: err.message } });
          }
        }
      });

      fullManuscript += "\n\n";
      emit({ type: "manuscript_chunk", data: { content: "\n\n" } });
    }

    return { manuscript: fullManuscript, blueprint };
  }
};

const BLUEPRINT_SYSTEM_PROMPT = `You are an academic research blueprint generator.
Given a research question and reference abstracts, output a JSON Blueprint:
{
  "articleType": "narrative_review" | "case_report" | "original_research" | etc.,
  "title": "Proposed manuscript title",
  "sections": [
    {
      "heading": "Introduction",
      "instructions": "What to write here...",
      "referenceIds": ["ref-001", "ref-003"]
    },
    ...
  ]
}
Choose the article type based on the query nature and available evidence.
Typical sections: Title, Abstract, Introduction, Methods/Literature Search Strategy, Results/Findings, Discussion, Conclusion, References.
Assign references to sections where they should be cited.`;

const SECTION_WRITER_PROMPT = `You are an academic manuscript writer.
Write the given section of an academic manuscript in Markdown format.
Rules:
- Cite references as [ref-XXX] inline
- Only use references provided — never fabricate
- Academic tone, clear and concise
- If evidence is insufficient for a claim, add [NEEDS_MORE_EVIDENCE]
- Do NOT include the section heading — it will be added automatically
- Output ONLY the section content, no meta-commentary`;
```

### 8.3 AVR Module Loader

Create file: `src/lib/pipeline/avr/index.ts`

```typescript
import { AVRModule } from "./interface";
import { avrMock } from "./mock";

// When the real AVR is ready, change this import:
// import { avr } from "./real";
// export const avrModule: AVRModule = avr;

export const avrModule: AVRModule = avrMock;
```

---

## 9. Tool 3: RIC (The Auditor)

### 9.1 Implementation

Create file: `src/lib/pipeline/ric/index.ts`

```typescript
export async function runRIC(
  request: RICRequest,
  emit: (event: SSEEvent) => void
): Promise<IntegrityReport> {
  emit({ type: "status", data: { status: "auditing", message: "Checking manuscript integrity..." } });

  // Split manuscript into sections for analysis
  const sections = parseManuscriptSections(request.manuscript);

  const allFlags: IntegrityFlag[] = [];

  for (const section of sections) {
    emit({ type: "log", data: {
      tool: "RIC",
      message: `Analyzing: ${section.heading}...`,
      timestamp: new Date().toISOString()
    }});

    // Call LLM to audit this section
    const sectionResult = await callLLM({
      messages: [
        { role: "system", content: RIC_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({
          section: section,
          references: request.references,
          fullManuscript: request.manuscript, // for cross-section consistency
        })}
      ],
      responseFormat: "json",
      temperature: 0.1, // low temp for precision
      maxTokens: 2048,
    });

    const flags: IntegrityFlag[] = JSON.parse(sectionResult);
    for (const flag of flags) {
      flag.id = `flag-${allFlags.length + 1}`;
      allFlags.push(flag);
      emit({ type: "integrity_flag", data: flag });
    }
  }

  // Calculate overall score
  const errorCount = allFlags.filter(f => f.severity === "error").length;
  const warningCount = allFlags.filter(f => f.severity === "warning").length;
  const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5));

  const summaryText = await callLLM({
    messages: [
      { role: "system", content: "Summarize this integrity audit in 2-3 sentences. Be constructive." },
      { role: "user", content: JSON.stringify({ score, flags: allFlags }) }
    ],
    temperature: 0.3,
    maxTokens: 200,
  });

  const report: IntegrityReport = {
    overallScore: score,
    flags: allFlags,
    summary: summaryText,
  };

  emit({ type: "integrity_summary", data: { score, summary: summaryText } });
  emit({ type: "done", data: { step: 3 } });

  return report;
}

function parseManuscriptSections(markdown: string): Array<{ heading: string; content: string; paragraphIndex: number }> {
  // Split by ## headings
  // Return array of { heading, content, paragraphIndex }
}

const RIC_SYSTEM_PROMPT = `You are a research integrity auditor. Analyze the given manuscript section against the provided references.

For each issue found, output a JSON object:
{
  "severity": "error" | "warning" | "info",
  "type": "unsupported_claim" | "misquoted_statistic" | "logical_inconsistency" | "missing_citation" | "hallucinated_reference" | "overclaiming" | "methodology_concern" | "factual_error",
  "location": {
    "sectionHeading": "...",
    "paragraphIndex": 0,
    "textSnippet": "the exact text that is problematic (≤200 chars)"
  },
  "message": "Clear explanation of the issue",
  "suggestion": "How to fix it (optional)",
  "relatedReferenceIds": ["ref-001"] // optional
}

Output a JSON array of all flags found. If no issues, return [].

Severity guide:
- error: Factual errors, hallucinated references, seriously misquoted statistics
- warning: Overclaiming, missing citations for non-trivial claims, imprecise statistics
- info: Minor style issues, suggestions for improvement

Be thorough. Check EVERY factual claim against the references. If a claim has no supporting reference, flag it.
Do NOT flag well-known general knowledge (e.g., "the sky is blue").
DO flag specific statistics, percentages, outcomes, and conclusions that need citation.`;
```

---

## 10. SRMA (Standalone)

SRMA stays as-is. It's a standalone page at `/srma` pointing to the Python CLI tool.

**No changes needed.** The existing page is adequate.

If time permits during hackathon, add a link from the Pipeline page's left panel: "Need to run a systematic review? → Use SRMA"

---

## 11. Existing Pages to Keep

These pages remain unchanged:

| Route | Status |
|-------|--------|
| `/` | IMPLEMENTED as redirect to `/app` |
| `/products` | KEEP |
| `/srma` | KEEP |
| `/blog`, `/blog/[slug]` | KEEP |
| `/about` | KEEP — redesigned as compact Q&A tabs |
| `/resources` | KEEP |
| `/ric` (proxy) | KEEP — standalone RIC still works |
| `/trans` (proxy) | KEEP — standalone Translator still works |

### Landing page update

In `src/app/page.tsx`, add a prominent CTA above the tools grid:

```tsx
{/* Pipeline CTA — NEW */}
<section className="pb-8">
  <div className="max-w-5xl mx-auto px-6 md:px-8">
    <Link
      href="/app"
      className="block rounded-2xl p-8 bg-gradient-to-r from-stone-900 to-stone-800 text-white hover:opacity-95 transition-opacity"
    >
      <p className="text-sm font-medium text-stone-300 mb-2">NEW — Try the Pipeline</p>
      <p className="text-xl font-serif font-bold mb-2">
        From question to manuscript in minutes
      </p>
      <p className="text-sm text-stone-400">
        Search literature → Generate draft → Check integrity — all in one place.
      </p>
    </Link>
  </div>
</section>
```

---

## 12. Environment Variables

Update `.env.example`:

```env
# Existing
NEXT_PUBLIC_BASE_URL=https://aiforacademic.world

# NEW — LLM
GOOGLE_AI_API_KEY=            # Gemini API key (required)
LLM_MODEL=gemini-2.5-flash   # default model
LLM_MAX_RPM=10               # rate limit (requests per minute)

# NEW — Search (optional, improves rate limits)
NCBI_API_KEY=                 # PubMed E-utilities API key (optional, for higher rate limits)
OPENALEX_MAILTO=tuyen.tran97@gmail.com  # OpenAlex polite pool

# FUTURE — Anthropic (uncomment when ready)
# ANTHROPIC_API_KEY=
# LLM_PROVIDER=anthropic      # switch from "google" to "anthropic"
```

Add `LLM_PROVIDER` to the LLM abstraction layer:
```typescript
// src/lib/llm/index.ts
const provider = process.env.LLM_PROVIDER || "google";
// if (provider === "anthropic") { use Anthropic SDK }
// if (provider === "google") { use Google AI SDK }
```

---

## 13. File Structure (Target)

```
src/
├── app/
│   ├── page.tsx                    # Landing (add Pipeline CTA)
│   ├── layout.tsx                  # Root layout (no changes)
│   ├── app/                        # NEW — Pipeline app
│   │   ├── page.tsx                # Pipeline page (split-view shell)
│   │   ├── layout.tsx              # Pipeline layout (no footer, full viewport)
│   │   └── components/
│   │       ├── LeftPanel.tsx        # Chat + Agent Log
│   │       ├── RightPanel.tsx       # Dynamic workspace container
│   │       ├── PipelineTracker.tsx   # Step progress bar
│   │       ├── ReferenceList.tsx     # Step 1 output
│   │       ├── ReferenceCard.tsx     # Single reference card
│   │       ├── ManuscriptEditor.tsx  # Step 2 output
│   │       ├── IntegrityOverlay.tsx  # Step 3 output
│   │       ├── FlagCard.tsx          # Single integrity flag
│   │       ├── ChatInput.tsx         # Bottom input bar
│   │       └── LogEntry.tsx          # Single log entry
│   ├── api/
│   │   ├── subscribe/route.ts      # KEEP
│   │   └── pipeline/               # NEW
│   │       ├── smoke/route.ts      # SSE smoke test
│   │       ├── search/route.ts     # Step 1 API
│   │       ├── avr/route.ts        # Step 2 API
│   │       └── ric/route.ts        # Step 3 API
│   ├── products/                   # KEEP
│   ├── srma/                       # KEEP
│   ├── blog/                       # KEEP
│   ├── about/                      # KEEP
│   └── resources/                  # KEEP
├── components/                     # KEEP existing shared components
├── context/
│   ├── LangContext.tsx             # KEEP
│   └── PipelineContext.tsx         # NEW (optional, if state needs to be shared)
├── hooks/
│   └── usePipeline.ts             # NEW — pipeline state machine
├── lib/
│   ├── llm/
│   │   ├── index.ts               # NEW — LLM abstraction
│   │   ├── google.ts              # NEW — Gemini implementation
│   │   └── anthropic.ts           # NEW — stub for future Anthropic
│   ├── pipeline/
│   │   ├── types.ts               # NEW — all TypeScript types
│   │   ├── sse.ts                 # NEW — SSE helpers
│   │   ├── search/
│   │   │   ├── index.ts           # NEW — search orchestrator
│   │   │   ├── pubmed.ts          # NEW — PubMed API
│   │   │   ├── openalex.ts        # NEW — OpenAlex API
│   │   │   ├── dedup.ts           # NEW — deduplication
│   │   │   └── translate.ts       # NEW — LLM translation
│   │   ├── avr/
│   │   │   ├── index.ts           # NEW — AVR module loader
│   │   │   ├── interface.ts       # NEW — AVR interface definition
│   │   │   └── mock.ts            # NEW — mock AVR for demo
│   │   └── ric/
│   │       └── index.ts           # NEW — RIC auditor
│   ├── types.ts                   # KEEP
│   ├── i18n.ts                    # KEEP
│   ├── server-lang.ts             # KEEP
│   └── blog.ts                    # KEEP
```

---

## 14. Implementation Order

Build in this sequence. Each step should be deployable independently.

### Phase 1: Foundation (Day 1-2)
1. **Types** — Create `src/lib/pipeline/types.ts` with all interfaces
2. **LLM abstraction** — `src/lib/llm/` with Gemini implementation
3. **SSE helper** — `src/lib/pipeline/sse.ts`
4. **Smoke test** — Simple API route that streams "hello" via SSE to verify infra

### Phase 2: Search & Translate (Day 2-3)
5. **PubMed client** — `src/lib/pipeline/search/pubmed.ts`
6. **OpenAlex client** — `src/lib/pipeline/search/openalex.ts`
7. **Dedup + Translate** — `dedup.ts` + `translate.ts`
8. **Search orchestrator** — `src/lib/pipeline/search/index.ts`
9. **Search API route** — `src/app/api/pipeline/search/route.ts`
10. **Test** — curl the API, verify SSE stream returns references

### Phase 3: AVR Mock (Day 3-4)
11. **AVR interface + mock** — `src/lib/pipeline/avr/`
12. **AVR API route** — `src/app/api/pipeline/avr/route.ts`
13. **Test** — send references, verify manuscript streams back

### Phase 4: RIC (Day 4-5)
14. **RIC implementation** — `src/lib/pipeline/ric/index.ts`
15. **RIC API route** — `src/app/api/pipeline/ric/route.ts`
16. **Test** — send manuscript + refs, verify flags stream back

### Phase 5: UI (Day 5-8)
17. **Pipeline page shell** — `/app` with split-view layout
18. **usePipeline hook** — state machine + SSE consumer
19. **Left Panel** — ChatInput + LogEntry list
20. **PipelineTracker** — step progress bar
21. **ReferenceList + ReferenceCard** — Step 1 UI
22. **ManuscriptEditor** — Step 2 UI with streaming
23. **IntegrityOverlay + FlagCard** — Step 3 UI
24. **Landing page CTA** — add link to `/app`

### Phase 6: Polish (Day 8-10)
25. **Responsive design** — mobile/tablet adaptations
26. **Error handling** — retry logic, user-friendly error messages
27. **Loading states** — skeleton screens, progress indicators
28. **Export** — download manuscript as .md
29. **Edge cases** — empty search results, API timeouts, malformed LLM output

### Status Update — 2026-04-19

This section records the real implementation state in the repo after the current hackathon sprint.

#### What is done

- **Phase 1 complete**
  - `src/lib/pipeline/types.ts` exists
  - provider-agnostic LLM abstraction exists under `src/lib/llm/`
  - SSE helper exists at `src/lib/pipeline/sse.ts`
  - `POST /api/pipeline/smoke` exists and streams successfully
- **Phase 2 complete**
  - PubMed + OpenAlex clients are implemented
  - Search orchestration, deduplication, translation, and SSE search route are implemented
  - client consumes `POST` SSE streams via `fetch` + `eventsource-parser`
- **Phase 3 complete for hackathon scope**
  - AVR interface exists
  - AVR mock/placeholder exists and streams sample blueprint + manuscript output
- **Phase 4 complete for hackathon scope**
  - RIC route exists
  - integrity flags + summary stream back to the client
  - severity/type normalization is in place for app compatibility
- **Phase 5 complete in the current UX direction**
  - `/app` is implemented as the main product surface
  - current UI direction is **chat + artifact**, not a dashboard/tool-picker
  - left pane = chat/workflow stream
  - right pane = artifact pane with `Papers / Draft / Review`
  - `/` now redirects directly to `/app`
  - `/about` has been redesigned into a compact tabbed Q&A page
- **Phase 6 partially complete**
  - responsive simplification done
  - empty/error states implemented
  - manuscript export to `.md` implemented
  - polish is still open and should continue after usability review

#### Current known limitations

- **AVR is still placeholder/mock** — real module will be plugged in later by another dev
- **No auth / persistence** — still stateless, in line with hackathon scope
- **Search quality is usable but not “done”** — biomedical retrieval still depends on query interpretation and fallback heuristics
- **UI direction is still provisional** — latest iteration is intentionally simplified for clarity and may continue changing after live review

#### Errors and issues encountered during implementation

- **Spec ambiguity**
  - earlier drafts mixed server-side pipeline orchestration with client orchestration
  - resolved by locking the decision: no `/api/pipeline/run`, client sequences `search -> avr -> ric`
- **Transport mismatch**
  - native `EventSource` does not work for these routes because they are `POST`
  - resolved with `fetch` streaming + `eventsource-parser`
- **Phase 1 audit gap**
  - SSE smoke route was missing initially, so foundation was not auditable
  - fixed by adding `/api/pipeline/smoke`
- **Vietnamese query retrieval returning 0 results**
  - some Vietnamese queries produced empty search output
  - improved by translating/interpreting the search question into a concise English biomedical phrase before retrieval
- **PubMed refinement instability**
  - LLM-refined queries occasionally came back malformed or truncated
  - fixed by adding sanity checks and falling back to the original cleaned query
- **Translation schema mismatch**
  - Gemini translation output did not always use the exact expected key names
  - fixed by hardening parsing, accepting common variants, and batching output more safely
- **RIC contract mismatch**
  - live model output used severities like `high` / `medium`, while the UI only handled `error` / `warning` / `info`
  - fixed by normalizing severities and deduplicating overlapping flags
- **Deduplication bug**
  - DOI dedup after fuzzy title merge could still leak duplicates
  - fixed by updating DOI indexing after merges
- **UI clarity failures**
  - earlier split-view/dashboard versions were too verbose and looked like a tool picker instead of one workflow
  - current direction changes `/app` into a simpler **chat + artifact** workspace
- **Preview protection**
  - Vercel preview deployments were not anonymously viewable because preview protection returned `401`
  - production deployment is needed for public review without Vercel login

#### Validation completed

- `npm run lint` passes
- `npm run build` passes
- `/api/pipeline/search` streams references
- `/api/pipeline/avr` streams mock draft output
- `/api/pipeline/ric` streams integrity output
- `/api/pipeline/smoke` streams successfully

---

## 15. Non-Goals (Hackathon Scope)

These are explicitly out of scope for this build:

- **Authentication / user accounts** — no login, no saved sessions
- **Payment / subscription** — no LemonSqueezy integration on pipeline pages
- **Real AVR** — mock only, real implementation comes later
- **PDF upload / processing** — user inputs text queries only
- **Database** — no persistence, all state in-memory per session
- **Collaborative editing** — single user per session
- **Custom templates** — AVR mock uses LLM-generated blueprints only
- **Citation formatting** — references shown as `[ref-XXX]`, no APA/Vancouver formatting
- **Full-text retrieval** — we fetch abstracts only, not full papers
- **SRMA integration** — SRMA stays standalone, not part of pipeline
- **i18n for UI** — Pipeline UI in English only (content can be in VI)
- **Analytics / telemetry** — Vercel Analytics is enough

---

## Appendix A: NPM Dependencies to Add

```bash
npm install @google/generative-ai    # Gemini SDK
npm install eventsource-parser        # SSE parsing on client
npm install react-markdown            # Markdown rendering
npm install remark-gfm                # GitHub Flavored Markdown
npm install uuid                      # session IDs
```

Dev dependencies (already have ESLint + TS):
```bash
# None additional needed
```

## Appendix B: Vercel Config Notes

- **Function timeout:** Default 60s on Hobby. If pipeline steps exceed this:
  - Option A: Upgrade to Pro (300s) — recommended for production
  - Option B: Already handled by client-side orchestration (each step is a separate request)
- **SSE on Vercel:** Works with Edge Runtime or Node.js runtime. Use Node.js runtime (default) for compatibility with all npm packages.
- **Environment variables:** Set all vars from Section 12 in Vercel project settings.

## Appendix C: Quick Reference — What Bi Should NOT Touch

| File/Folder | Reason |
|-------------|--------|
| `content/blog/` | Blog content, don't modify |
| `src/components/Nav.tsx` | Shared nav, only add `/app` link |
| `src/components/Footer.tsx` | Keep as-is |
| `src/components/BlogFilter.tsx` | Blog component, no changes |
| `src/components/ProductTabs.tsx` | Products page, no changes |
| `src/components/EmailCapture.tsx` | Email capture, no changes |
| `src/context/LangContext.tsx` | Language context, no changes |
| `src/lib/blog.ts` | Blog utilities, no changes |
| `src/lib/i18n.ts` | i18n, no changes |
| `src/app/products/` | Products page, no changes |
| `src/app/srma/` | SRMA page, no changes |
| `src/app/blog/` | Blog pages, no changes |
| `src/app/about/` | About page, no changes |
| `src/app/resources/` | Resources page, no changes |
| `next.config.ts` | Only add: nothing. Keep rewrites. |
| `public/` | Static assets, don't remove anything |

---

*End of spec. Questions → ask sếp Tuyến, not the spec.*
