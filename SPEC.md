# AFA (AI For Academic) — Agentic Canvas Edition

## UI Architecture: Split-View Workspace
Instead of a rigid pipeline, AFA operates as an Agentic Workspace:
- **Left Panel (Chat/Controller):** The user interacts via chat. The LLM decides which tool to trigger.
- **Right Panel (Canvas/Viewer):** Displays the output of the active tool.

## Canvas States
- **IDLE:** Blank or welcome state.
- **REFERENCE_VIEW:** Displays the list of papers retrieved by the Search tool.
- **EDITOR_VIEW:** A Markdown editor for drafting and reviewing manuscript (AVR/RIC).
- **INTEGRITY_OVERLAY:** Shows the manuscript with highlighted flags from RIC.

## Actions
The UI relies on Suggested Actions (e.g., "Draft from these references") instead of rigid "Next Step" buttons, allowing free-flow navigation.
