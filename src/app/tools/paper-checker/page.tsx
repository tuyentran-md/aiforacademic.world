"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/Icons";
import {
  ToolShell,
  ToolEmptyState,
  ToolLoadingState,
  type SubTab,
} from "@/components/ToolShell";
import { ArtifactRenderer, type Artifact } from "@/components/ArtifactRenderer";

type PCTab = "citations" | "ai_detect" | "plagiarism" | "peer_review";

// ── Shared file+text input ──────────────────────────────────────────────────
function ManuscriptInput({
  value,
  onChange,
  id,
  rows = 14,
  accept = ".txt,.docx,.pdf",
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
  rows?: number;
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
    <div className="space-y-2 h-full flex flex-col">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
        >
          <Icons.FileText className="w-3.5 h-3.5" />
          {uploading ? "Reading…" : "Upload file (PDF / DOCX / TXT)"}
        </button>
        <span className="text-xs text-stone-400">or paste text below</span>
        <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      </div>
      {fileError && <p className="text-xs text-red-600">{fileError}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your manuscript or reference list here…"
        rows={rows}
        className="flex-1 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-mono"
        id={id}
      />
    </div>
  );
}

// ── Tab: Citations ────────────────────────────────────────────────────────
function CitationTab({ subTabs, activeTab, onTabChange }: { subTabs: SubTab[]; activeTab: PCTab; onTabChange: (t: PCTab) => void }) {
  const [manuscript, setManuscript] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("afa_manuscript_for_check");
    if (saved) {
      setManuscript(saved);
      sessionStorage.removeItem("afa_manuscript_for_check");
    }
  }, []);

  async function handleCheck() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setError(null);
    setArtifact(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Citation check failed");
      setArtifact({
        id: `cite-${Date.now()}`,
        type: "citation_report",
        title: "Citation report",
        payload: data,
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      title="Paper Checker"
      subtitle="Paste your manuscript. We extract every citation and verify each one against CrossRef + OpenAlex."
      tabs={subTabs}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as PCTab)}
      input={<ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-citations-ms" />}
      output={
        loading ? (
          <ToolLoadingState label="Verifying citations against CrossRef + OpenAlex…" />
        ) : artifact ? (
          <ArtifactRenderer artifact={artifact} />
        ) : (
          <ToolEmptyState
            title="No result yet"
            description="Paste your manuscript on the left, then click Check citations. Make sure the text includes a REFERENCES section."
          />
        )
      }
      primaryAction={{
        label: "Check citations",
        loadingLabel: "Checking…",
        onClick: handleCheck,
        loading,
        disabled: !manuscript.trim(),
      }}
      error={error}
    />
  );
}

