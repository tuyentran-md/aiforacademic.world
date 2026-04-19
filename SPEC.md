# AFA (AI For Academic) — Agentic Canvas Spec

## Core Philosophy

**Chat is Controller. Canvas is Viewer.**

No rigid pipeline. No forced step order. User talks to the AI; AI picks the right tool; Canvas shows the result. User can jump between tools freely at any time.

---

## Layout

### Desktop (≥ 768px): Split View

```
┌─────────────────────────────────────────────────────────┐
│  [Left Panel — Chat/Controller]  │  [Right Panel — Canvas] │
│  40% width                       │  60% width              │
│                                  │                         │
│  Chat history                    │  Canvas output          │
│  ...                             │  (changes per tool)     │
│                                  │                         │
│  [Suggested Action Chips]        │  [Canvas Tab Bar]       │
│  [Chat Input]                    │                         │
└─────────────────────────────────────────────────────────┘
```

### Mobile (< 768px): Tab View

Two tabs at the top: **Chat** | **Canvas**. Same content, stacked. Switching canvas state auto-switches user to Canvas tab.

---

## Tools (Skills)

The AI has 3 core skills. They are **not steps** — they are capabilities the AI picks based on the conversation.

### 1. Search
- Search academic literature (PubMed, Semantic Scholar, etc.)
- Input: query string from chat
- Optional: translate any retrieved paper (title + abstract) to Vietnamese
- Output → Canvas: `REFERENCE_VIEW`

### 2. AVR (Academic Writing Reviewer)
- Supports the full writing journey: Idea → Research Question → Outline → Draft
- User can enter at any stage (has an idea, has an outline, or has a partial draft)
- Input: whatever user provides in chat (rough idea, bullet points, or existing text)
- Output → Canvas: `EDITOR_VIEW` (live editable draft)

### 3. RIC (Research Integrity Check)
- Checks a finished or in-progress manuscript for integrity issues
- Input: user pastes text in chat, or uses text already in EDITOR_VIEW
- Output → Canvas: `INTEGRITY_OVERLAY` (same text, with color-flagged highlights)

---

## Canvas States

Canvas is a single right-panel area that morphs based on the active tool. User can also manually switch using the Canvas Tab Bar.

### IDLE
- Default on page load
- Show: brief welcome + capability list ("What can I help you with today?")
- 3 entry-point action chips: `🔍 Search literature` | `✍️ Start writing` | `🔬 Check my paper`

### REFERENCE_VIEW
Triggered after Search runs.

```
┌─────────────────────────────────┐
│ 🔍 Search Results (N papers)    │
│─────────────────────────────────│
│ [Paper card]                    │
│  Title · Authors · Year         │
│  Abstract snippet               │
│  [🌐 Translate] [📋 Copy] [🔗 Link] │
│─────────────────────────────────│
│ [Paper card] ...                │
└─────────────────────────────────┘
```

- Translate button: on click, replaces abstract snippet with Vietnamese translation inline
- Each card is expandable to show full abstract

**Suggested Actions (appear in chat after Search):**
- `📝 Summarize these papers`
- `✍️ Draft introduction from these references`
- `🔬 Check my paper against these`

### EDITOR_VIEW
Triggered when AVR produces or edits a draft.

```
┌─────────────────────────────────┐
│ ✍️ Draft Editor                 │
│─────────────────────────────────│
│ [Editable markdown text area]   │
│                                 │
│                                 │
│─────────────────────────────────│
│ [💾 Copy] [📤 Export .docx]     │
└─────────────────────────────────┘
```

- User can directly type/edit in canvas
- Content persists in session (AI can read it on next message)
- When user says "check this" → RIC reads from EDITOR_VIEW, transitions to INTEGRITY_OVERLAY

**Suggested Actions:**
- `🔬 Check this draft with RIC`
- `🔍 Find more references for this section`
- `📝 Expand the Methods section`

### INTEGRITY_OVERLAY
Triggered when RIC runs.

```
┌─────────────────────────────────┐
│ 🔬 Integrity Check              │
│─────────────────────────────────│
│ [Full manuscript text]          │
│ Sentence with 🔴 red highlight  │ ← possible fabrication / citation gap
│ Sentence with 🟡 yellow          │ ← weak claim / needs citation
│ Normal sentence                 │
│─────────────────────────────────│
│ [Issue List Panel]              │
│  🔴 3 critical · 🟡 5 warnings  │
│  Click issue → jumps to text    │
└─────────────────────────────────┘
```

- Red = critical flag (fabricated data, missing citation for strong claim)
- Yellow = warning (weak/vague claim, recommend citation)
- Click any issue in Issue List → scroll to that highlight in text
- User can click a highlight → inline comment appears from AI explaining the flag

**Suggested Actions:**
- `✍️ Fix flagged sections`
- `🔍 Find citations for yellow flags`

---

## Canvas Tab Bar

Always visible in top-right of Canvas panel. Shows history of canvas states used this session.

```
[ References (3) ]  [ Draft ]  [ RIC Report ]
```

- Click any tab to revisit that canvas state
- Tabs appear only after that tool has been used
- Multiple Reference searches stack as "References (1)", "References (2)"

---

## Chat Behavior

### Tool Routing (AI decides, no UI intervention)

| User says | AI triggers |
|-----------|-------------|
| "Tìm tài liệu về X" / "Search for X" | Search → REFERENCE_VIEW |
| "Dịch bài này" / "Translate this" | Search translate on last result |
| "Tôi muốn viết bài về X" / "Help me write" | AVR → EDITOR_VIEW |
| "Từ mấy tài liệu này, dàn bài cho tôi" | AVR using REFERENCE_VIEW context |
| "Check bài này" / "Review my paper" | RIC → INTEGRITY_OVERLAY |
| "Fix phần Methods" | AVR edit on EDITOR_VIEW content |

### Suggested Action Chips

Appear **below chat input** after each AI response. Max 3 chips. Auto-dismissed when user types.

These are the ONLY "next step" affordances — not buttons on the canvas, not a step tracker.

---

## What is Removed (compared to old pipeline)

- ❌ Step tracker (1 → 2 → 3)
- ❌ "Run Review" manual button
- ❌ "Draft Scaffold" hardcoded form
- ❌ Forced search-first flow
- ❌ Any gate/lock preventing access to a tool before completing another

---

## Entry Points

User can start from any of these without doing anything else first:

1. **Search first:** Type a search query → get references → optionally draft
2. **Write first:** Say "I want to write about X" → AVR produces outline/draft → optionally search more refs
3. **Check first:** Paste existing manuscript in chat → RIC runs immediately → get flags

---

## Session State (persisted during session, cleared on reload)

| Key | Value |
|-----|-------|
| `references` | Array of search results from this session |
| `draft` | Current text in EDITOR_VIEW |
| `ric_report` | Last RIC output |
| `canvas_history` | Ordered list of canvas states visited |
| `suggested_actions` | Current chips |

---

## Implementation Notes for Dev

- Canvas state is a single React state enum: `idle | reference | editor | integrity`
- Canvas Tab Bar reads from `canvas_history` array — append on each new state, don't clear previous
- Suggested action chips are props passed by AI response, not hardcoded
- AI response always includes: `{ text, canvas_state, suggested_actions[] }`
- Mobile: canvas state change → auto-switch to Canvas tab (no manual tap required)
- EDITOR_VIEW content is a controlled textarea/contenteditable synced to `draft` session state
- RIC: render manuscript as list of sentence-spans, each with a `flag` prop (`none | warning | critical`)
