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

function SearchStateCard({
  eyebrow,
  title,
  description,
  accentClassName,
  detailLines,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accentClassName: string;
  detailLines: string[];
}) {
  return (
    <div className="flex min-h-[560px] items-stretch">
      <div className="flex w-full flex-col justify-between rounded-[32px] border border-black/8 bg-white/78 p-6 shadow-[0_18px_40px_rgba(17,17,16,0.05)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-stone-900">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">{description}</p>
        </div>

        <div className={`mt-6 rounded-[28px] border px-5 py-5 ${accentClassName}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
            What happens here
          </p>
          <div className="mt-3 space-y-3">
            {detailLines.map((detail) => (
              <div
                key={detail}
                className="rounded-2xl border border-current/10 bg-white/70 px-4 py-3 text-sm leading-relaxed"
              >
                {detail}
              </div>
            ))}
          </div>
        </div>
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
  const selectedCount = selectedReferenceIds.length;
  const isSearching = status === "searching" || status === "translating";
  const recentActivity = logs.slice(-4).map((entry) => `${entry.tool}: ${entry.message}`);

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
          references.length > 0 ? (
            <ReferenceList
              references={references}
              selectedReferenceIds={selectedReferenceIds}
              language={language}
              disabled={status === "searching" || status === "translating"}
              onToggleReference={onToggleReference}
              onRemoveReference={onRemoveReference}
              onContinue={onContinueToAVR}
            />
          ) : isSearching ? (
            <SearchStateCard
              eyebrow="Step 1 in progress"
              title="Searching for studies..."
              description={`We are interpreting "${query}" and checking PubMed plus OpenAlex. The live activity panel on the left shows the exact search path.`}
              accentClassName="border-sky-200 bg-sky-50 text-sky-900"
              detailLines={
                recentActivity.length > 0
                  ? recentActivity
                  : [
                      "The app can accept English or Vietnamese questions.",
                      "PubMed search is refined for biomedical keywords.",
                      "OpenAlex gives a broader cross-check in parallel.",
                    ]
              }
            />
          ) : status === "error" ? (
            <SearchStateCard
              eyebrow="Step 1 needs attention"
              title="The search stopped before results arrived"
              description={errorMessage || "Something interrupted the request before references were returned."}
              accentClassName="border-rose-200 bg-rose-50 text-rose-900"
              detailLines={
                recentActivity.length > 0
                  ? recentActivity
                  : [
                      "Try running the search again with a shorter question.",
                      "If it keeps failing, the live activity panel usually shows which source broke.",
                    ]
              }
            />
          ) : query.trim() ? (
            <SearchStateCard
              eyebrow="Step 1 complete"
              title="No studies matched this search yet"
              description={`We finished searching for "${query}" but did not keep any references. This usually means the topic is too narrow, too colloquial, or needs a more standard clinical term.`}
              accentClassName="border-amber-200 bg-amber-50 text-amber-900"
              detailLines={
                recentActivity.length > 0
                  ? recentActivity
                  : [
                      "Try a broader topic with fewer modifiers.",
                      "Use the core population + intervention + condition only.",
                      "If you know the English device/procedure term, include it directly.",
                    ]
              }
            />
          ) : (
            <SearchStateCard
              eyebrow="Step 1"
              title="Start by finding the evidence"
              description="Use the brief panel on the left to describe the topic you want to write about. Once the search runs, this workspace will turn into a paper shortlist you can curate."
              accentClassName="border-stone-200 bg-stone-50 text-stone-700"
              detailLines={[
                "Find evidence: search PubMed/OpenAlex and keep the useful papers.",
                `Build first draft: turn the selected ${selectedCount > 0 ? `${selectedCount} paper(s)` : "papers"} into a manuscript scaffold.`,
                "Audit claims: flag unsupported statements, missing citations, and overclaiming.",
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
