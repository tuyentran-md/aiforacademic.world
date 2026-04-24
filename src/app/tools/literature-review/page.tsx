"use client";

import { useState, useRef } from "react";
import { Icons } from "@/components/Icons";
import { apiFetch } from "@/lib/api-client";
import {
  ToolShell,
  ToolEmptyState,
  ToolLoadingState,
  type SubTab,
} from "@/components/ToolShell";

type Tab = "search" | "fetch" | "translate" | "extract";

interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  abstractTranslated?: string;
  doi?: string;
  url: string;
  citationCount?: number;
  relevanceScore?: number;
  source: "pubmed" | "openalex";
}

interface FetchResult {
  doi: string;
  status: "ok" | "no_oa" | "failed";
  source?: string;
  downloadUrl?: string;
}

const SUB_TABS: SubTab[] = [
  { id: "search", label: "Search" },
  { id: "fetch", label: "Fetch full-text" },
  { id: "translate", label: "Translate doc" },
  { id: "extract", label: "Extract refs (.ris)" },
];

// ── Tab: Search ────────────────────────────────────────────────────────────
function SearchTab({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"EN" | "VI">("EN");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translatingIds, setTranslatingIds] = useState<string[]>([]);
  const [copiedDoi, setCopiedDoi] = useState<string | null>(null);
  const [translateErrors, setTranslateErrors] = useState<Record<string, string>>({});

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await apiFetch("/api/pipeline/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), language: lang, maxResults: 10 }),
      });
      if (!response.ok || !response.body) throw new Error("Search failed");
      const { createParser } = await import("eventsource-parser");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = createParser({
        onEvent(event) {
          if (!event.data) return;
          try {
            const ev = JSON.parse(event.data);
            if (ev.type === "reference") {
              setResults((prev) => {
                const idx = prev.findIndex((r) => r.id === ev.data.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = { ...next[idx], ...ev.data };
                  return next;
                }
                return [...prev, ev.data];
              });
            }
            if (ev.type === "error") setError(ev.data.message);
          } catch {/* keepalive */}
        },
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
      parser.feed(decoder.decode());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function translateAbstract(ref: SearchResult) {
    if (ref.abstractTranslated || translatingIds.includes(ref.id)) return;
    setTranslatingIds((prev) => [...prev, ref.id]);
    setTranslateErrors((prev) => {
      const n = { ...prev };
      delete n[ref.id];
      return n;
    });
    try {
      const res = await apiFetch("/api/pipeline/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ref.id, abstract: ref.abstract, targetLanguage: "VI" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      if (data.abstractTranslated) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === ref.id ? { ...r, abstractTranslated: data.abstractTranslated } : r
          )
        );
      } else throw new Error("No translation returned");
    } catch (err) {
      setTranslateErrors((prev) => ({
        ...prev,
        [ref.id]: err instanceof Error ? err.message : "Translation failed",
      }));
    } finally {
      setTranslatingIds((prev) => prev.filter((i) => i !== ref.id));
    }
  }

  function copyDoi(doi: string) {
    navigator.clipboard.writeText(doi).catch(() => {});
    setCopiedDoi(doi);
    setTimeout(() => setCopiedDoi((v) => (v === doi ? null : v)), 2000);
  }

  function copyCitation(ref: SearchResult) {
    const authors =
      ref.authors.slice(0, 3).join(", ") + (ref.authors.length > 3 ? " et al." : "");
    const text = `${authors}. ${ref.title}. ${ref.journal}. ${ref.year}.${
      ref.doi ? ` doi:${ref.doi}` : ""
    }`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const inputBlock = (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Search query *
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="e.g. laparoscopic appendectomy outcomes in children"
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="lr-search-input"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Abstract language
        </label>
        <div className="flex gap-2">
          {(["EN", "VI"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                lang === l
                  ? "border-[#C4634E] bg-[#C4634E] text-white"
                  : "border-black/10 text-stone-600 hover:border-stone-300"
              }`}
            >
              {l === "EN" ? "English" : "Vietnamese"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const resultsBlock =
    loading && results.length === 0 ? (
      <ToolLoadingState label="Searching PubMed + OpenAlex…" />
    ) : results.length === 0 ? (
      <ToolEmptyState
        title="No results yet"
        description="Type a research question on the left and press Search. Top 10 papers stream in as they're ranked."
      />
    ) : (
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        <p className="text-[11px] text-stone-400">{results.length} papers</p>
        {results.map((ref) => (
          <div
            key={ref.id}
            className="rounded-lg border border-black/[0.07] bg-white/60 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-stone-900 hover:text-[#C4634E] transition-colors text-sm leading-snug"
              >
                {ref.title}
              </a>
              {ref.relevanceScore != null && (
                <span className="flex-shrink-0 text-[10px] font-semibold text-stone-400">
                  {Math.round(ref.relevanceScore * 100)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mb-2">
              {ref.authors.slice(0, 3).join(", ")}
              {ref.authors.length > 3 ? " et al." : ""} · {ref.journal} · {ref.year}
              {ref.citationCount ? ` · ${ref.citationCount} citations` : ""}
            </p>
            <p className="text-xs leading-relaxed text-stone-600 mb-3">
              {ref.abstractTranslated || ref.abstract}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => translateAbstract(ref)}
                disabled={!!ref.abstractTranslated || translatingIds.includes(ref.id)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-black/10 text-stone-600 hover:border-stone-300 disabled:opacity-40 transition-colors"
              >
                {translatingIds.includes(ref.id)
                  ? "Translating…"
                  : ref.abstractTranslated
                  ? "✓ Translated"
                  : "Translate VI"}
              </button>
              <button
                onClick={() => copyCitation(ref)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
              >
                Copy citation
              </button>
              {ref.doi && (
                <button
                  onClick={() => copyDoi(ref.doi!)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                  title="Copy DOI then switch to Fetch tab"
                >
                  {copiedDoi === ref.doi ? "✓ DOI copied" : "Copy DOI"}
                </button>
              )}
              {translateErrors[ref.id] && (
                <span className="text-[11px] text-red-600">{translateErrors[ref.id]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <ToolShell
      title="Literature Review"
      subtitle="Search PubMed + OpenAlex. Get titles, abstracts, citation counts, and DOIs ranked by relevance."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={resultsBlock}
      primaryAction={{
        label: "Search",
        loadingLabel: "Searching…",
        onClick: handleSearch,
        loading,
        disabled: !query.trim(),
      }}
      error={error}
    />
  );
}

// ── Tab: Fetch ─────────────────────────────────────────────────────────────
function FetchTab({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const [dois, setDois] = useState("");
  const [results, setResults] = useState<FetchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    const doiList = dois.split(/\n|,/).map((d) => d.trim()).filter(Boolean);
    if (doiList.length === 0) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await apiFetch("/api/pipeline/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dois: doiList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-3 h-full flex flex-col">
      <p className="text-xs text-stone-500 leading-relaxed">
        Paste DOIs (one per line or comma-separated). Cascade through{" "}
        <strong>Unpaywall → OpenAlex → Europe PMC → Semantic Scholar</strong>. No Sci-Hub.
      </p>
      <div className="flex-1 flex flex-col">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          DOIs *
        </label>
        <textarea
          value={dois}
          onChange={(e) => setDois(e.target.value)}
          placeholder={"10.1234/example\n10.5678/another"}
          rows={10}
          className="flex-1 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="lr-fetch-dois"
        />
      </div>
    </div>
  );

  const resultsBlock = loading ? (
    <ToolLoadingState label="Resolving open-access full-text…" />
  ) : results.length === 0 ? (
    <ToolEmptyState
      title="No results yet"
      description="Paste DOIs on the left, click Fetch, and we'll try to find the open-access PDF for each."
    />
  ) : (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      {results.map((r) => (
        <div
          key={r.doi}
          className="rounded-lg border border-black/[0.07] bg-white/60 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-mono text-stone-500 break-all">doi:{r.doi}</p>
              {r.source && <p className="text-[11px] text-stone-400 mt-0.5">via {r.source}</p>}
            </div>
            <span
              className={`flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                r.status === "ok"
                  ? "bg-green-100 text-green-700"
                  : r.status === "no_oa"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {r.status === "ok" ? "OA" : r.status === "no_oa" ? "no OA" : "failed"}
            </span>
          </div>
          {r.status === "ok" && r.downloadUrl && (
            <a
              href={r.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C4634E] hover:underline"
            >
              Open PDF →
            </a>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <ToolShell
      title="Literature Review"
      subtitle="Fetch open-access full-text PDFs from a list of DOIs."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={resultsBlock}
      primaryAction={{
        label: "Fetch full text",
        loadingLabel: "Fetching…",
        onClick: handleFetch,
        loading,
        disabled: !dois.trim(),
      }}
      error={error}
    />
  );
}

// ── Tab: Translate (full document) ─────────────────────────────────────────
function TranslateTab({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("VI");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTranslate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetLanguage", targetLang);
      const res = await apiFetch("/api/pipeline/translate-fulltext", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Translation failed");
      }
      const blob = await res.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-4 h-full flex flex-col">
      <p className="text-xs text-stone-500 leading-relaxed">
        Upload a <strong>PDF or DOCX</strong> (max 50 MB). Text is chunked, translated with
        medical-grade accuracy preserving citations, headings, numbers, and figure references,
        then returned as a <strong>.txt</strong> file.
      </p>
      <div className="flex-1">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Document (PDF / DOCX) *
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-700 transition-colors"
          id="lr-translate-file"
        />
        {file && (
          <p className="mt-2 text-[11px] text-stone-500">
            Selected: <span className="font-mono">{file.name}</span>
          </p>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Target language
        </label>
        <div className="flex gap-2">
          {(["VI", "EN"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTargetLang(l)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                targetLang === l
                  ? "border-[#C4634E] bg-[#C4634E] text-white"
                  : "border-black/10 text-stone-600 hover:border-stone-300"
              }`}
            >
              {l === "VI" ? "Vietnamese" : "English"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const resultsBlock = loading ? (
    <ToolLoadingState label="Chunking + translating document…" />
  ) : downloadUrl ? (
    <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-4">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <Icons.CheckCircle className="w-6 h-6 text-green-600" />
      </div>
      <p className="text-sm font-semibold text-stone-900">Translation complete</p>
      <a
        href={downloadUrl}
        download={`translated_${(file?.name ?? "document").replace(/\.(pdf|docx)$/i, "")}.txt`}
        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#C4634E" }}
      >
        Download .txt ↓
      </a>
    </div>
  ) : (
    <ToolEmptyState
      title="No translation yet"
      description="Upload a PDF or DOCX, pick a target language, and click Translate document. Output is a .txt file."
    />
  );

  return (
    <ToolShell
      title="Literature Review"
      subtitle="Translate a full PDF or DOCX into Vietnamese (or English) — chunk by chunk, citations preserved."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={resultsBlock}
      primaryAction={{
        label: "Translate document",
        loadingLabel: "Translating…",
        onClick: handleTranslate,
        loading,
        disabled: !file,
      }}
      error={error}
    />
  );
}

// ── Tab: Extract refs (.ris) — moved from Paper Checker ────────────────────
function ExtractRefsTab({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refs, setRefs] = useState<Array<Record<string, unknown>>>([]);
  const [risBlobUrl, setRisBlobUrl] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/pipeline/parse-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      setManuscript(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleExtract() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    setRefs([]);
    setRisBlobUrl(null);
    try {
      const res = await apiFetch("/api/pipeline/extract-refs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          setWarning(data.error || "No references detected.");
          return;
        }
        throw new Error(data.error || "Extraction failed");
      }
      setRefs(data.json ?? []);
      if (data.ris) {
        const blob = new Blob([data.ris], { type: "application/x-research-info-systems" });
        setRisBlobUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-3 h-full flex flex-col">
      <p className="text-xs text-stone-500 leading-relaxed">
        Paste a reference list or full manuscript. We extract every citation with author, year,
        title, journal, DOI — and produce a clean <strong>.ris</strong> file ready to import into{" "}
        <strong>Zotero</strong> or <strong>Mendeley</strong>.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
        >
          <Icons.FileText className="w-3.5 h-3.5" />
          {uploading ? "Reading…" : "Upload PDF / DOCX / TXT"}
        </button>
        <span className="text-xs text-stone-400">or paste below</span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <textarea
        value={manuscript}
        onChange={(e) => setManuscript(e.target.value)}
        placeholder="Paste your full manuscript or just the REFERENCES section here…"
        rows={10}
        className="flex-1 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
        id="lr-extract-ms"
      />
    </div>
  );

  const resultsBlock = loading ? (
    <ToolLoadingState label="Extracting references…" />
  ) : refs.length > 0 ? (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-900">{refs.length} references extracted</p>
        {risBlobUrl && (
          <a
            href={risBlobUrl}
            download="refs_clean.ris"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4634E" }}
          >
            Download .ris ↓
          </a>
        )}
      </div>
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {refs.map((r, i) => (
          <div
            key={i}
            className="rounded-lg border border-black/[0.07] bg-white/60 p-3 text-xs text-stone-700"
          >
            <p className="font-semibold text-stone-900 break-words">{(r.title as string) ?? "(no title)"}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {Array.isArray(r.authors)
                ? (r.authors as string[]).slice(0, 3).join(", ") +
                  ((r.authors as string[]).length > 3 ? " et al." : "")
                : ""}
              {r.year ? ` · ${r.year}` : ""}
              {r.journal ? ` · ${r.journal}` : ""}
            </p>
            {r.doi ? (
              <p className="text-[11px] text-stone-400 mt-0.5 font-mono break-all">doi:{r.doi as string}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  ) : (
    <ToolEmptyState
      title="No references extracted yet"
      description="Paste your manuscript on the left. Make sure it includes the REFERENCES / Bibliography section — we extract from there."
    />
  );

  return (
    <ToolShell
      title="Literature Review"
      subtitle="Extract every bibliography entry as structured JSON + a Zotero-ready .ris file."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={resultsBlock}
      primaryAction={{
        label: "Extract & download .ris",
        loadingLabel: "Extracting…",
        onClick: handleExtract,
        loading,
        disabled: !manuscript.trim(),
      }}
      error={error}
      warning={warning}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LiteratureReviewPage() {
  const [tab, setTab] = useState<Tab>("search");

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
      {tab === "search" && <SearchTab activeTab={tab} onTabChange={setTab} />}
      {tab === "fetch" && <FetchTab activeTab={tab} onTabChange={setTab} />}
      {tab === "translate" && <TranslateTab activeTab={tab} onTabChange={setTab} />}
      {tab === "extract" && <ExtractRefsTab activeTab={tab} onTabChange={setTab} />}
    </div>
  );
}
