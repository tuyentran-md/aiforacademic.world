"use client";

import { useState } from "react";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { usePipeline } from "@/hooks/usePipeline";

export default function PipelinePage() {
  const pipeline = usePipeline();
  const [mobilePanel, setMobilePanel] = useState<"brief" | "workspace">("workspace");

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[radial-gradient(circle_at_top_left,rgba(196,99,78,0.07),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(26,46,68,0.06),transparent_32%)] text-[15px]">
      <div className="mx-auto max-w-[1760px] px-3 py-3 md:px-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="inline-flex rounded-full border border-black/10 bg-white/80 p-1 shadow-sm">
            {(
              [
                { id: "brief" as const, label: "Brief" },
                { id: "workspace" as const, label: "Workspace" },
              ] satisfies ReadonlyArray<{ id: "brief" | "workspace"; label: string }>
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

        <div className="mb-3 flex items-center justify-between gap-4 rounded-[24px] border border-black/8 bg-white/78 px-4 py-3 shadow-[0_14px_32px_rgba(17,17,16,0.04)] backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              AI for Academic
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Search papers, draft a scaffold, then run a quick integrity check.
            </p>
          </div>
          <div className="hidden items-center gap-2 xl:flex">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              Input on the left
            </span>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
              Output on the right
            </span>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-132px)] gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className={`${mobilePanel === "workspace" ? "hidden lg:block" : "block"} xl:block`}>
            <LeftPanel
              logs={pipeline.logs}
              language={pipeline.language}
              query={pipeline.query}
              isRunning={pipeline.isRunning}
              onLanguageChange={pipeline.setLanguage}
              onSearch={async (query) => {
                setMobilePanel("workspace");
                await pipeline.startSearch(query, pipeline.language);
              }}
              onReset={pipeline.reset}
            />
          </div>

          <div className={`${mobilePanel === "brief" ? "hidden lg:block" : "block"} xl:block`}>
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
              onSelectStep={pipeline.setActiveView}
              onToggleReference={pipeline.toggleReference}
              onRemoveReference={pipeline.removeReference}
              onContinueToAVR={pipeline.startAVR}
              onManuscriptChange={pipeline.updateManuscript}
              onContinueToRIC={pipeline.startRIC}
              onDismissFlag={pipeline.dismissFlag}
            />
            {pipeline.errorMessage ? (
              <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {pipeline.errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
