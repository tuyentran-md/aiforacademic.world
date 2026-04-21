"use client";

import React, { useState, useRef } from "react";
import type { CanvasHistoryEntry, CanvasState } from "@/hooks/useCanvas";
import type { IntegrityFlag, IntegrityReport, PipelineStatus, Reference } from "@/lib/pipeline/types";
import { parseManuscriptSections, getParagraphSeverity } from "./pipeline-utils";

// ── Props ─────────────────────────────────────────────────────────────────────
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
  onOpenEditor: () => void;
  onStartRIC: (text?: string) => void;
  onStartAVR: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getUniqueTabs(history: CanvasHistoryEntry[]): CanvasHistoryEntry[] {
  const seen = new Map<CanvasState, CanvasHistoryEntry>();
  for (const entry of history) seen.set(entry.state, entry);
  return Array.from(seen.values());
}

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

// ── Skeleton ──────────────────────────────────────────────────────────────────
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

// ── SVG Icons ─────────────────────────────────────────────────────────────────
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
function IconUpload({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Reference Card ────────────────────────────────────────────────────────────
function ReferenceCard({
  reference, selected, language, isTranslating, onToggle, onTranslate,
}: {
  reference: Reference; selected: boolean; language: "EN" | "VI";
  isTranslating: boolean; onToggle: () => void; onTranslate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslated, setShowTranslated] = useState(true);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (reference.abstractTranslated) setShowTranslated(true);
  }, [reference.abstractTranslated]);

  const snippetLength = 220;
  const isLong = reference.abstract.length > snippetLength;
  const displayAbstract =
    expanded || !isLong ? reference.abstract : reference.abstract.slice(0, snippetLength) + "…";

  async function handleCopy() {
    const firstAuthor = reference.authors[0] ?? "Unknown";
    const authorStr = reference.authors.length > 1 ? `${firstAuthor} et al.` : firstAuthor;
    await navigator.clipboard.writeText(
      `${authorStr}, ${reference.year}. ${reference.title}. ${reference.journal}.`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${
      selected ? "border-[#C4634E]/30 ring-1 ring-[#C4634E]/20" : "border-black/[0.07] hover:border-black/[0.12]"
    }`}>
      <div className="p-5">
        {/* Title + checkbox */}
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox" checked={selected} onChange={onToggle}
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
            <><span className="text-stone-300">·</span><span>Cited: {reference.citationCount}</span></>
          )}
        </div>
        {/* Abstract */}
        <div className="ml-7 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2.5 text-sm text-stone-700 leading-relaxed mb-2">
          <p>{displayAbstract}</p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
              {expanded ? (language === "EN" ? "Show less ↑" : "Thu gọn ↑") : (language === "EN" ? "Show more ↓" : "Xem thêm ↓")}
            </button>
          )}
        </div>
        {/* Translation */}
        {reference.abstractTranslated && showTranslated && (
          <div className="ml-7 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-sm text-blue-900 leading-relaxed mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">Tiếng Việt</p>
            <p>{reference.abstractTranslated}</p>
          </div>
        )}
        {/* Actions */}
        <div className="ml-7 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => reference.abstractTranslated ? setShowTranslated(!showTranslated) : onTranslate()}
            disabled={isTranslating}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              reference.abstractTranslated
                ? showTranslated
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                : "border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-wait"
            }`}
          >
            {isTranslating ? <><IconSpinner />{language === "EN" ? "Translating" : "Đang dịch"}</> : (
              <><IconTranslate />
                {reference.abstractTranslated
                  ? showTranslated ? (language === "EN" ? "Hide translation" : "Ẩn bản dịch") : (language === "EN" ? "Show translation" : "Hiện bản dịch")
                  : (language === "EN" ? "Translate" : "Dịch")
                }
              </>
            )}
          </button>
          {reference.url && (
            <a href={reference.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors">
              <IconExternalLink />{language === "EN" ? "Full text" : "Toàn văn"} ↗
            </a>
          )}
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors">
            <IconCopy />{copied ? (language === "EN" ? "Copied" : "Đã copy") : (language === "EN" ? "Copy citation" : "Copy trích dẫn")}
          </button>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase tracking-wide ${
            reference.source === "pubmed" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"
          }`}>{reference.source}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CanvasPanel({
  canvasState, canvasHistory, references, selectedReferenceIds, manuscript,
  integrityReport, isRunning, language, translatingIds,
  onSelectTab, onToggleReference, onTranslateReference, onBulkTranslate,
  onUpdateManuscript, onDismissFlag, onSendMessage, onOpenEditor, onStartRIC, onStartAVR,
}: CanvasPanelProps) {
  const uniqueTabs = getUniqueTabs(canvasHistory);
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);
  const [integritySubTab, setIntegritySubTab] = useState<"annotated" | "issues">("issues");

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // File upload handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  function scrollToFlag(flagId: string) {
    setActiveFlagId(flagId);
    document.querySelector(`[data-flag-id="${flagId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleIdleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // Route through sendMessage so user message appears in chat
    // Smart idle fallback in useCanvas will treat this as a search
    onSendMessage(q);
    setSearchQuery("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        onUpdateManuscript(text);
      } else if (file.name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onUpdateManuscript(result.value);
      } else if (file.name.endsWith(".pdf")) {
        onUpdateManuscript(
          `[PDF: ${file.name} — text extraction not yet supported. Please paste the text manually below.]`,
        );
      } else {
        const text = await file.text();
        onUpdateManuscript(text);
      }
    } catch {
      onUpdateManuscript(`[Failed to read ${file.name}. Please paste the text manually below.]`);
    }
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  const tabLabels: Record<CanvasState, string> = {
    idle: "Workspace",
    reference: "References",
    editor: "Draft",
    integrity: "Integrity Report",
  };

  const untranslatedSelectedIds = selectedReferenceIds.filter((id) => {
    const ref = references.find((r) => r.id === id);
    return ref && !ref.abstractTranslated && !translatingIds.includes(id);
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      {uniqueTabs.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2.5 border-b border-black/[0.06] bg-white/60 overflow-x-auto">
          {uniqueTabs.map((entry) => (
            <button
              key={entry.state}
              onClick={() => onSelectTab(entry.state)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                canvasState === entry.state ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
              }`}
            >{tabLabels[entry.state]}</button>
          ))}
        </div>
      )}

      <div className={`flex-1 min-h-0 ${canvasState === "editor" ? "overflow-hidden" : "overflow-y-auto"}`}>

        {/* ── IDLE ── */}
        {canvasState === "idle" && (
          <div className="flex flex-col items-center justify-center h-full px-8 py-16">
            <div className="w-12 h-12 rounded-xl bg-[#C4634E] flex items-center justify-center mb-8 shadow-sm">
              <span className="text-white font-bold text-xl font-serif">A</span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-stone-900 mb-1 text-center">
              AI for Academic
            </h2>
            <p className="text-stone-400 text-sm max-w-xs leading-relaxed mb-8 text-center">
              {language === "EN"
                ? "Your research mentor — from idea to manuscript"
                : "Người hướng dẫn nghiên cứu — từ ý tưởng đến bản thảo"}
            </p>

            {/* Search input */}
            <form onSubmit={handleIdleSearch} className="w-full max-w-sm mb-6">
              <div className="flex rounded-xl border border-black/[0.1] bg-white shadow-sm overflow-hidden focus-within:border-stone-300 focus-within:shadow-md transition-all">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === "EN"
                      ? "What's your research question?"
                      : "Câu hỏi nghiên cứu của bạn là gì?"
                  }
                  className="flex-1 px-4 py-3 text-sm text-stone-800 outline-none bg-transparent placeholder-stone-400"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="px-4 py-3 text-sm font-medium text-[#C4634E] hover:bg-stone-50 disabled:text-stone-300 transition-colors border-l border-black/[0.08]"
                >
                  {language === "EN" ? "Search →" : "Tìm →"}
                </button>
              </div>
            </form>

            {/* Secondary actions */}
            <p className="text-xs text-stone-400 mb-3 font-medium uppercase tracking-wider text-center">
              {language === "EN" ? "or" : "hoặc"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenEditor()}
                className="px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] shadow-sm hover:border-black/[0.15] hover:shadow-md transition-all text-sm font-medium text-stone-700"
              >
                {language === "EN" ? "Check my paper" : "Kiểm tra bài của tôi"}
              </button>
              <a
                href="/products"
                className="px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] shadow-sm hover:border-black/[0.15] hover:shadow-md transition-all text-sm font-medium text-stone-700"
              >
                {language === "EN" ? "About our tools →" : "Về công cụ →"}
              </a>
            </div>
          </div>
        )}

        {/* ── REFERENCES ── */}
        {canvasState === "reference" && (
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-semibold text-stone-900">Search Results</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {references.length > 0
                    ? `${selectedReferenceIds.length}/${references.length} selected`
                    : isRunning
                    ? (language === "EN" ? "Searching…" : "Đang tìm kiếm…")
                    : (language === "EN" ? "No results yet" : "Chưa có kết quả")}
                </p>
              </div>
              {references.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#C4634E]/10 text-[#C4634E] text-xs font-semibold">
                  {references.length} {language === "EN" ? "results" : "kết quả"}
                </span>
              )}
            </div>

            {/* Bulk toolbar */}
            {selectedReferenceIds.length >= 1 && !isRunning && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium shadow-sm">
                <span className="text-stone-300">
                  {selectedReferenceIds.length} {language === "EN" ? "selected" : "đã chọn"}
                </span>
                <span className="text-stone-600">·</span>
                {untranslatedSelectedIds.length > 0 && (
                  <>
                    <button onClick={() => onBulkTranslate(untranslatedSelectedIds)} className="hover:text-stone-300 transition-colors">
                      {language === "EN" ? "Translate all" : "Dịch tất cả"}
                    </button>
                    <span className="text-stone-600">·</span>
                  </>
                )}
                <button onClick={() => onStartAVR()} className="hover:text-stone-300 transition-colors">
                  {language === "EN" ? "Draft manuscript ›" : "Viết bản thảo ›"}
                </button>
              </div>
            )}

            {/* Skeletons while streaming */}
            {isRunning && references.length === 0 && (
              <div className="space-y-3">
                <ReferenceSkeleton /><ReferenceSkeleton /><ReferenceSkeleton />
              </div>
            )}

            {/* Reference cards */}
            {references.map((ref) => (
              <ReferenceCard
                key={ref.id} reference={ref}
                selected={selectedReferenceIds.includes(ref.id)}
                language={language}
                isTranslating={translatingIds.includes(ref.id)}
                onToggle={() => onToggleReference(ref.id)}
                onTranslate={() => onTranslateReference(ref.id)}
              />
            ))}

            {isRunning && references.length > 0 && (
              <div className="flex items-center gap-2 py-3 text-stone-400 text-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                {language === "EN" ? "Loading more…" : "Đang tải thêm…"}
              </div>
            )}

            {!isRunning && references.length === 0 && (
              <div className="text-center py-16 text-stone-400">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                    <circle cx="9" cy="9" r="6" /><path d="M15 15l3 3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm">{language === "EN" ? "No references found. Try a different term." : "Không tìm thấy tài liệu. Vui lòng thử từ khoá khác."}</p>
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR ── */}
        {canvasState === "editor" && (
          <div className="flex flex-col h-full px-5 py-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-stone-900">Draft Editor</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {language === "EN"
                    ? "Upload or paste your manuscript, then check integrity"
                    : "Tải lên hoặc dán bản thảo, rồi kiểm tra toàn vẹn"}
                </p>
              </div>
              {/* Check Integrity — always visible, disabled when empty */}
              <div className="flex gap-2">
                {manuscript && (
                  <button
                    onClick={() => navigator.clipboard.writeText(manuscript)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Copy
                  </button>
                )}
                <button
                  onClick={() => onStartRIC()}
                  disabled={!manuscript.trim() || isRunning}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    manuscript.trim() && !isRunning
                      ? "bg-[#C4634E] text-white hover:bg-[#b45743]"
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  {language === "EN" ? "Check Integrity" : "Kiểm tra toàn vẹn"}
                </button>
              </div>
            </div>

            {/* File upload zone — shown when no manuscript */}
            {!manuscript && (
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.doc,.docx,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <IconUpload className="w-6 h-6 text-stone-300 mb-2" />
                  <p className="text-sm text-stone-500">
                    {language === "EN" ? "Upload your manuscript" : "Tải lên bản thảo"}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    {language === "EN" ? ".txt, .md, .docx, or .pdf" : ".txt, .md, .docx, hoặc .pdf"}
                  </p>
                </label>
                <div className="text-center text-xs text-stone-400 my-3">
                  {language === "EN" ? "— or paste below —" : "— hoặc dán bên dưới —"}
                </div>
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={manuscript}
              onChange={(e) => onUpdateManuscript(e.target.value)}
              placeholder={
                language === "EN"
                  ? "Paste your manuscript here…"
                  : "Dán bản thảo vào đây…"
              }
              className="flex-1 min-h-[200px] w-full rounded-xl border border-black/[0.08] bg-white px-5 py-4 text-sm text-stone-800 leading-relaxed font-serif resize-none outline-none focus:border-stone-300 focus:ring-1 focus:ring-stone-200 transition-all placeholder-stone-300"
            />

            {manuscript && (
              <>
                <p className="mt-2 text-xs text-stone-400 text-right">
                  {manuscript.split(/\s+/).filter(Boolean).length}{" "}
                  {language === "EN" ? "words" : "từ"}
                </p>
                {/* Bottom CTA */}
                <button
                  onClick={() => onStartRIC()}
                  disabled={isRunning}
                  className={`mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isRunning
                      ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                      : "bg-[#C4634E] text-white hover:bg-[#b45743]"
                  }`}
                >
                  {language === "EN" ? "Check Integrity →" : "Kiểm tra toàn vẹn →"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── INTEGRITY ── */}
        {canvasState === "integrity" && (
          <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-black/[0.05]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-stone-900">Integrity Report</h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {isRunning
                      ? (language === "EN" ? "Analyzing…" : "Đang phân tích…")
                      : (language === "EN" ? "Click highlighted text to see details" : "Click vào văn bản để xem chi tiết")}
                  </p>
                </div>
                {integrityReport && (
                  <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-bold ${
                    integrityReport.overallScore >= 80
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : integrityReport.overallScore >= 60
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {integrityReport.overallScore}/100
                  </div>
                )}
              </div>

              {/* Summary */}
              {integrityReport?.summary && (
                <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-sm text-stone-700 leading-relaxed mb-3">
                  {integrityReport.summary}
                </div>
              )}

              {/* Flag count badges */}
              {integrityReport && integrityReport.flags.length > 0 && (
                <div className="flex gap-2 mb-3">
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

              {/* Sub-tab selector */}
              {integrityReport && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setIntegritySubTab("issues")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      integritySubTab === "issues"
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    }`}
                  >
                    {language === "EN"
                      ? `Issue List (${integrityReport.flags.length})`
                      : `Danh sách lỗi (${integrityReport.flags.length})`}
                  </button>
                  <button
                    onClick={() => setIntegritySubTab("annotated")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      integritySubTab === "annotated"
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    }`}
                  >
                    {language === "EN" ? "Annotated Draft" : "Bản thảo có đấu"}
                  </button>
                </div>
              )}
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto">

              {/* Loading */}
              {isRunning && (
                <div className="flex items-center gap-2 px-5 py-4 text-stone-400 text-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
                  <p className="text-sm">{language === "EN" ? "No content to check yet." : "Chưa có nội dung để kiểm tra."}</p>
                </div>
              )}

              {/* ── ISSUE LIST sub-tab ── */}
              {integritySubTab === "issues" && integrityReport && (
                <div className="px-5 py-4 space-y-3">
                  {integrityReport.flags.length === 0 && !isRunning && (
                    <div className="text-center py-12 text-stone-400">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-green-500">
                          <path d="M7 10l2.5 2.5L13 7" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="10" cy="10" r="7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-700">
                        {language === "EN" ? "No issues detected." : "Không phát hiện lỗi."}
                      </p>
                    </div>
                  )}

                  {/* Errors first, then warnings */}
                  {[
                    ...integrityReport.flags.filter((f) => f.severity === "error"),
                    ...integrityReport.flags.filter((f) => f.severity !== "error"),
                  ].map((flag) => (
                    <div
                      key={flag.id}
                      className={`rounded-xl border bg-white shadow-sm transition-all ${
                        flag.severity === "error"
                          ? "border-red-100"
                          : "border-yellow-100"
                      } ${activeFlagId === flag.id ? "ring-2 ring-offset-1 ring-yellow-300" : ""}`}
                    >
                      <div className="px-4 py-3">
                        {/* Severity badge + type */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            flag.severity === "error" ? "bg-red-400" : "bg-yellow-400"
                          }`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            flag.severity === "error" ? "text-red-600" : "text-yellow-700"
                          }`}>
                            {flag.severity === "error"
                              ? (language === "EN" ? "Critical" : "Nghiêm trọng")
                              : (language === "EN" ? "Warning" : "Cảnh báo")}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="text-[10px] text-stone-400 uppercase tracking-wide">
                            {flag.type.replaceAll("_", " ")}
                          </span>
                        </div>

                        {/* Flagged snippet */}
                        <blockquote className={`text-xs px-3 py-2 rounded-lg mb-2 italic leading-relaxed ${
                          flag.severity === "error"
                            ? "bg-red-50 text-red-800 border-l-2 border-red-300"
                            : "bg-yellow-50 text-yellow-900 border-l-2 border-yellow-300"
                        }`}>
                          &ldquo;{flag.location.textSnippet}&rdquo;
                        </blockquote>

                        {/* Message */}
                        <p className="text-xs text-stone-700 leading-relaxed mb-2">
                          {flag.message}
                        </p>

                        {/* Suggestion */}
                        {flag.suggestion && (
                          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3 py-2 mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                              {language === "EN" ? "Suggestion" : "Gợi ý"}
                            </p>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              {flag.suggestion}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              scrollToFlag(flag.id);
                              setIntegritySubTab("annotated");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
                          >
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                              <circle cx="5" cy="5" r="3.5" />
                              <path d="M8 8l2.5 2.5" strokeLinecap="round" />
                            </svg>
                            {language === "EN" ? "Show in draft" : "Xem trong bản thảo"}
                          </button>
                          <button
                            onClick={() => {
                              onSendMessage(
                                language === "EN"
                                  ? `Find citations for: "${flag.location.textSnippet.slice(0, 100)}"`
                                  : `Tìm tài liệu cho: "${flag.location.textSnippet.slice(0, 100)}"`
                              );
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              flag.severity === "error"
                                ? "border border-red-200 text-red-700 hover:bg-red-50"
                                : "border border-[#C4634E]/30 text-[#C4634E] hover:bg-[#C4634E]/5"
                            }`}
                          >
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                              <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {language === "EN" ? "Find citations →" : "Tìm trích dẫn →"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDismissFlag(flag.id); }}
                            className="ml-auto text-stone-300 hover:text-stone-500 transition-colors text-sm px-1"
                            title={language === "EN" ? "Dismiss" : "Bỏ qua"}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ANNOTATED DRAFT sub-tab ── */}
              {integritySubTab === "annotated" && manuscript && (
                <div className="px-5 py-4">
                  <div className="rounded-xl border border-black/[0.07] bg-white shadow-sm">
                    <div className="px-6 py-5 font-serif text-base text-stone-800 leading-relaxed">
                      {(() => {
                        const sections = parseManuscriptSections(manuscript);
                        const paragraphs = manuscript.split(/\n\n+/).filter(Boolean);
                        const items = sections.length > 0 ? sections : null;
                        if (!items) {
                          return paragraphs.map((para, pIdx) => {
                            const paraFlags = integrityReport?.flags.filter((f) => f.location.paragraphIndex === pIdx) ?? [];
                            const severity = getParagraphSeverity(paraFlags);
                            return (
                              <p key={pIdx} id={`para-${pIdx}`}
                                className={`mb-4 text-justify last:mb-0 rounded px-1 -mx-1 transition-colors ${
                                  severity === "error" ? "bg-red-50/50" : severity === "warning" ? "bg-yellow-50/50" : ""
                                } ${activeFlagId && paraFlags.some((f) => f.id === activeFlagId) ? "ring-2 ring-offset-1 ring-yellow-300" : ""}`}
                              >{renderWithHighlights(para, paraFlags, scrollToFlag)}</p>
                            );
                          });
                        }
                        return items.map((section, sIdx) => (
                          <div key={sIdx}>
                            {section.heading && (
                              <h3 className="font-sans font-bold text-lg text-stone-900 mt-6 mb-3 first:mt-0">{section.heading}</h3>
                            )}
                            {section.paragraphs.map((para, pIdx) => {
                              const paraFlags = integrityReport?.flags.filter(
                                (f) => f.location.sectionHeading === section.heading && f.location.paragraphIndex === pIdx,
                              ) ?? [];
                              const severity = getParagraphSeverity(paraFlags);
                              const paraKey = sIdx * 1000 + pIdx;
                              return (
                                <p key={paraKey} id={`para-${paraKey}`}
                                  className={`mb-4 text-justify last:mb-0 rounded px-1 -mx-1 transition-colors ${
                                    severity === "error" ? "bg-red-50/50" : severity === "warning" ? "bg-yellow-50/50" : ""
                                  } ${activeFlagId && paraFlags.some((f) => f.id === activeFlagId) ? "ring-2 ring-offset-1 ring-yellow-300" : ""}`}
                                >{renderWithHighlights(para, paraFlags, scrollToFlag)}</p>
                              );
                            })}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
