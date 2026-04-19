"use client";

import React, { useState } from "react";
import type { CanvasHistoryEntry, CanvasState } from "@/hooks/useCanvas";
import type { IntegrityFlag, IntegrityReport, PipelineStatus, Reference } from "@/lib/pipeline/types";
import { parseManuscriptSections, getParagraphSeverity } from "./pipeline-utils";

// ── Props ────────────────────────────────────────────────────────────────────
interface CanvasPanelProps {
  canvasState: CanvasState;
  canvasHistory: CanvasHistoryEntry[];
  references: Reference[];
  selectedReferenceIds: string[];
  manuscript: string;
  integrityReport: IntegrityReport | null;
  isRunning: boolean;
  status: PipelineStatus;
  language: "EN" | "VI";
  translatingIds: string[];
  onSelectTab: (state: CanvasState) => void;
  onToggleReference: (id: string) => void;
  onTranslateReference: (id: string) => void;
  onUpdateManuscript: (text: string) => void;
  onDismissFlag: (id: string) => void;
  onSendMessage: (text: string) => void;
  onStartRIC: (text?: string) => void;
}

// ── Tabs visible order (deduplicated by state type, keep last label) ──────────
function getUniqueTabs(history: CanvasHistoryEntry[]): CanvasHistoryEntry[] {
  const seen = new Map<CanvasState, CanvasHistoryEntry>();
  for (const entry of history) {
    seen.set(entry.state, entry);
  }
  return Array.from(seen.values());
}

// ── Inline highlight renderer ─────────────────────────────────────────────────
function renderWithHighlights(
  text: string,
  flags: IntegrityFlag[],
  onFlagClick: (id: string) => void,
): React.ReactNode {
  if (flags.length === 0) return text;

  const positioned = flags
    .map((f) => ({ flag: f, idx: text.indexOf(f.location.textSnippet) }))
    .filter((f) => f.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  if (positioned.length === 0) return text;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const { flag, idx } of positioned) {
    if (idx > cursor) nodes.push(text.slice(cursor, idx));

    const isError = flag.severity === "error";
    nodes.push(
      <mark
        key={flag.id}
        data-flag-id={flag.id}
        onClick={() => onFlagClick(flag.id)}
        title={flag.message}
        className={`cursor-pointer rounded-sm px-0.5 border-b-2 transition-colors ${
          isError
            ? "bg-red-50 border-red-400 text-red-900 hover:bg-red-100"
            : "bg-yellow-50 border-yellow-400 text-yellow-900 hover:bg-yellow-100"
        }`}
      >
        {flag.location.textSnippet}
      </mark>,
    );
    cursor = idx + flag.location.textSnippet.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

// ── Reference skeleton ────────────────────────────────────────────────────────
function ReferenceSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-black/[0.06] bg-white p-5 space-y-3">
      <div className="h-4 bg-stone-100 rounded w-3/4" />
      <div className="h-3 bg-stone-100 rounded w-1/2" />
      <div className="h-3 bg-stone-100 rounded w-full" />
      <div className="h-3 bg-stone-100 rounded w-5/6" />
    </div>
  );
}

