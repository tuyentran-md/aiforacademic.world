"use client";

import type {
  Blueprint,
  IntegrityReport,
  LogEntry,
  PipelineStatus,
  Reference,
} from "@/lib/pipeline/types";
import { IntegrityOverlay } from "./IntegrityOverlay";
import { ManuscriptEditor } from "./ManuscriptEditor";
import { PipelineTracker } from "./PipelineTracker";
import { ReferenceList } from "./ReferenceList";

interface RightPanelProps {
  status: PipelineStatus;
  currentStep: 1 | 2 | 3;
  activeView: 1 | 2 | 3;
  language: "EN" | "VI";
  query: string;
  references: Reference[];
  selectedReferenceIds: string[];
  manuscript: string;
  blueprint: Blueprint | null;
  integrityReport: IntegrityReport | null;
  logs: LogEntry[];
  errorMessage: string | null;
  onSelectStep: (step: 1 | 2 | 3) => void;
  onToggleReference: (referenceId: string) => void;
  onRemoveReference: (referenceId: string) => void;
  onContinueToAVR: () => Promise<void>;
  onManuscriptChange: (value: string) => void;
  onContinueToRIC: () => Promise<void>;
  onDismissFlag: (flagId: string) => void;
}

function OutputShell({
  label,
  title,
  body,
  tone = "neutral",
}: {
  label: string;
  title: string;
  body: string;
  tone?: "neutral" | "active" | "warning" | "error";
}) {
  const toneClassName =
    tone === "active"
      ? "border-sky-200 bg-sky-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "error"
          ? "border-rose-200 bg-rose-50"
          : "border-black/8 bg-white/82";

  return (
    <div className="flex min-h-[460px] items-center">
      <div
        className={`w-full rounded-[28px] border p-7 shadow-[0_18px_40px_rgba(17,17,16,0.05)] ${toneClassName}`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          {label}
        </p>
        <h2 className="mt-3 font-serif text-[2.1rem] font-bold leading-tight text-stone-900">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">{body}</p>
      </div>
    </div>
  );
}

export function RightPanel({
  status,
  currentStep,
  activeView,
  language,
  query,
  references,
  selectedReferenceIds,
  manuscript,
  blueprint,
  integrityReport,
  logs,
  errorMessage,
  onSelectStep,
  onToggleReference,
  onRemoveReference,
  onContinueToAVR,
  onManuscriptChange,
  onContinueToRIC,
  onDismissFlag,
}: RightPanelProps) {
  const isSearching = status === "searching" || status === "translating";
  const lastLog = logs.at(-1)?.message;

  return (
    <section className="flex h-full min-h-[420px] flex-col gap-3">
      <PipelineTracker
        status={status}
        currentStep={currentStep}
        activeView={activeView}
        referencesCount={references.length}
        hasManuscript={Boolean(manuscript.trim())}
        integrityReport={integrityReport}
        onSelectStep={onSelectStep}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeView === 1 ? (
          references.length > 0 ? (
            <ReferenceList
              references={references}
              selectedReferenceIds={selectedReferenceIds}
              language={language}
              disabled={isSearching}
              onToggleReference={onToggleReference}
              onRemoveReference={onRemoveReference}
              onContinue={onContinueToAVR}
            />
          ) : isSearching ? (
            <OutputShell
              label="Sources"
              title="Searching sources..."
              body={lastLog || "Checking PubMed and OpenAlex for relevant papers."}
              tone="active"
            />
          ) : status === "error" ? (
            <OutputShell
              label="Sources"
              title="Search stopped"
              body={errorMessage || "Something interrupted the request. Try again with a shorter or broader question."}
              tone="error"
            />
          ) : query.trim() ? (
            <OutputShell
              label="Sources"
              title="No matching studies yet"
              body="Try a broader clinical term, fewer modifiers, or the English name of the procedure/device."
              tone="warning"
            />
          ) : (
            <OutputShell
              label="Sources"
              title="Sources will appear here"
              body="Type a research question on the left to fetch papers and build a shortlist."
            />
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
