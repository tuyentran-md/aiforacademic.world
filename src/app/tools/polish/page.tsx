"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { ToolShell, ToolEmptyState, ToolLoadingState } from "@/components/ToolShell";
import { ArtifactRenderer, type Artifact } from "@/components/ArtifactRenderer";

type JournalStyle = "nature" | "bmj" | "jama" | "generic";

const JOURNAL_STYLES: { value: JournalStyle; label: string }[] = [
  { value: "generic", label: "Generic academic" },
  { value: "nature", label: "Nature" },
  { value: "bmj", label: "BMJ" },
  { value: "jama", label: "JAMA" },
];

export default function PolishPage() {
  const [text, setText] = useState("");
  const [journalStyle, setJournalStyle] = useState<JournalStyle>("generic");
  const [context, setContext] = useState("");
  const [applyPeerReview, setApplyPeerReview] = useState(false);
  const [peerReviewData, setPeerReviewData] = useState<unknown>(null);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
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
      try {
        setPeerReviewData(JSON.parse(savedPR));
      } catch {}
      setApplyPeerReview(true);
      sessionStorage.removeItem("afa_polish_peer_review");
    }
  }, []);

  async function handlePolish() {
    const manuscript = text.trim();
    if (!manuscript) return;
    setLoading(true);
    setError(null);
    setArtifact(null);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Polish failed");

      setArtifact({
        id: `polish-${Date.now()}`,
        type: "polish_diff",
        title: `Polished — ${journalStyle}`,
        payload: { original: data.original, polished: data.polished },
        createdAt: Date.now(),
      });

      if (data.docxBase64) {
        const bytes = Uint8Array.from(atob(data.docxBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        setDownloadUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Polish failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-4 h-full flex flex-col">
      {Boolean(peerReviewData) && (
        <div className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-700 font-medium">
          ✓ Arrived from Paper Checker — peer review suggestions loaded
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Manuscript *
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your manuscript here…"
          rows={10}
          required
          className="flex-1 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="polish-manuscript"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Journal style
        </label>
        <div className="flex flex-wrap gap-2">
          {JOURNAL_STYLES.map((s) => (
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

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Context (optional) — prevents hallucination
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Paste your PICO, key stats, study design notes — AI will lock to these facts."
          rows={3}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="polish-context"
        />
      </div>

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
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                applyPeerReview ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <label className="text-sm text-stone-700">Apply peer review suggestions</label>
        </div>
      )}
    </div>
  );

  const secondaryActions =
    artifact && (downloadUrl || true) ? (
      <>
        <button
          onClick={() => navigator.clipboard.writeText((artifact.payload as { polished: string }).polished).catch(() => {})}
          className="rounded-lg px-4 py-2 text-xs font-semibold border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
        >
          Copy polished
        </button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="polished_manuscript.docx"
            className="rounded-lg px-4 py-2 text-xs font-semibold border border-black/10 text-stone-700 hover:border-stone-300 transition-colors"
          >
            Download .docx ↓
          </a>
        )}
      </>
    ) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
      <ToolShell
        title="Polish prose"
        subtitle="Refine your manuscript for a target journal style. Citations and statistics are preserved verbatim."
        input={inputBlock}
        output={
          loading ? (
            <ToolLoadingState label="Polishing prose…" />
          ) : artifact ? (
            <ArtifactRenderer artifact={artifact} />
          ) : (
            <ToolEmptyState
              title="No polish yet"
              description="Paste your manuscript on the left, pick a journal style, then click Polish prose."
            />
          )
        }
        primaryAction={{
          label: "Polish prose",
          loadingLabel: "Polishing…",
          onClick: handlePolish,
          loading,
          disabled: !text.trim(),
        }}
        secondaryActions={secondaryActions}
        error={error}
      />
    </div>
  );
}
