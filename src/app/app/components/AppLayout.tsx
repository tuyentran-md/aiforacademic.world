"use client";
import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import CanvasPanel from './CanvasPanel';

export default function AppLayout() {
  const [activeView, setActiveView] = useState<'idle' | 'references' | 'editor' | 'integrity'>('idle');

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Left Column (Chat Controller) */}
      <div className="w-[380px] lg:w-[450px] border-r border-slate-200 bg-white flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">AFA Assistant</h1>
            <p className="text-xs text-slate-500">Agentic Workspace</p>
          </div>
        </div>
        <ChatPanel onViewChange={setActiveView} />
      </div>

      {/* Right Column (Canvas Viewer) */}
      <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
        <CanvasPanel activeView={activeView} />
      </div>
    </div>
  );
}
