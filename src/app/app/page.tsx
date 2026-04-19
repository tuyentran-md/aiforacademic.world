"use client";

import { useEffect, useState } from "react";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { usePipeline } from "@/hooks/usePipeline";

export default function PipelinePage() {
  const pipeline = usePipeline();
  const [mobilePanel, setMobilePanel] = useState<"chat" | "output">("chat");

  useEffect(() => {
    if (pipeline.isRunning) {
      setMobilePanel("output");
    }
  }, [pipeline.isRunning]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[radial-gradient(circle_at_top_left,rgba(196,99,78,0.07),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(26,46,68,0.06),transparent_32%)] text-[15px]">
      <div className="mx-auto max-w-[1660px] px-3 py-3 md:px-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="inline-flex rounded-full border border-black/10 bg-white/80 p-1 shadow-sm">
            {(
              [
                { id: "chat" as const, label: "Chat" },
                { id: "output" as const, label: "Output" },
              ] satisfies ReadonlyArray<{ id: "chat" | "output"; label: string }>
            ).map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setMobilePanel(panel.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  mobilePanel === panel.id ? "bg-stone-900 text-white" : "text-stone-600"
                }`}
              >
                {panel.label}
              </button>
            ))}
          </div>
          {pipeline.errorMessage ? (
            <p className="max-w-[50%] text-right text-sm text-rose-600">{pipeline.errorMessage}</p>
          ) : null}
        </div>

        <div className="mb-3 flex items-end justify-between gap-4 rounded-xl border border-black/8 border-l-4 border-l-[#C4634E] bg-white/72 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              Pipeline
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-900">Search, draft, review</h1>
          </div>
          <p className="hidden text-sm text-stone-500 xl:block">
            {pipeline.isRunning
              ? "Pipeline running..."
              : pipeline.query
                ? "Output ready to review."
                : "Start with a research question."}
          </p>
        </div>

        <div className="grid min-h-[calc(100vh-164px)] gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className={`${mobilePanel === "output" ? "hidden lg:block" : "block"} xl:block`}>
            <LeftPanel
              logs={pipeline.logs}
              language={pipeline.language}
              query={pipeline.query}
              isRunning={pipeline.isRunning}
              onLanguageChange={pipeline.setLanguage}
              onSearch={async (query) => {
                setMobilePanel("output");
                await pipeline.startSearch(query, pipeline.language);
              }}
              onReset={pipeline.reset}
            />
          </div>

          <div className={`${mobilePanel === "chat" ? "hidden lg:block" : "block"} xl:block`}>
            <RightPanel
              status={pipeline.status}
              currentStep={pipeline.currentStep}
              activeView={pipeline.activeView}
              language={pipeline.language}
              query={pipeline.query}
              references={pipeline.references}
              selectedReferenceIds={pipeline.selectedReferenceIds}
              manuscript={pipeline.manuscript}
              blueprint={pipeline.blueprint}
              integrityReport={pipeline.integrityReport}
              logs={pipeline.logs}
              errorMessage={pipeline.errorMessage}
              autoChain={pipeline.autoChain}
              onSelectStep={pipeline.selectView}
              onToggleReference={pipeline.toggleReference}
              onRemoveReference={pipeline.removeReference}
              onContinueToAVR={pipeline.startAVR}
              onManuscriptChange={pipeline.updateManuscript}
              onContinueToRIC={pipeline.startRIC}
              onDismissFlag={pipeline.dismissFlag}
              onAutoChainChange={pipeline.setAutoChain}
            />
            {pipeline.errorMessage ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {pipeline.errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
