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
  autoChain: boolean;
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
  onAutoChainChange: (nextAutoChain: boolean) => void;
  onToggleReference: (referenceId: string) => void;
  onRemoveReference: (referenceId: string) => void;
  onContinueToAVR: () => Promise<void>;
  onManuscriptChange: (value: string) => void;
  onContinueToRIC: () => Promise<void>;
  onDismissFlag: (flagId: string) => void;
}

function ArtifactShell({
  tone = "neutral",
  title,
  body,
  cards,
}: {
  tone?: "neutral" | "active" | "warning" | "error";
  title: string;
  body: string;
  cards?: Array<{ title: string; body: string }>;
}) {
  const toneClassName =
    tone === "active"
      ? "border-sky-200 bg-sky-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "error"
          ? "border-rose-200 bg-rose-50"
          : "border-black/8 bg-stone-50/80";

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${toneClassName}`}>
      <h3 className="text-xl font-semibold leading-tight text-stone-900">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{body}</p>

      {cards?.length ? (
        <div className="mt-6 grid gap-3 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-xl border border-black/8 bg-white/86 px-4 py-4">
              <p className="text-base font-semibold text-stone-900">{card.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{card.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getContextualStatus({
  status,
  activeView,
  references,
  manuscript,
  integrityReport,
  errorMessage,
}: Pick<
  RightPanelProps,
  "status" | "activeView" | "references" | "manuscript" | "integrityReport" | "errorMessage"
>): string {
  if (status === "error" && errorMessage) {
    return errorMessage;
  }

  if (activeView === 1) {
    if (status === "searching" || status === "translating") {
      return "Searching papers...";
    }

    return references.length > 0 ? `${references.length} papers found` : "Run a search to see papers";
  }

  if (activeView === 2) {
    if (status === "drafting") {
      return "Draft in progress...";
    }

    return manuscript.trim() ? "Draft ready" : "Ready to create a draft";
  }

  if (status === "auditing") {
    return "Review in progress...";
  }

  return integrityReport ? `Score: ${integrityReport.overallScore}/100` : "Ready to run review";
}

export function RightPanel({
  status,
  currentStep,
  activeView,
  autoChain,
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
  onAutoChainChange,
  onToggleReference,
  onRemoveReference,
  onContinueToAVR,
  onManuscriptChange,
  onContinueToRIC,
  onDismissFlag,
}: RightPanelProps) {
  const isSearching = status === "searching" || status === "translating";
  const lastLog = logs.at(-1)?.message;
  const contextualStatus = getContextualStatus({
    status,
    activeView,
    references,
    manuscript,
    integrityReport,
    errorMessage,
  });

  return (
    <section className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-black/8 bg-white/90 shadow-lg">
      <div className="border-b border-black/6 px-4 py-4">
        <div className="flex flex-col gap-3">
          <PipelineTracker
            status={status}
            currentStep={currentStep}
            activeView={activeView}
            referencesCount={references.length}
            hasManuscript={Boolean(manuscript.trim())}
            integrityReport={integrityReport}
            onSelectStep={onSelectStep}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">{contextualStatus}</p>
            <button
              type="button"
              aria-pressed={autoChain}
              onClick={() => onAutoChainChange(!autoChain)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                autoChain
                  ? "border-[#C4634E]/30 bg-[#C4634E]/10 text-[#C4634E]"
                  : "border-black/10 bg-white text-stone-500 hover:bg-stone-50"
              }`}
            >
              {autoChain ? "Auto on" : "Auto off"}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
            <ArtifactShell
              title="Finding papers"
              body={lastLog || "Searching medical and academic databases..."}
              tone="active"
            />
          ) : status === "error" ? (
            <ArtifactShell
              title="The run stopped"
              body={
                errorMessage ||
                "Something interrupted the request. Try again with a shorter or broader question."
              }
              tone="error"
            />
          ) : query.trim() ? (
            <ArtifactShell
              title="No papers found yet"
              body="Try a broader term, fewer modifiers, or the English name of the procedure or device."
              tone="warning"
            />
          ) : (
            <ArtifactShell
              title="Your output will appear here"
              body="Search to unlock papers, drafting, and review."
              cards={[
                {
                  title: "Papers",
                  body: "Keep the papers you want to use.",
                },
                {
                  title: "Draft",
                  body: "A draft appears after paper selection.",
                },
                {
                  title: "Review",
                  body: "Review flags appear after the draft.",
                },
              ]}
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
