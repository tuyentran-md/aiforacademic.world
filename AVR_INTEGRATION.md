# AVR Integration Guide — For the Dev Merging Tool 2

> **Context**: The frontend and API layer are already scaffolded. You only need to replace the mock module with your real implementation. No UI changes are needed.

---

## Architecture Overview

```
/src/lib/pipeline/avr/
  ├── interface.ts      ← Contract your module must satisfy (DO NOT change)
  ├── index.ts          ← Swap point — change ONE line here
  └── mock.ts           ← Current stub (safe to delete after merge)
```

The API route at `/api/pipeline/avr/route.ts` is complete. It calls `avrModule.run(payload, emit)` and streams SSE events to the frontend.

---

## Step 1 — Implement `AVRModule`

Create your real implementation file:

```
/src/lib/pipeline/avr/real.ts   (or any filename you prefer)
```

It **must** export an object matching the `AVRModule` interface:

```typescript
// src/lib/pipeline/avr/interface.ts  ← existing, don't change
import { type AVRRequest, type Blueprint, type SSEEvent } from "@/lib/pipeline/types";

export interface AVRModule {
  run(
    request: AVRRequest,
    emit: (event: SSEEvent) => void,
  ): Promise<{ manuscript: string; blueprint: Blueprint }>;
}
```

### Request shape (`AVRRequest`):
```typescript
{
  query: string;             // User's research question / topic
  references: Reference[];   // Selected search results (may be empty)
  language: "EN" | "VI";    // Output language
  articleType?: ArticleType; // Optional: "original_research" | "systematic_review" | etc.
}
```

### SSE events you should emit (in order):

```typescript
// 1. Status update as you start
emit({ type: "status", data: { status: "drafting", message: "Generating blueprint..." } });

// 2. Optional: log events for transparency (shown in dev logs)
emit({ type: "log", data: { tool: "AVR", message: "Building IMRaD structure...", timestamp: new Date().toISOString() } });

// 3. Stream manuscript chunks as they generate
emit({ type: "manuscript_chunk", data: { content: "**Introduction**\n\n" } });
emit({ type: "manuscript_chunk", data: { content: "Background paragraph..." } });
// ... repeat for each chunk

// 4. Done signal (step: 2 tells ChatPanel to show the post-AVR action chips)
emit({ type: "done", data: { step: 2 } });
```

All SSE event types are defined in `/src/lib/pipeline/types.ts`.

---

## Step 2 — Swap the Module

**Only 1 line to change** in `/src/lib/pipeline/avr/index.ts`:

```diff
  import { type AVRModule } from "./interface";
- import { avrMock } from "./mock";
+ import { avrReal } from "./real";   // ← your export name

- export const avrModule: AVRModule = avrMock;
+ export const avrModule: AVRModule = avrReal;
```

---

## Step 3 — Wire the Frontend (Hook)

In `/src/hooks/useCanvas.ts`, the `startAVR()` function is currently a placeholder. Replace with the real API call:

```diff
  async function startAVR() {
-   pushCanvas("editor", "Draft");
-   appendMessage({
-     role: "agent",
-     text: "✍️ AVR is coming soon! ...",
-   });
+   const query = messages.find(m => m.role === "user")?.text ?? "";
+   pushCanvas("editor", "Draft");
+   appendMessage({ role: "agent", text: "Generating manuscript draft..." });
+   setManuscript("");
+   try {
+     await consumeSSE(
+       "/api/pipeline/avr",
+       {
+         query,
+         references: referencesRef.current.filter(r => selectedReferenceIdsRef.current.includes(r.id)),
+         language: languageRef.current,
+       },
+       handleEvent,
+     );
+   } catch (error) {
+     const msg = error instanceof Error ? error.message : "AVR failed";
+     appendMessage({ role: "agent", text: `❌ AVR error: ${msg}` });
+   }
  }
```

> **Note**: `consumeSSE` and `handleEvent` are already defined in the same file — just use them. The `manuscript_chunk` SSE events will auto-stream into the `manuscript` state, and the `EDITOR_VIEW` in `CanvasPanel` will render them live.

---

## Step 4 — Remove the "Coming Soon" Banner

In `/src/app/app/components/CanvasPanel.tsx`, find and remove the AVR banner block:

```diff
-           {/* AVR coming soon banner */}
-           <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
-             <span className="text-lg">🚧</span>
-             <div>
-               <p className="text-sm font-medium text-violet-800">AVR — Coming Soon</p>
-               <p className="text-xs text-violet-600 mt-0.5">
-                 AI-powered manuscript drafting is almost ready...
-               </p>
-             </div>
-           </div>
```

---

## Step 5 — Build Check

```bash
npm run build
```

If TypeScript complains, check that your `run()` return type matches:
```typescript
Promise<{ manuscript: string; blueprint: Blueprint }>
```

The `Blueprint` type is defined in `/src/lib/pipeline/types.ts`.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/pipeline/avr/interface.ts` | Contract — **do not change** |
| `src/lib/pipeline/avr/index.ts` | **Swap target** — change 1 line |
| `src/lib/pipeline/avr/mock.ts` | Current mock — can be deleted |
| `src/lib/pipeline/types.ts` | All shared types (AVRRequest, Blueprint, SSEEvent) |
| `src/app/api/pipeline/avr/route.ts` | API route — already complete |
| `src/hooks/useCanvas.ts` | `startAVR()` function to wire |
| `src/app/app/components/CanvasPanel.tsx` | Remove AVR banner when ready |

---

## Skill Checklist

After your merge, verify these flows work:

- [ ] Type "Draft a manuscript about [topic]" in chat → Triggers AVR
- [ ] Manuscript streams chunk by chunk into the Editor view (Canvas right panel)
- [ ] Word count updates live as chunks stream in
- [ ] After done, chat shows action chips: "Check with RIC" and "Search more references"
- [ ] `npm run build` passes with zero errors
