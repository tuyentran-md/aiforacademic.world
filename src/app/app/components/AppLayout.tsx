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
