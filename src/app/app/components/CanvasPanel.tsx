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
  onBulkTranslate: (ids: string[]) => void;
  onUpdateManuscript: (text: string) => void;
  onDismissFlag: (id: string) => void;
  onSendMessage: (text: string) => void;
  onStartRIC: (text?: string) => void;
  onStartAVR: () => void;
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

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconCopy({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
    </svg>
  );
}

function IconExternalLink({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M10 2h4m0 0v4m0-4L7 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpinner({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className={`${className} animate-spin`}>
      <circle cx="8" cy="8" r="6" strokeOpacity={0.25} />
      <path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" />
    </svg>
  );
}

function IconTranslate({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M2 4h7M5.5 2v2M2 4c0 2.5 1.5 4.5 3.5 4.5M9 4c0 2.5-1.5 4.5-3.5 4.5M6 14l2.5-6 2.5 6M7 12h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  const [showTranslated, setShowTranslated] = useState(true);
  const [copied, setCopied] = useState(false);

  // Auto-show translation panel when translation finishes
  React.useEffect(() => {
    if (reference.abstractTranslated) {
      setShowTranslated(true);
    }
  }, [reference.abstractTranslated]);

  const snippetLength = 220;
  const isLong = reference.abstract.length > snippetLength;
  const displayAbstract =
    expanded || !isLong
      ? reference.abstract
      : reference.abstract.slice(0, snippetLength) + "…";

  async function handleCopy() {
    const firstAuthor = reference.authors[0] ?? "Unknown";
    const authorStr =
      reference.authors.length > 1 ? `${firstAuthor} et al.` : firstAuthor;
    const citation = `${authorStr}, ${reference.year}. ${reference.title}. ${reference.journal}.`;
    await navigator.clipboard.writeText(citation);
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
          <span>
            {reference.authors.slice(0, 3).join(", ")}
            {reference.authors.length > 3 ? " et al." : ""}
          </span>
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

        {/* Original Abstract */}
        <div className="ml-7 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2.5 text-sm text-stone-700 leading-relaxed mb-2">
          <p>{displayAbstract}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {expanded
                ? language === "EN"
                  ? "Show less ↑"
                  : "Thu gọn ↑"
                : language === "EN"
                ? "Show more ↓"
                : "Xem thêm ↓"}
            </button>
          )}
        </div>

        {/* Translated abstract — inline below original */}
        {reference.abstractTranslated && showTranslated && (
          <div className="ml-7 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-sm text-blue-900 leading-relaxed mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
              {language === "EN" ? "Vietnamese" : "Tiếng Việt"}
            </p>
            <p>{reference.abstractTranslated}</p>
          </div>
        )}

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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              reference.abstractTranslated
                ? showTranslated
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                : "border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-wait"
            }`}
          >
            {isTranslating ? (
              <>
                <IconSpinner />
                {language === "EN" ? "Translating" : "Đang dịch"}
              </>
            ) : (
              <>
                <IconTranslate />
                {reference.abstractTranslated
                  ? showTranslated
                    ? language === "EN"
                      ? "Hide translation"
                      : "Ẩn bản dịch"
                    : language === "EN"
                    ? "Show translation"
                    : "Hiện bản dịch"
                  : language === "EN"
                  ? "Translate"
                  : "Dịch"}
              </>
            )}
          </button>

          {/* Full text */}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
            >
              <IconExternalLink />
              {language === "EN" ? "Full text" : "Toàn văn"} ↗
            </a>
          )}

          {/* Copy citation */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
          >
            <IconCopy />
            {copied
              ? language === "EN"
                ? "Copied"
                : "Đã copy"
              : language === "EN"
              ? "Copy citation"
              : "Copy trích dẫn"}
          </button>

          {/* Source badge */}
          <span
            className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase tracking-wide ${
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
  onBulkTranslate,
  onUpdateManuscript,
  onDismissFlag,
  onSendMessage,
  onStartRIC,
  onStartAVR,
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
    reference: "References",
    editor: "Draft",
    integrity: "Integrity Report",
  };

  // References not yet translated among selected
  const untranslatedSelectedIds = selectedReferenceIds.filter((id) => {
    const ref = references.find((r) => r.id === id);
    return ref && !ref.abstractTranslated && !translatingIds.includes(id);
  });

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
          <div className="flex flex-col items-center justify-center h-full px-8 py-16">
            {/* Logo mark */}
            <div className="w-12 h-12 rounded-xl bg-[#C4634E] flex items-center justify-center mb-8 shadow-sm">
              <span className="text-white font-bold text-xl font-serif tracking-tight">A</span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-stone-900 mb-2 text-center">
              What are you working on?
            </h2>
            <p className="text-stone-400 text-sm max-w-xs leading-relaxed mb-8 text-center">
              {language === "EN"
                ? "Search literature, draft manuscripts, and check research integrity — all in one place."
                : "Tìm tài liệu, viết bản thảo và kiểm tra toàn vẹn học thuật — tất cả trong một nơi."}
            </p>

            {/* Command prompt area (decorative + functional) */}
            <div className="w-full max-w-sm mb-6">
              <button
                onClick={() => onSendMessage("Find papers on ")}
                className="w-full text-left px-4 py-3 rounded-xl border border-black/[0.1] bg-white shadow-sm text-sm text-stone-400 hover:border-stone-300 hover:shadow-md transition-all focus:outline-none"
              >
                {language === "EN"
                  ? "Ask a research question…"
                  : "Đặt câu hỏi nghiên cứu…"}
              </button>
            </div>

            {/* Quick actions */}
            <div className="w-full max-w-sm">
              <p className="text-xs text-stone-400 mb-3 font-medium uppercase tracking-wider text-center">
                {language === "EN" ? "Quick actions" : "Thao tác nhanh"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onSendMessage("Find papers on ")}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] shadow-sm hover:border-black/[0.15] hover:shadow-md transition-all text-sm font-medium text-stone-700 text-center"
                >
                  {language === "EN" ? "Search literature" : "Tìm tài liệu"}
                </button>
                <button
                  onClick={() => onSelectTab("editor")}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] shadow-sm hover:border-black/[0.15] hover:shadow-md transition-all text-sm font-medium text-stone-700 text-center"
                >
                  {language === "EN" ? "Check my paper" : "Kiểm tra bài"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REFERENCE_VIEW ────────────────────────────────────────── */}
        {canvasState === "reference" && (
          <div className="px-5 py-5 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-semibold text-stone-900">Search Results</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {references.length > 0
                    ? `${selectedReferenceIds.length}/${references.length} selected`
                    : isRunning
                    ? language === "EN"
                      ? "Searching…"
                      : "Đang tìm kiếm…"
                    : language === "EN"
                    ? "No results yet"
                    : "Chưa có kết quả"}
                </p>
              </div>
              {references.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#C4634E]/10 text-[#C4634E] text-xs font-semibold">
                  {references.length} {language === "EN" ? "results" : "kết quả"}
                </span>
              )}
            </div>

            {/* Bulk actions toolbar */}
            {selectedReferenceIds.length >= 1 && !isRunning && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium shadow-sm">
                <span className="text-stone-300">
                  {selectedReferenceIds.length}{" "}
                  {language === "EN" ? "selected" : "đã chọn"}
                </span>
                <span className="text-stone-600">·</span>
                {untranslatedSelectedIds.length > 0 && (
                  <button
                    onClick={() => onBulkTranslate(untranslatedSelectedIds)}
                    className="hover:text-stone-300 transition-colors"
                  >
                    {language === "EN" ? "Translate all" : "Dịch tất cả"}
                  </button>
                )}
                {untranslatedSelectedIds.length > 0 && (
                  <span className="text-stone-600">·</span>
                )}
                <button
                  onClick={() => onStartAVR()}
                  className="hover:text-stone-300 transition-colors flex items-center gap-1"
                >
                  {language === "EN" ? "Draft" : "Viết bản thảo"} ›
                </button>
              </div>
            )}

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
                {language === "EN" ? "Loading more…" : "Đang tải thêm…"}
              </div>
            )}

            {/* Empty state */}
            {!isRunning && references.length === 0 && (
              <div className="text-center py-16 text-stone-400">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                    <circle cx="9" cy="9" r="6" />
                    <path d="M15 15l3 3" strokeLinecap="round" />
                  </svg>
                </div>
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
                <h2 className="font-semibold text-stone-900">Draft Editor</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {language === "EN"
                    ? "Paste your manuscript here to use with RIC"
                    : "Dán bản thảo vào đây để kiểm tra bằng RIC"}
                </p>
              </div>
              {manuscript && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(manuscript)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => onStartRIC()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C4634E] text-white hover:bg-[#b45743] transition-colors"
                  >
                    {language === "EN" ? "Check Integrity" : "Kiểm tra toàn vẹn"}
                  </button>
                </div>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={manuscript}
              onChange={(e) => onUpdateManuscript(e.target.value)}
              placeholder={
                language === "EN"
                  ? "Paste your manuscript here…\n\nOnce you have content, click Check Integrity to verify research integrity."
                  : "Dán bản thảo vào đây…\n\nSau đó bấm Kiểm tra toàn vẹn để RIC phân tích."
              }
              className="flex-1 min-h-[300px] w-full rounded-xl border border-black/[0.08] bg-white px-5 py-4 text-sm text-stone-800 leading-relaxed font-serif resize-none outline-none focus:border-stone-300 focus:ring-1 focus:ring-stone-200 transition-all placeholder-stone-300"
            />

            {manuscript && (
              <p className="mt-2 text-xs text-stone-400 text-right">
                {manuscript.split(/\s+/).filter(Boolean).length}{" "}
                {language === "EN" ? "words" : "từ"}
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
                <h2 className="font-semibold text-stone-900">Integrity Report</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isRunning
                    ? language === "EN"
                      ? "Analyzing…"
                      : "Đang phân tích…"
                    : language === "EN"
                    ? "Click highlighted text to see details"
                    : "Click vào văn bản để xem chi tiết"}
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
                    {integrityReport.flags.filter((f) => f.severity === "error").length}{" "}
                    {language === "EN" ? "critical" : "nghiêm trọng"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-100">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-700">
                    {integrityReport.flags.filter((f) => f.severity === "warning").length}{" "}
                    {language === "EN" ? "warnings" : "cảnh báo"}
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
                    {language === "EN" ? "Issue List" : "Danh sách vấn đề"}
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
                              {language === "EN" ? "Suggestion: " : "Gợi ý: "}
                              {flag.suggestion}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissFlag(flag.id);
                          }}
                          className="flex-shrink-0 text-stone-300 hover:text-stone-500 transition-colors text-sm"
                          title={language === "EN" ? "Dismiss" : "Bỏ qua"}
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
                {language === "EN" ? "Analyzing manuscript…" : "Đang phân tích bản thảo…"}
              </div>
            )}

            {/* Empty state */}
            {!isRunning && !integrityReport && !manuscript && (
              <div className="text-center py-16 text-stone-400">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                    <path d="M9 12h6M9 8h6M5 12h.01M5 8h.01M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v9a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 14.5v-9z" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm">
                  {language === "EN" ? "No content to check yet." : "Chưa có nội dung để kiểm tra."}
                </p>
                <p className="text-xs mt-1">
                  {language === "EN"
                    ? "Paste your manuscript in the editor above and click Check Integrity."
                    : "Dán bản thảo vào editor và bấm Kiểm tra toàn vẹn."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
