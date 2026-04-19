"use client";

import type { Blueprint, IntegrityReport, PipelineStatus, Reference } from "@/lib/pipeline/types";
import { IntegrityOverlay } from "./IntegrityOverlay";
import { ManuscriptEditor } from "./ManuscriptEditor";
import { PipelineTracker } from "./PipelineTracker";
import { ReferenceList } from "./ReferenceList";

interface RightPanelProps {
  status: PipelineStatus;
  currentStep: 1 | 2 | 3;
  activeView: 1 | 2 | 3;
  language: "EN" | "VI";
  references: Reference[];
  selectedReferenceIds: string[];
  manuscript: string;
  blueprint: Blueprint | null;
  integrityReport: IntegrityReport | null;
  onSelectStep: (step: 1 | 2 | 3) => void;
  onToggleReference: (referenceId: string) => void;
  onRemoveReference: (referenceId: string) => void;
  onContinueToAVR: () => Promise<void>;
  onManuscriptChange: (value: string) => void;
  onContinueToRIC: () => Promise<void>;
  onDismissFlag: (flagId: string) => void;
}

export function RightPanel({
  status,
  currentStep,
  activeView,
  language,
  references,
  selectedReferenceIds,
  manuscript,
  blueprint,
  integrityReport,
  onSelectStep,
  onToggleReference,
  onRemoveReference,
  onContinueToAVR,
  onManuscriptChange,
  onContinueToRIC,
  onDismissFlag,
}: RightPanelProps) {
  return (
    <section className="flex h-full min-h-[420px] flex-col gap-4">
      <PipelineTracker
        status={status}
        currentStep={currentStep}
        activeView={activeView}
        referencesCount={references.length}
        hasManuscript={Boolean(manuscript.trim())}
        integrityReport={integrityReport}
        onSelectStep={onSelectStep}
      />

      <div className="flex-1 overflow-y-auto">
        {activeView === 1 ? (
          references.length > 0 || status === "searching" || status === "translating" ? (
            <ReferenceList
              references={references}
              selectedReferenceIds={selectedReferenceIds}
              language={language}
              disabled={status === "searching" || status === "translating"}
              onToggleReference={onToggleReference}
              onRemoveReference={onRemoveReference}
              onContinue={onContinueToAVR}
            />
          ) : (
            <div className="rounded-[32px] border border-dashed border-black/10 bg-white/70 px-6 py-12 text-center shadow-[0_18px_40px_rgba(17,17,16,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Step 1
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold text-stone-900">
                Search results will appear here
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
                Start with a research question in the left panel. We will fetch references from
                PubMed and OpenAlex, rank them, and optionally translate abstracts for Vietnamese
                review.
              </p>
            </div>
          )
        ) : null}

        {activeView === 2 ? (
          <ManuscriptEditor
            manuscript={manuscript}
            blueprint={blueprint}
            references={references.filter((reference) => selectedReferenceIds.includes(reference.id))}
            isStreaming={status === "drafting"}
            onChange={onManuscriptChange}
            onContinue={onContinueToRIC}
          />
        ) : null}

        {activeView === 3 ? (
          <IntegrityOverlay
            manuscript={manuscript}
            report={integrityReport}
            isRunning={status === "auditing"}
            onDismissFlag={onDismissFlag}
          />
        ) : null}
      </div>
    </section>
  );
}
