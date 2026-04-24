"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/Icons";
import ToolTabs from "@/components/ToolTabs";

type PCTab = "citations" | "ai_detect" | "plagiarism" | "peer_review" | "extract_refs";

// ── Shared file+text input ──────────────────────────────────────────────────
function ManuscriptInput({
  value,
  onChange,
  id,
  accept = ".txt,.docx,.pdf",
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
  accept?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/pipeline/parse-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      onChange(data.text);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors">
          <Icons.FileText className="w-3.5 h-3.5" />
          {uploading ? "Reading…" : "Upload file (PDF / DOCX / TXT)"}
        </button>
        <span className="text-xs text-stone-400">or paste text below</span>
        <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      </div>
      {fileError && <p className="text-xs text-red-600">{fileError}</p>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your manuscript or reference list here…" rows={10}
        className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-mono"
        id={id} />
    </div>
  );
}

// ── Tab: Citation Check ────────────────────────────────────────────────────
function CitationTab() {
  const [manuscript, setManuscript] = useState("");
  const [result, setResult] = useState<null | {
    total: number;
    verified: number;
    unverified: number;
    refs: Array<{ ref: string; status: "verified" | "unverified" | "error"; sources: string[]; doi?: string }>;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("afa_manuscript_for_check");
    if (saved) { setManuscript(saved); sessionStorage.removeItem("afa_manuscript_for_check"); }
  }, []);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!manuscript.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/citations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      if (!res.ok) throw new Error("Citation check failed");
      setResult(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function exportRis() {
    try {
      const res = await apiFetch("/api/pipeline/extract-refs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "refs_clean.ris"; a.click();
    } catch { alert("Export failed"); }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste or upload your manuscript. We extract all references and verify each one against <strong>CrossRef + OpenAlex</strong>.
      </p>
      <form onSubmit={handleCheck} className="mb-6 space-y-4">
        <ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-citations-ms" />
        <div className="flex gap-3">
          <button type="submit" disabled={loading || !manuscript.trim()}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4634E" }} id="pc-citations-btn">
            {loading ? "Checking…" : "Check citations"}
          </button>
          {manuscript.trim() && !loading && (
            <button type="button" onClick={exportRis}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold border border-black/10 text-stone-700 hover:border-stone-300 transition-colors">
              Export .ris (Zotero)
            </button>
          )}
        </div>
      </form>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.07] bg-white p-4 flex gap-6">
            <div className="text-center"><p className="text-2xl font-bold text-stone-900">{result.total}</p><p className="text-xs text-stone-500">Total refs</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-green-600">{result.verified}</p><p className="text-xs text-stone-500">Verified</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-red-600">{result.unverified}</p><p className="text-xs text-stone-500">Unverified</p></div>
          </div>
          <div className="space-y-2">
            {result.refs.map((ref, i) => (
              <div key={i} className="rounded-lg border border-black/[0.07] bg-white px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex-shrink-0 text-sm ${ref.status === "verified" ? "text-green-500" : "text-red-500"}`}>
                    {ref.status === "verified" ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 leading-relaxed">{ref.ref}</p>
                    {ref.sources.length > 0 && <p className="text-xs text-stone-400 mt-0.5">via {ref.sources.join(", ")}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={exportRis}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold border border-black/10 text-stone-700 hover:border-stone-300 transition-colors"
            id="pc-export-ris-btn">
            Export verified refs to Zotero (.ris) ↓
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: AI Detect ─────────────────────────────────────────────────────────
function AIDetectTab() {
  const [manuscript, setManuscript] = useState("");
  const [result, setResult] = useState<null | {
    score: number; verdict: "Human" | "AI" | "Mixed"; patterns: string[]; summary: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDetect(e: React.FormEvent) {
    e.preventDefault();
    if (!manuscript.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/ai-detect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      if (!res.ok) throw new Error("AI detection failed");
      setResult(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  const verdictColor = result?.verdict === "Human" ? "text-green-600" : result?.verdict === "AI" ? "text-red-600" : "text-amber-600";

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste your text. We score how likely it was written by an AI (0 = fully human, 100 = fully AI).
      </p>
      <form onSubmit={handleDetect} className="mb-6 space-y-4">
        <ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-ai-ms" />
        <button type="submit" disabled={loading || !manuscript.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }} id="pc-ai-btn">
          {loading ? "Analyzing…" : "Detect AI writing"}
        </button>
      </form>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.07] bg-white p-6 text-center">
            <p className="text-5xl font-bold text-stone-900 mb-1">{result.score}</p>
            <p className="text-sm text-stone-500 mb-2">AI probability (0 = human, 100 = AI)</p>
            <p className={`text-xl font-bold ${verdictColor}`}>{result.verdict}</p>
          </div>
          <div className="rounded-xl border border-black/[0.07] bg-white p-4">
            <p className="text-sm text-stone-700 leading-relaxed">{result.summary}</p>
          </div>
          {result.patterns.length > 0 && (
            <div className="rounded-xl border border-black/[0.07] bg-white p-4">
              <p className="text-xs font-semibold text-stone-500 mb-2">Detected patterns</p>
              <ul className="space-y-1">{result.patterns.map((p, i) => <li key={i} className="text-sm text-stone-600">• {p}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Plagiarism ────────────────────────────────────────────────────────
function PlagiarismTab() {
  const [manuscript, setManuscript] = useState("");
  const [result, setResult] = useState<null | {
    similarity: number; sources: Array<{ url: string; title: string; similarity: number }>; summary: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!manuscript.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/plagiarism", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      if (!res.ok) throw new Error("Plagiarism scan failed");
      setResult(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste your manuscript. We scan for similarity against published literature.
      </p>
      <form onSubmit={handleScan} className="mb-6 space-y-4">
        <ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-plagiarism-ms" />
        <button type="submit" disabled={loading || !manuscript.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }} id="pc-plagiarism-btn">
          {loading ? "Scanning…" : "Scan for plagiarism"}
        </button>
      </form>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.07] bg-white p-6 text-center">
            <p className="text-5xl font-bold text-stone-900 mb-1">{result.similarity}%</p>
            <p className="text-sm text-stone-500">Similarity detected</p>
          </div>
          <div className="rounded-xl border border-black/[0.07] bg-white p-4">
            <p className="text-sm text-stone-700 leading-relaxed">{result.summary}</p>
          </div>
          {result.sources.length > 0 && (
            <div className="space-y-2">
              {result.sources.map((s, i) => (
                <div key={i} className="rounded-lg border border-black/[0.07] bg-white px-4 py-3 flex items-center justify-between gap-3">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-700 hover:text-[#C4634E] truncate flex-1">{s.title}</a>
                  <span className="flex-shrink-0 text-sm font-semibold text-stone-500">{s.similarity}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Peer Review ───────────────────────────────────────────────────────
function PeerReviewTab() {
  const [manuscript, setManuscript] = useState("");
  const [result, setResult] = useState<null | {
    summary: string; sections: Array<{ heading: string; comments: string[] }>; recommendation: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!manuscript.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/peer-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      if (!res.ok) throw new Error("Peer review failed");
      setResult(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  function chainToPolish() {
    if (!result || !manuscript) return;
    sessionStorage.setItem("afa_polish_manuscript", manuscript);
    sessionStorage.setItem("afa_polish_peer_review", JSON.stringify(result));
    router.push("/tools/polish");
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste your manuscript. We simulate an editor-style peer review with section-level comments.
      </p>
      <form onSubmit={handleReview} className="mb-6 space-y-4">
        <ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-peer-ms" />
        <button type="submit" disabled={loading || !manuscript.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }} id="pc-peer-btn">
          {loading ? "Reviewing…" : "Run peer review"}
        </button>
      </form>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.07] bg-white p-4">
            <p className="text-xs font-semibold text-stone-500 mb-1">Summary</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.summary}</p>
          </div>
          {result.sections.map((s, i) => (
            <div key={i} className="rounded-xl border border-black/[0.07] bg-white p-4">
              <p className="text-xs font-semibold text-stone-500 mb-2">{s.heading}</p>
              <ul className="space-y-1">{s.comments.map((c, j) => <li key={j} className="text-sm text-stone-700">• {c}</li>)}</ul>
            </div>
          ))}
          <div className="rounded-xl border border-black/[0.07] bg-white p-4">
            <p className="text-xs font-semibold text-stone-500 mb-1">Editor recommendation</p>
            <p className="text-sm font-medium text-stone-900">{result.recommendation}</p>
          </div>
          <button onClick={chainToPolish}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#8B5CF6" }} id="pc-chain-polish-btn">
            Polish this paper →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Extract Refs → .ris ───────────────────────────────────────────────
function ExtractRefsTab() {
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!manuscript.trim()) return;
    setLoading(true); setError(null); setDone(false);
    try {
      const res = await apiFetch("/api/pipeline/extract-refs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "refs_clean.ris"; a.click();
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste your reference list or full manuscript. We extract every citation, verify each DOI against CrossRef, and generate a clean <strong>.ris</strong> file ready to import into <strong>Zotero</strong> or <strong>Mendeley</strong>.
      </p>
      <form onSubmit={handleExtract} className="mb-6 space-y-4">
        <ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-extract-ms" />
        <button type="submit" disabled={loading || !manuscript.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }} id="pc-extract-btn">
          {loading ? "Extracting…" : "Extract & download .ris"}
        </button>
      </form>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}
      {done && (
        <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Download started — open in Zotero via <strong>File → Import</strong> or drag the .ris file into your library.
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function PaperCheckerPage() {
  const [tab, setTab] = useState<PCTab>("citations");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("tab") as PCTab | null;
    const validTabs: PCTab[] = ["citations", "ai_detect", "plagiarism", "peer_review", "extract_refs"];
    if (p && validTabs.includes(p)) {
      setTab(p);
    }
  }, []);

  const tabs: { key: PCTab; label: React.ReactNode }[] = [
    { key: "citations",    label: <span className="flex items-center gap-1.5"><Icons.BookOpen className="w-4 h-4" /> Citations</span> },
    { key: "ai_detect",   label: <span className="flex items-center gap-1.5"><Icons.Cpu className="w-4 h-4" /> AI Detect</span> },
    { key: "plagiarism",  label: <span className="flex items-center gap-1.5"><Icons.Scan className="w-4 h-4" /> Plagiarism</span> },
    { key: "peer_review", label: <span className="flex items-center gap-1.5"><Icons.ClipboardList className="w-4 h-4" /> Peer Review</span> },
    { key: "extract_refs",label: <span className="flex items-center gap-1.5"><Icons.FileText className="w-4 h-4" /> Extract → .ris</span> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ToolTabs tabs={tabs} active={tab} onChange={setTab} idPrefix="pc-tab" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
          {tab === "citations"    && <CitationTab />}
          {tab === "ai_detect"   && <AIDetectTab />}
          {tab === "plagiarism"  && <PlagiarismTab />}
          {tab === "peer_review" && <PeerReviewTab />}
          {tab === "extract_refs"&& <ExtractRefsTab />}
        </div>
      </div>
    </div>
  );
}
