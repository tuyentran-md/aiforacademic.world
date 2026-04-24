"use client";

import { useState, useRef } from "react";
import { Icons } from "@/components/Icons";
import { apiFetch } from "@/lib/api-client";
import ToolTabs from "@/components/ToolTabs";

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "search" | "fetch" | "translate";

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
  fileSize?: number;
}

// ── Tab: Search ────────────────────────────────────────────────────────────
function SearchTab() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"EN" | "VI">("EN");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translatingIds, setTranslatingIds] = useState<string[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
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
    try {
      const res = await apiFetch("/api/pipeline/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ref.id, abstract: ref.abstract, targetLanguage: "VI" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.abstractTranslated) {
        setResults((prev) =>
          prev.map((r) => (r.id === ref.id ? { ...r, abstractTranslated: data.abstractTranslated } : r))
        );
      }
    } catch {
      // silent
    } finally {
      setTranslatingIds((prev) => prev.filter((i) => i !== ref.id));
    }
  }

  function copyCitation(ref: SearchResult) {
    const authors = ref.authors.slice(0, 3).join(", ") + (ref.authors.length > 3 ? " et al." : "");
    const text = `${authors}. ${ref.title}. ${ref.journal}. ${ref.year}.${ref.doi ? ` doi:${ref.doi}` : ""}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Search <strong>PubMed + OpenAlex</strong> for peer-reviewed papers. Get titles, abstracts, citation counts, and DOIs.
      </p>
      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Search query *
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. laparoscopic appendectomy outcomes in children"
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="lr-search-input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Abstract language
          </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "EN" | "VI")}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none"
            id="lr-lang-select"
          >
            <option value="EN">English</option>
            <option value="VI">Vietnamese</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }}
          id="lr-search-btn"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && results.length === 0 && (
        <div className="text-sm text-stone-400 animate-pulse">Searching PubMed + OpenAlex…</div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">{results.length} papers found</p>
          {results.map((ref) => (
            <div key={ref.id} className="rounded-xl border border-black/[0.07] bg-white p-5">
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
                  <span className="flex-shrink-0 text-[11px] font-semibold text-stone-400">
                    {Math.round(ref.relevanceScore * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mb-2">
                {ref.authors.slice(0, 3).join(", ")}{ref.authors.length > 3 ? " et al." : ""} · {ref.journal} · {ref.year}
                {ref.citationCount ? ` · ${ref.citationCount} citations` : ""}
              </p>
              <p className="text-sm leading-relaxed text-stone-600 mb-3 line-clamp-3">
                {ref.abstractTranslated || ref.abstract}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => translateAbstract(ref)}
                  disabled={!!ref.abstractTranslated || translatingIds.includes(ref.id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-black/10 text-stone-600 hover:border-stone-300 disabled:opacity-40 transition-colors"
                >
                  {translatingIds.includes(ref.id) ? "Translating…" : ref.abstractTranslated ? "✓ Translated" : "Translate abstract"}
                </button>
                <button
                  onClick={() => copyCitation(ref)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
                >
                  Copy citation
                </button>
                {ref.doi && (
                  <a
                    href={`https://doi.org/${ref.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
                  >
                    View source ↗
                  </a>
                )}
                {ref.doi && (
                  <button
                    onClick={() => {
                      // Chain to Fetch tab — copy DOI to clipboard hint
                      navigator.clipboard.writeText(ref.doi!).catch(() => {});
                      alert(`DOI copied: ${ref.doi}\n\nSwitch to the Fetch tab to download full text.`);
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                  >
                    ↓ Fetch full text
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Fetch ─────────────────────────────────────────────────────────────
function FetchTab() {
  const [dois, setDois] = useState("");
  const [results, setResults] = useState<FetchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
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
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste DOIs (one per line or comma-separated). We cascade through{" "}
        <strong>Unpaywall → OpenAlex → Europe PMC → Semantic Scholar</strong>.
        No Sci-Hub.
      </p>
      <form onSubmit={handleFetch} className="mb-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            DOIs *
          </label>
          <textarea
            value={dois}
            onChange={(e) => setDois(e.target.value)}
            placeholder={"10.1234/example\n10.5678/another"}
            rows={4}
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="lr-fetch-dois"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !dois.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }}
          id="lr-fetch-btn"
        >
          {loading ? "Fetching…" : "Fetch full text"}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.doi} className="flex items-center justify-between gap-4 rounded-lg border border-black/[0.07] bg-white px-4 py-3">
              <div>
                <p className="text-xs font-mono text-stone-600 mb-0.5">{r.doi}</p>
                {r.source && <p className="text-xs text-stone-400">via {r.source}</p>}
              </div>
              <div className="flex items-center gap-2">
                {r.status === "ok" && r.downloadUrl ? (
                  <a
                    href={r.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                  >
                    ✓ Download PDF
                  </a>
                ) : r.status === "no_oa" ? (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
                    ⚠ No open access
                  </span>
                ) : (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-700">
                    ✗ Failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Translate ─────────────────────────────────────────────────────────
function TranslateTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("VI");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    setProgress("Uploading…");

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

      setProgress("Done!");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Upload a <strong>PDF or DOCX</strong> (max 50 MB). Text is chunked, translated with medical-grade accuracy preserving all citations, headings, and figures, then returned as a translated <strong>.docx</strong> file.
      </p>
      <form onSubmit={handleTranslate} className="mb-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
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
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Target language
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none"
            id="lr-translate-lang"
          >
            <option value="VI">Vietnamese</option>
            <option value="EN">English</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }}
          id="lr-translate-btn"
        >
          {loading ? progress || "Translating…" : "Translate document"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {downloadUrl && (
        <div className="mt-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-green-800">✓ Translation complete</p>
          <a
            href={downloadUrl}
            download={`translated_${file?.name ?? "document"}.docx`}
            className="text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4634E" }}
          >
            Download .docx ↓
          </a>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LiteratureReviewPage() {
  const [tab, setTab] = useState<Tab>("search");

  const tabs: { key: Tab; label: React.ReactNode }[] = [
    { key: "search", label: <span className="flex items-center gap-1.5"><Icons.Search className="w-4 h-4" /> Search</span> },
    { key: "fetch", label: <span className="flex items-center gap-1.5"><Icons.FileText className="w-4 h-4" /> Fetch</span> },
    { key: "translate", label: <span className="flex items-center gap-1.5"><Icons.Globe className="w-4 h-4" /> Translate</span> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ToolTabs tabs={tabs} active={tab} onChange={setTab} idPrefix="lr-tab" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
          {tab === "search" && <SearchTab />}
          {tab === "fetch" && <FetchTab />}
          {tab === "translate" && <TranslateTab />}
        </div>
      </div>
    </div>
  );
}