// ── Tab: AI Detect ─────────────────────────────────────────────────────────
function AIDetectTab({ subTabs, activeTab, onTabChange }: { subTabs: SubTab[]; activeTab: PCTab; onTabChange: (t: PCTab) => void }) {
  const [manuscript, setManuscript] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDetect() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setError(null);
    setArtifact(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/ai-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI detection failed");
      setArtifact({
        id: `ai-${Date.now()}`,
        type: "ai_detect_score",
        title: "AI writing score",
        payload: data,
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      title="Paper Checker"
      subtitle="Paste body text. We score how likely it was AI-generated (0 = fully human, 100 = fully AI)."
      tabs={subTabs}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as PCTab)}
      input={<ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-ai-ms" />}
      output={
        loading ? (
          <ToolLoadingState label="Analysing writing patterns…" />
        ) : artifact ? (
          <ArtifactRenderer artifact={artifact} />
        ) : (
          <ToolEmptyState
            title="No result yet"
            description="Paste 1–2 paragraphs of body text (intro, methods, or discussion). Abstracts alone are too short."
          />
        )
      }
      primaryAction={{
        label: "Detect AI writing",
        loadingLabel: "Analysing…",
        onClick: handleDetect,
        loading,
        disabled: !manuscript.trim(),
      }}
      error={error}
    />
  );
}

// ── Tab: Plagiarism ────────────────────────────────────────────────────────
function PlagiarismTab({ subTabs, activeTab, onTabChange }: { subTabs: SubTab[]; activeTab: PCTab; onTabChange: (t: PCTab) => void }) {
  const [manuscript, setManuscript] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setError(null);
    setArtifact(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/plagiarism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Plagiarism scan failed");
      setArtifact({
        id: `plag-${Date.now()}`,
        type: "plagiarism_scan",
        title: "Plagiarism scan",
        payload: data,
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      title="Paper Checker"
      subtitle="Paste your manuscript. We scan for similarity against published literature, citation-aware."
      tabs={subTabs}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as PCTab)}
      input={<ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-plagiarism-ms" />}
      output={
        loading ? (
          <ToolLoadingState label="Scanning for matching literature…" />
        ) : artifact ? (
          <ArtifactRenderer artifact={artifact} />
        ) : (
          <ToolEmptyState
            title="No result yet"
            description="Paste body paragraphs (intro / methods / discussion) where unintentional copying is most likely."
          />
        )
      }
      primaryAction={{
        label: "Scan for plagiarism",
        loadingLabel: "Scanning…",
        onClick: handleScan,
        loading,
        disabled: !manuscript.trim(),
      }}
      error={error}
    />
  );
}

// ── Tab: Peer Review ───────────────────────────────────────────────────────
function PeerReviewTab({ subTabs, activeTab, onTabChange }: { subTabs: SubTab[]; activeTab: PCTab; onTabChange: (t: PCTab) => void }) {
  const [manuscript, setManuscript] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReview() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setError(null);
    setArtifact(null);
    try {
      const res = await apiFetch("/api/pipeline/ric/peer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: manuscript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Peer review failed");
      setArtifact({
        id: `peer-${Date.now()}`,
        type: "peer_review",
        title: "Peer review",
        payload: data,
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function chainToPolish() {
    if (!artifact || !manuscript) return;
    sessionStorage.setItem("afa_polish_manuscript", manuscript);
    sessionStorage.setItem("afa_polish_peer_review", JSON.stringify(artifact.payload));
    router.push("/tools/polish");
  }

  return (
    <ToolShell
      title="Paper Checker"
      subtitle="Paste your manuscript. We simulate an editor-style peer review with section-level comments."
      tabs={subTabs}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as PCTab)}
      input={<ManuscriptInput value={manuscript} onChange={setManuscript} id="pc-peer-ms" />}
      output={
        loading ? (
          <ToolLoadingState label="Drafting structured editorial feedback…" />
        ) : artifact ? (
          <div className="space-y-3">
            <ArtifactRenderer artifact={artifact} />
            <button
              onClick={chainToPolish}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8B5CF6" }}
            >
              Polish this paper →
            </button>
          </div>
        ) : (
          <ToolEmptyState
            title="No review yet"
            description="Paste from Abstract through Discussion. The reviewer needs to see structure to give useful feedback."
          />
        )
      }
      primaryAction={{
        label: "Run peer review",
        loadingLabel: "Reviewing…",
        onClick: handleReview,
        loading,
        disabled: !manuscript.trim(),
      }}
      error={error}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function PaperCheckerPage() {
  const [tab, setTab] = useState<PCTab>("citations");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("tab") as PCTab | null;
    const validTabs: PCTab[] = ["citations", "ai_detect", "plagiarism", "peer_review"];
    if (p && validTabs.includes(p)) setTab(p);
  }, []);

  const subTabs: SubTab[] = [
    { id: "citations", label: "Citations" },
    { id: "ai_detect", label: "AI detect" },
    { id: "plagiarism", label: "Plagiarism" },
    { id: "peer_review", label: "Peer review" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
      {tab === "citations" && <CitationTab subTabs={subTabs} activeTab={tab} onTabChange={setTab} />}
      {tab === "ai_detect" && <AIDetectTab subTabs={subTabs} activeTab={tab} onTabChange={setTab} />}
      {tab === "plagiarism" && <PlagiarismTab subTabs={subTabs} activeTab={tab} onTabChange={setTab} />}
      {tab === "peer_review" && <PeerReviewTab subTabs={subTabs} activeTab={tab} onTabChange={setTab} />}
    </div>
  );
}
