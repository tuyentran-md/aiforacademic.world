#!/bin/bash
# Note: Since the prompt is to re-architect UI/UX inside a Next.js repo, 
# a bash script is used to write out the updated spec.md and core canvas layout components.

cd /Users/admin/Documents/TUYEN_OS/02_PRODUCT/REPOS/aiforacademic.world

# 1. Update SPEC.md with the Canvas approach
cat << 'SPEC' > SPEC.md
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
SPEC

# 2. Create the App Layout
mkdir -p src/app/app/components
cat << 'TSX' > src/app/app/components/AppLayout.tsx
import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import CanvasPanel from './CanvasPanel';

export default function AppLayout() {
  const [activeView, setActiveView] = useState<'idle' | 'references' | 'editor' | 'integrity'>('idle');
  // State for references, manuscript, etc would be managed here or via Context/Hook

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Left Panel: Chat */}
      <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b font-semibold text-slate-800">AFA Agent</div>
        <ChatPanel onViewChange={setActiveView} />
      </div>

      {/* Right Panel: Canvas */}
      <div className="w-2/3 flex flex-col bg-slate-50 relative">
        <CanvasPanel activeView={activeView} />
      </div>
    </div>
  );
}
TSX

# 3. Create placeholder panels
cat << 'TSX' > src/app/app/components/ChatPanel.tsx
import React, { useState } from 'react';

export default function ChatPanel({ onViewChange }: { onViewChange: (view: any) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Simulate agent routing based on keywords
    if (input.includes('search') || input.includes('tìm')) onViewChange('references');
    else if (input.includes('draft') || input.includes('viết')) onViewChange('editor');
    else if (input.includes('check') || input.includes('lỗi')) onViewChange('integrity');
    
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 justify-between h-full">
      <div className="flex-1 overflow-y-auto mb-4 text-sm text-slate-600">
        {/* Chat History / Agent logs go here */}
        <p className="mb-2">Agent: Hello! I can search papers, draft manuscripts, or check integrity. What do you need?</p>
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <textarea 
          className="w-full border rounded-lg p-3 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Ask a question or give a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="absolute bottom-3 right-3 text-blue-500 font-semibold">Send</button>
      </form>
    </div>
  );
}
TSX

cat << 'TSX' > src/app/app/components/CanvasPanel.tsx
import React from 'react';

export default function CanvasPanel({ activeView }: { activeView: string }) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {activeView === 'idle' && (
        <div className="flex items-center justify-center h-full text-slate-400">
          <p>Your workspace is ready. Give the agent a task to begin.</p>
        </div>
      )}
      {activeView === 'references' && (
        <div className="bg-white p-6 rounded shadow-sm">
          <h2 className="text-xl font-bold mb-4">References</h2>
          <div className="space-y-4">
            <div className="border p-4 rounded bg-slate-50">
              <p className="font-semibold">[ref-001] Smith et al.</p>
              <p className="text-sm text-slate-600">Outcomes of cleft palate repair...</p>
            </div>
            {/* Action buttons appear dynamically */}
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              ✍️ Draft from these references
            </button>
          </div>
        </div>
      )}
      {activeView === 'editor' && (
        <div className="bg-white p-6 rounded shadow-sm h-full font-serif text-lg leading-relaxed">
          <h2 className="text-xl font-bold mb-4 font-sans text-slate-800">Manuscript Draft</h2>
          <p>Cleft palate is one of the most common congenital craniofacial anomalies [ref-001].</p>
        </div>
      )}
      {activeView === 'integrity' && (
        <div className="bg-white p-6 rounded shadow-sm h-full font-serif text-lg leading-relaxed relative">
          <div className="absolute top-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold font-sans">Score: 78/100</div>
          <h2 className="text-xl font-bold mb-4 font-sans text-slate-800">Integrity Report</h2>
          <p>
            Cleft palate is one of the most common congenital craniofacial anomalies affecting 
            <span className="bg-red-200 border-l-4 border-red-500 pl-1 mx-1">1 in 700</span> live births.
          </p>
        </div>
      )}
    </div>
  );
}
TSX

echo "UI Refactoring layout created successfully."
