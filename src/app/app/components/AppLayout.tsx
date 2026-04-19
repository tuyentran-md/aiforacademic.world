"use client";

import React, { useEffect, useState } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import ChatPanel from "./ChatPanel";
import CanvasPanel from "./CanvasPanel";

export default function AppLayout() {
  const canvas = useCanvas();
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");

  // Auto-switch to canvas tab on mobile when canvas state changes
  useEffect(() => {
    if (canvas.canvasState !== "idle") {
      setMobileTab("canvas");
    }
  }, [canvas.canvasState]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden bg-[#FAF9F6]">

      {/* ── Mobile Tab Bar ────────────────────────────────────────────── */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex border-b border-black/[0.07] bg-[#F5F1EA]">
        {(["chat", "canvas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === tab
                ? "text-stone-900 border-b-2 border-[#C4634E]"
                : "text-stone-400"
            }`}
          >
            {tab === "chat" ? "💬 Chat" : "🖥 Canvas"}
          </button>
        ))}
      </div>

      {/* ── Desktop: Left Panel (Chat, 40%) ─── Mobile: full-height chat ── */}
      <div
        className={`
          flex flex-col bg-white border-r border-black/[0.07] shadow-[1px_0_0_0_rgba(0,0,0,0.04)]
          w-full md:w-[40%] md:max-w-[480px] md:flex-shrink-0
          ${mobileTab === "chat" ? "flex pt-10 md:pt-0" : "hidden md:flex"}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-black/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#C4634E] flex items-center justify-center text-white font-bold text-xs tracking-tight select-none">
              A
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm leading-tight">AFA Assistant</p>
              <p className="text-[11px] text-stone-400 leading-tight">Agentic Research Workspace</p>
            </div>
          </div>

          {/* Language toggle */}
          <div className="inline-flex rounded-full border border-black/10 bg-stone-100 p-0.5 text-[11px] font-medium">
            {(["VI", "EN"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => canvas.updateLanguage(lang)}
                className={`rounded-full px-2.5 py-1 transition-all ${
                  canvas.language === lang
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <ChatPanel
          messages={canvas.messages}
          isRunning={canvas.isRunning}
          language={canvas.language}
          onSendMessage={canvas.sendMessage}
        />
      </div>

      {/* ── Desktop: Right Panel (Canvas, 60%) ─── Mobile: full-height canvas ── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 bg-[#FAF9F6]
          w-full
          ${mobileTab === "canvas" ? "flex pt-10 md:pt-0" : "hidden md:flex"}
        `}
      >
        <CanvasPanel
          canvasState={canvas.canvasState}
          canvasHistory={canvas.canvasHistory}
          references={canvas.references}
          selectedReferenceIds={canvas.selectedReferenceIds}
          manuscript={canvas.manuscript}
          integrityReport={canvas.integrityReport}
          isRunning={canvas.isRunning}
          status={canvas.status}
          language={canvas.language}
          translatingIds={canvas.translatingIds}
          onSelectTab={canvas.selectCanvasTab}
          onToggleReference={canvas.toggleReference}
          onTranslateReference={canvas.translateReference}
          onUpdateManuscript={canvas.updateManuscript}
          onDismissFlag={canvas.dismissFlag}
          onSendMessage={canvas.sendMessage}
          onStartRIC={canvas.startRIC}
        />
      </div>
    </div>
  );
}
