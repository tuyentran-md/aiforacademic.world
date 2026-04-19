"use client";

import type { IntegrityReport } from "@/lib/pipeline/types";
import { FlagCard } from "./FlagCard";
import { getParagraphSeverity, parseManuscriptSections } from "./pipeline-utils";

interface IntegrityOverlayProps {
  manuscript: string;
  report: IntegrityReport | null;
  isRunning: boolean;
  onDismissFlag: (flagId: string) => void;
}

function severityClassName(severity: "error" | "warning" | "info" | null): string {
  if (severity === "error") {
    return "border-rose-300 bg-rose-50";
  }
  if (severity === "warning") {
    return "border-amber-300 bg-amber-50";
  }
  if (severity === "info") {
    return "border-sky-300 bg-sky-50";
  }
  return "border-transparent bg-transparent";
}

export function IntegrityOverlay({
  manuscript,
  report,
  isRunning,
  onDismissFlag,
}: IntegrityOverlayProps) {
  const sections = parseManuscriptSections(manuscript);
  const flags = report?.flags || [];
  const counts = {
    error: flags.filter((flag) => flag.severity === "error").length,
    warning: flags.filter((flag) => flag.severity === "warning").length,
    info: flags.filter((flag) => flag.severity === "info").length,
  };

  function handleExport() {
    const blob = new Blob([manuscript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "afa-manuscript.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(manuscript);
  }

  return (
    <div className="rounded-xl border border-black/8 bg-stone-50/80 p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            Review
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-900">
            {report ? `Score: ${report.overallScore}/100` : "Integrity review"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            {report?.summary ||
              (isRunning
                ? "Checking claims, citations, and evidence strength."
                : "Review results will appear here.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!manuscript.trim()}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!manuscript.trim()}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40"
          >
            Download Markdown
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{counts.error} errors</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{counts.warning} warnings</span>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">{counts.info} info</span>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.heading} className="rounded-lg bg-stone-50 p-5">
            <h3 className="text-xl font-semibold text-stone-900">{section.heading}</h3>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph, paragraphIndex) => {
                const paragraphFlags = flags.filter(
                  (flag) =>
                    flag.location.sectionHeading === section.heading &&
                    flag.location.paragraphIndex === paragraphIndex,
                );
                const severity = getParagraphSeverity(paragraphFlags);

                return (
                  <div key={`${section.heading}-${paragraphIndex}`}>
                    <div
                      className={`rounded-lg border-l-4 px-4 py-4 text-sm leading-7 text-stone-700 ${severityClassName(
                        severity,
                      )}`}
                    >
                      {paragraph}
                    </div>
                    {paragraphFlags.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {paragraphFlags.map((flag) => (
                          <FlagCard key={flag.id} flag={flag} onDismiss={onDismissFlag} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {isRunning ? (
          <div className="rounded-lg border border-dashed border-black/10 bg-stone-50 px-4 py-5 text-sm text-stone-500">
            AFA is still reading the manuscript and streaming integrity flags.
          </div>
        ) : null}
      </div>
    </div>
  );
}