// ── Reference card ────────────────────────────────────────────────────────────
function ReferenceCard({
  reference,
  selected,
  language,
  isTranslating,
  onToggle,
  onTranslate,
}: {
  reference: Reference;
  selected: boolean;
  language: "EN" | "VI";
  isTranslating: boolean;
  onToggle: () => void;
  onTranslate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [copied, setCopied] = useState(false);

  const abstract = showTranslated && reference.abstractTranslated
    ? reference.abstractTranslated
    : reference.abstract;

  // Auto-switch view when translation finishes
  React.useEffect(() => {
    if (reference.abstractTranslated) {
      setShowTranslated(true);
    }
  }, [reference.abstractTranslated]);

  const snippetLength = 200;
  const isLong = abstract.length > snippetLength;
  const displayAbstract = expanded || !isLong ? abstract : abstract.slice(0, snippetLength) + "...";

  async function handleCopy() {
    const text = `${reference.title}\n${reference.authors.join(", ")} · ${reference.journal} · ${reference.year}\n\n${reference.abstract}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-all ${
        selected
          ? "border-[#C4634E]/30 ring-1 ring-[#C4634E]/20"
          : "border-black/[0.07] hover:border-black/[0.12]"
      }`}
    >
      <div className="p-5">
        {/* Title + checkbox */}
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-stone-300 text-[#C4634E] focus:ring-[#C4634E] cursor-pointer"
          />
          <h3
            className="font-semibold text-stone-900 text-sm leading-snug cursor-pointer hover:text-[#C4634E] transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {reference.title}
          </h3>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 mb-3 ml-7">
          <span>{reference.authors.slice(0, 3).join(", ")}{reference.authors.length > 3 ? " et al." : ""}</span>
          <span className="text-stone-300">·</span>
          <span className="italic">{reference.journal}</span>
          <span className="text-stone-300">·</span>
          <span>{reference.year}</span>
          {reference.citationCount != null && (
            <>
              <span className="text-stone-300">·</span>
              <span>Cited: {reference.citationCount}</span>
            </>
          )}
        </div>

        {/* Abstract */}
        <div className="ml-7 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2.5 text-sm text-stone-700 leading-relaxed mb-3">
          <p>{displayAbstract}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {expanded
                ? language === "EN" ? "Show less ↑" : "Thu gọn ↑"
                : language === "EN" ? "Show more ↓" : "Xem thêm ↓"}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="ml-7 flex flex-wrap items-center gap-1.5">
          {/* Translate */}
          <button
            onClick={() => {
              if (reference.abstractTranslated) {
                setShowTranslated(!showTranslated);
              } else {
                onTranslate();
              }
            }}
            disabled={isTranslating}
            title={
              reference.abstractTranslated
                ? showTranslated
                  ? language === "EN" ? "View Original" : "Xem bản gốc"
                  : language === "EN" ? "View Translation" : "Xem bản dịch TV"
                : language === "EN" ? "Translate to VI" : "Dịch sang Tiếng Việt"
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              reference.abstractTranslated
                ? showTranslated
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                : "border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-wait"
            }`}
          >
            {isTranslating
              ? (language === "EN" ? "🌐 Translating..." : "🌐 Đang dịch...")
              : "🌐 " + (reference.abstractTranslated && showTranslated 
                 ? (language === "EN" ? "Original" : "Bản gốc") 
                 : (language === "EN" ? "Translate" : "Dịch"))}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
          >
            {copied 
              ? (language === "EN" ? "✓ Copied" : "✓ Đã copy") 
              : "📋 Copy"}
          </button>

          {/* Link */}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
            >
              🔗 Link
            </a>
          )}

          {/* Source badge */}
          <span
            className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              reference.source === "pubmed"
                ? "bg-blue-50 text-blue-600"
                : "bg-violet-50 text-violet-600"
            }`}
          >
            {reference.source}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main CanvasPanel ──────────────────────────────────────────────────────────
export default function CanvasPanel({
  canvasState,
  canvasHistory,
  references,
  selectedReferenceIds,
  manuscript,
  integrityReport,
  isRunning,
  status,
  language,
  translatingIds,
  onSelectTab,
  onToggleReference,
  onTranslateReference,
  onUpdateManuscript,
  onDismissFlag,
  onSendMessage,
  onStartRIC,
}: CanvasPanelProps) {
  const uniqueTabs = getUniqueTabs(canvasHistory);
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);

  function scrollToFlag(flagId: string) {
    setActiveFlagId(flagId);
    const el = document.querySelector(`[data-flag-id="${flagId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const tabLabels: Record<CanvasState, string> = {
    idle: "Workspace",
    reference: "🔍 References",
    editor: "✍️ Draft",
    integrity: "🔬 RIC Report",
  };

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Canvas Tab Bar ────────────────────────────────────────────── */}
      {uniqueTabs.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2.5 border-b border-black/[0.06] bg-white/60 overflow-x-auto">
          {uniqueTabs.map((entry) => (
            <button
              key={entry.state}
              onClick={() => onSelectTab(entry.state)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                canvasState === entry.state
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
              }`}
            >
              {tabLabels[entry.state]}
            </button>
          ))}
        </div>
      )}

      {/* ── Canvas content ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── IDLE ──────────────────────────────────────────────────── */}
        {canvasState === "idle" && (
          <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-center mb-6">
              <span className="text-3xl">🔬</span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-stone-900 mb-2">
              AFA Workspace
            </h2>
            <p className="text-stone-500 text-sm max-w-xs leading-relaxed mb-8">
              Search literature, draft manuscripts, and check research integrity — all in one place.
            </p>

            {/* Entry point chips */}
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              {[
                {
                  emoji: "🔍",
                  label: "Search literature",
                  action: () => onSendMessage("Find papers on: "),
                },
                {
                  emoji: "✍️",
                  label: "Draft manuscript (AVR)",
                  action: () => onSendMessage("Draft a manuscript about: "),
                },
                {
                  emoji: "🔬",
                  label: "Check my paper (RIC)",
                  action: () => onSelectTab("editor"),
                },
              ].map(({ emoji, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-black/[0.07] shadow-sm hover:border-black/[0.15] hover:shadow-md transition-all text-left"
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm font-medium text-stone-700">{label}</span>
                  <span className="ml-auto text-stone-300">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── REFERENCE_VIEW ────────────────────────────────────────── */}
        {canvasState === "reference" && (
          <div className="px-5 py-5 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-stone-900">Search Results</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {references.length > 0
                    ? `${selectedReferenceIds.length}/${references.length} selected`
                    : isRunning ? "Searching..." : "No results yet"}
                </p>
              </div>
              {references.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#C4634E]/10 text-[#C4634E] text-xs font-semibold">
                  {references.length} {language === "EN" ? "results" : "kết quả"}
                </span>
              )}
            </div>

            {/* Streaming skeletons */}
            {isRunning && (status === "searching" || status === "translating") && (
              <div className="space-y-3">
                {references.length === 0 && <ReferenceSkeleton />}
                {references.length === 0 && <ReferenceSkeleton />}
                {references.length === 0 && <ReferenceSkeleton />}
              </div>
            )}

            {/* Reference cards */}
            {references.map((ref) => (
              <ReferenceCard
                key={ref.id}
                reference={ref}
                selected={selectedReferenceIds.includes(ref.id)}
                language={language}
                isTranslating={translatingIds.includes(ref.id)}
                onToggle={() => onToggleReference(ref.id)}
                onTranslate={() => onTranslateReference(ref.id)}
              />
            ))}

            {/* Loading more indicator */}
            {isRunning && references.length > 0 && (
              <div className="flex items-center gap-2 py-3 text-stone-400 text-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                {language === "EN" ? "Loading more..." : "Đang tải thêm..."}
              </div>
            )}

            {/* Empty state */}
            {!isRunning && references.length === 0 && (
              <div className="text-center py-16 text-stone-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm">
                  {language === "EN" 
                    ? "No references found. Try a different term." 
                    : "Không tìm thấy tài liệu nào. Vui lòng thử từ khoá khác."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR_VIEW ───────────────────────────────────────────── */}
        {canvasState === "editor" && (
          <div className="flex flex-col h-full px-5 py-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-stone-900">✍️ Draft Editor</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Paste your manuscript here to use with RIC
                </p>
              </div>
              {manuscript && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(manuscript)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    💾 Copy
                  </button>
                  <button
                    onClick={() => onStartRIC()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C4634E] text-white hover:bg-[#b45743] transition-colors"
                  >
                    🔬 {language === "EN" ? "Run RIC" : "Chạy RIC"}
                  </button>
                </div>
              )}
            </div>

            {/* AVR coming soon banner */}
            <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
              <span className="text-lg">🚧</span>
              <div>
                <p className="text-sm font-medium text-violet-800">AVR — Coming Soon</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  AI-powered manuscript drafting is almost ready. For now, paste your draft below and run RIC to check integrity.
                </p>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={manuscript}
              onChange={(e) => onUpdateManuscript(e.target.value)}
              placeholder="Paste your manuscript here...&#10;&#10;Once you have content, click 🔬 Run RIC to check research integrity."
              className="flex-1 min-h-[300px] w-full rounded-xl border border-black/[0.08] bg-white px-5 py-4 text-sm text-stone-800 leading-relaxed font-serif resize-none outline-none focus:border-stone-300 focus:ring-1 focus:ring-stone-200 transition-all placeholder-stone-300"
            />

            {manuscript && (
              <p className="mt-2 text-xs text-stone-400 text-right">
                {manuscript.split(/\s+/).filter(Boolean).length} words
              </p>
            )}
          </div>
        )}

        {/* ── INTEGRITY_OVERLAY ─────────────────────────────────────── */}
        {canvasState === "integrity" && (
          <div className="px-5 py-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-stone-900">🔬 RIC Integrity Report</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isRunning ? "Analyzing..." : "Click highlighted text to see details"}
                </p>
              </div>
              {integrityReport && (
                <div
                  className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    integrityReport.overallScore >= 80
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : integrityReport.overallScore >= 60
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {integrityReport.overallScore}/100
                </div>
              )}
            </div>

            {/* Summary */}
            {integrityReport?.summary && (
              <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-sm text-stone-700 leading-relaxed">
                {integrityReport.summary}
              </div>
            )}

            {/* Flag counts */}
            {integrityReport && integrityReport.flags.length > 0 && (
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-red-700">
                    {integrityReport.flags.filter((f) => f.severity === "error").length} critical
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-100">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-700">
                    {integrityReport.flags.filter((f) => f.severity === "warning").length} warnings
                  </span>
                </div>
              </div>
            )}

            {/* Manuscript with highlights */}
            {manuscript && (
              <div className="rounded-xl border border-black/[0.07] bg-white shadow-sm">
                <div className="px-6 py-5 font-serif text-base text-stone-800 leading-relaxed">
                  {(() => {
                    const sections = parseManuscriptSections(manuscript);
                    if (sections.length === 0) {
                      // Plain text fallback
                      const paragraphs = manuscript.split(/\n\n+/).filter(Boolean);
                      return paragraphs.map((para, pIdx) => {
                        const paraFlags =
                          integrityReport?.flags.filter(
                            (f) => f.location.paragraphIndex === pIdx,
                          ) ?? [];
                        const severity = getParagraphSeverity(paraFlags);
                        return (
                          <p
                            key={pIdx}
                            id={`para-${pIdx}`}
                            className={`mb-4 text-justify last:mb-0 rounded px-1 -mx-1 transition-colors ${
                              severity === "error"
                                ? "bg-red-50/50"
                                : severity === "warning"
                                ? "bg-yellow-50/50"
                                : ""
                            } ${
                              activeFlagId &&
                              paraFlags.some((f) => f.id === activeFlagId)
                                ? "ring-2 ring-offset-1 ring-yellow-300"
                                : ""
                            }`}
                          >
                            {renderWithHighlights(para, paraFlags, scrollToFlag)}
                          </p>
                        );
                      });
                    }

                    // Use sIdx * 1000 + pIdx as stable unique key — avoids mutable counter in JSX
                    return sections.map((section, sIdx) => (
                      <div key={sIdx}>
                        {section.heading && (
                          <h3 className="font-sans font-bold text-lg text-stone-900 mt-6 mb-3 first:mt-0">
                            {section.heading}
                          </h3>
                        )}
                        {section.paragraphs.map((para, pIdx) => {
                          const paraFlags =
                            integrityReport?.flags.filter(
                              (f) =>
                                f.location.sectionHeading === section.heading &&
                                f.location.paragraphIndex === pIdx,
                            ) ?? [];
                          const severity = getParagraphSeverity(paraFlags);
                          const paraKey = sIdx * 1000 + pIdx;
                          return (
                            <p
                              key={paraKey}
                              id={`para-${paraKey}`}
                              className={`mb-4 text-justify last:mb-0 rounded px-1 -mx-1 transition-colors ${
                                severity === "error"
                                  ? "bg-red-50/50"
                                  : severity === "warning"
                                  ? "bg-yellow-50/50"
                                  : ""
                              } ${
                                activeFlagId &&
                                paraFlags.some((f) => f.id === activeFlagId)
                                  ? "ring-2 ring-offset-1 ring-yellow-300"
                                  : ""
                              }`}
                            >
                              {renderWithHighlights(para, paraFlags, scrollToFlag)}
                            </p>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Issue list */}
            {integrityReport && integrityReport.flags.length > 0 && (
              <div className="rounded-xl border border-black/[0.07] bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-black/[0.06] bg-stone-50/80">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                    Issue List
                  </p>
                </div>
                <div className="divide-y divide-black/[0.05]">
                  {integrityReport.flags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer ${
                        activeFlagId === flag.id ? "bg-yellow-50/50" : ""
                      }`}
                      onClick={() => scrollToFlag(flag.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                            flag.severity === "error" ? "bg-red-400" : "bg-yellow-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-stone-700 mb-0.5">
                            {flag.message}
                          </p>
                          <p className="text-[11px] text-stone-400 truncate">
                            &ldquo;{flag.location.textSnippet}&rdquo;
                          </p>
                          {flag.suggestion && (
                            <p className="text-[11px] text-stone-500 mt-1 italic">
                              💡 {flag.suggestion}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissFlag(flag.id);
                          }}
                          className="flex-shrink-0 text-stone-300 hover:text-stone-500 transition-colors text-sm"
                          title="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isRunning && (
              <div className="flex items-center gap-2 py-2 text-stone-400 text-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                Analyzing manuscript...
              </div>
            )}

            {/* Empty state */}
            {!isRunning && !integrityReport && !manuscript && (
              <div className="text-center py-16 text-stone-400">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm">No content to check yet.</p>
                <p className="text-xs mt-1">Paste your manuscript in the Editor tab and run RIC.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
