"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

type JournalStyle = "nature" | "bmj" | "jama" | "generic";

export default function PolishPage() {
  const [text, setText] = useState("");
  const [journalStyle, setJournalStyle] = useState<JournalStyle>("generic");
  const [context, setContext] = useState("");
  const [applyPeerReview, setApplyPeerReview] = useState(false);
  const [peerReviewData, setPeerReviewData] = useState<unknown>(null);
  const [result, setResult] = useState<null | { original: string; polished: string; diff: string }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Prefill from Paper Checker chain
  useEffect(() => {
    const savedMs = sessionStorage.getItem("afa_polish_manuscript");
    const savedPR = sessionStorage.getItem("afa_polish_peer_review");
    if (savedMs) {
      setText(savedMs);
      sessionStorage.removeItem("afa_polish_manuscript");
    }
    if (savedPR) {
      try { setPeerReviewData(JSON.parse(savedPR)); } catch {}
      setApplyPeerReview(true);
      sessionStorage.removeItem("afa_polish_peer_review");
    }
  }, []);

  async function handlePolish(e: React.FormEvent) {
    e.preventDefault();
    const manuscript = text.trim() || "";
    if (!manuscript) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDownloadUrl(null);

    try {
      const res = await apiFetch("/api/pipeline/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manuscript,
          journalStyle,
          context: context.trim() || undefined,
          peerReview: applyPeerReview && peerReviewData ? peerReviewData : undefined,
        }),
      });
      if (!res.ok) throw new Error("Polish failed");
      const data = await res.json();
      setResult(data);

      // Generate download URL for .docx blob (if API returns it)
      if (data.docxBase64) {
        const bytes = Uint8Array.from(atob(data.docxBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        setDownloadUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Polish failed");
    } finally {
      setLoading(false);
    }
  }

  const journalStyles: { value: JournalStyle; label: string }[] = [
    { value: "generic", label: "Generic academic" },
    { value: "nature", label: "Nature" },
    { value: "bmj", label: "BMJ" },
    { value: "jama", label: "JAMA" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
          <p className="mb-4 text-sm text-stone-500">
            Paste your manuscript. We <strong>polish the prose</strong> for a target journal style, optionally applying peer review suggestions, and return a clean Word file.
          </p>
          <form onSubmit={handlePolish} className="mb-6 space-y-4">
            {/* Manuscript input */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Manuscript *
              </label>
              {Boolean(peerReviewData) && (
                <div className="mb-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-700 font-medium">
                  ✓ Arrived from Paper Checker — peer review suggestions loaded
                </div>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your manuscript here, or upload a DOCX below…"
                rows={10}
                required
                className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                id="polish-manuscript"
              />
            </div>

            {/* Journal style */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Journal style</label>
              <div className="flex flex-wrap gap-2">
                {journalStyles.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setJournalStyle(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      journalStyle === s.value
                        ? "border-[#C4634E] bg-[#C4634E] text-white"
                        : "border-black/10 text-stone-600 hover:border-stone-300"
                    }`}
                    id={`polish-style-${s.value}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context textarea */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Context (optional) — ground-truth to prevent hallucination
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Paste your PICO, key stats, study design notes… AI will lock to these facts."
                rows={3}
                className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                id="polish-context"
              />
            </div>

            {/* Apply peer review toggle */}
            {Boolean(peerReviewData) && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setApplyPeerReview(!applyPeerReview)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    applyPeerReview ? "bg-[#C4634E]" : "bg-stone-200"
                  }`}
                  id="polish-apply-pr"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${applyPeerReview ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <label className="text-sm text-stone-700">Apply peer review suggestions</label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C4634E" }}
              id="polish-btn"
            >
              {loading ? "Polishing…" : "Polish prose"}
            </button>
          </form>

          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

          {result && (
            <div className="space-y-4">
              {/* Side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-black/[0.07] bg-white p-4">
                  <p className="text-xs font-semibold text-stone-400 mb-2 uppercase tracking-wider">Original</p>
                  <pre className="whitespace-pre-wrap text-sm text-stone-600 leading-relaxed font-sans max-h-96 overflow-y-auto">
                    {result.original}
                  </pre>
                </div>
                <div className="rounded-xl border border-black/[0.07] bg-white p-4">
                  <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wider">Polished</p>
                  <pre className="whitespace-pre-wrap text-sm text-stone-900 leading-relaxed font-sans max-h-96 overflow-y-auto">
                    {result.polished}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => navigator.clipboard.writeText(result.polished).catch(() => {})}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
                >
                  Copy polished text
                </button>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download="polished_manuscript.docx"
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#C4634E" }}
                    id="polish-download-btn"
                  >
                    Download .docx ↓
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
