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
    <div className={`rounded-[28px] border p-6 shadow-[0_14px_34px_rgba(17,17,16,0.04)] ${toneClassName}`}>
      <h3 className="font-serif text-[2rem] font-bold leading-tight text-stone-900">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">{body}</p>

      {cards?.length ? (
        <div className="mt-6 grid gap-3 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[24px] border border-black/8 bg-white/86 px-4 py-4">
              <p className="text-sm font-semibold text-stone-900">{card.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{card.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getArtifactLabel(activeView: 1 | 2 | 3): string {
  if (activeView === 1) {
    return "Papers";
  }
  if (activeView === 2) {
    return "Draft";
  }
  return "Review";
}

function getArtifactSummary(activeView: 1 | 2 | 3): string {
  if (activeView === 1) {
    return "Relevant papers from PubMed and OpenAlex.";
  }
  if (activeView === 2) {
    return "A draft scaffold built from the selected papers.";
  }
  return "Integrity flags on the draft.";
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
    <section className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[32px] border border-black/8 bg-white/90 shadow-[0_22px_50px_rgba(17,17,16,0.06)]">
      <div className="border-b border-black/6 px-4 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              Artifact
            </p>
            <h2 className="mt-2 font-serif text-[1.9rem] font-bold leading-tight text-stone-900">
              {getArtifactLabel(activeView)}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{getArtifactSummary(activeView)}</p>
          </div>

          <PipelineTracker
            status={status}
            currentStep={currentStep}
            activeView={activeView}
            referencesCount={references.length}
            hasManuscript={Boolean(manuscript.trim())}
            integrityReport={integrityReport}
            onSelectStep={onSelectStep}
          />
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
              body={lastLog || "AFA is checking PubMed and OpenAlex for relevant studies."}
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
              title="Your results will appear here"
              body="This pane keeps the outputs from the pipeline while the chat on the left handles the request."
              cards={[
                {
                  title: "Papers",
                  body: "A shortlist of relevant studies that you can keep or remove.",
                },
                {
                  title: "Draft",
                  body: "A first manuscript scaffold based on the papers you selected.",
                },
                {
                  title: "Review",
                  body: "An integrity pass that flags weak claims, missing support, and other issues.",
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
