"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import {
  ToolShell,
  ToolEmptyState,
  ToolLoadingState,
  type SubTab,
} from "@/components/ToolShell";
import { ArtifactRenderer, type Artifact, MarkdownBlock } from "@/components/ArtifactRenderer";

type Tab = "validate" | "outline" | "draft";
type StudyType = "RCT" | "cohort" | "MA" | "SR" | "case_report" | "narrative" | "letter";

const SUB_TABS: SubTab[] = [
  { id: "validate", label: "1 · Validate" },
  { id: "outline", label: "2 · Outline" },
  { id: "draft", label: "3 · Draft" },
];

// ── Tab: Validate ──────────────────────────────────────────────────────────
function ValidateTab({
  activeTab,
  onTabChange,
  onChainToOutline,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onChainToOutline: (topic: string, studyType: StudyType) => void;
}) {
  const [idea, setIdea] = useState("");
  const [field, setField] = useState("");
  const [journal, setJournal] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [suggestedStudyType, setSuggestedStudyType] = useState<StudyType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate() {
    if (!idea.trim() || idea.trim().length < 50) {
      setError("Idea must be at least 50 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setArtifact(null);
    try {
      const res = await apiFetch("/api/pipeline/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          field: field.trim() || undefined,
          journal: journal.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");
      setSuggestedStudyType(data.suggestedStudyType);
      setArtifact({
        id: `feas-${Date.now()}`,
        type: "feasibility",
        title: "Feasibility report",
        payload: data,
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex-1 flex flex-col">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Research idea *
        </label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe your research idea in 200–2000 characters. Include the problem, proposed method, and population."
          rows={8}
          maxLength={2000}
          className="flex-1 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="rm-idea-input"
        />
        <p className="mt-1 text-[11px] text-stone-400 text-right">{idea.length}/2000</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Field (optional)
          </label>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. Pediatric surgery"
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="rm-field-input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Target journal (optional)
          </label>
          <input
            type="text"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="e.g. JAMA Pediatrics"
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="rm-journal-input"
          />
        </div>
      </div>
    </div>
  );

  const secondary =
    artifact && suggestedStudyType ? (
      <button
        onClick={() => onChainToOutline(idea.trim(), suggestedStudyType)}
        className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#8B5CF6" }}
      >
        Generate outline →
      </button>
    ) : null;

  return (
    <ToolShell
      title="Research Mentor"
      subtitle="Critique your research idea — novelty, feasibility, publishability — and recommend a study design."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={
        loading ? (
          <ToolLoadingState label="Critiquing your idea against literature…" />
        ) : artifact ? (
          <ArtifactRenderer artifact={artifact} />
        ) : (
          <ToolEmptyState
            title="No critique yet"
            description="Describe your idea on the left (≥50 chars). The mentor scores novelty, feasibility, publishability and red flags."
          />
        )
      }
      primaryAction={{
        label: "Validate idea",
        loadingLabel: "Analysing…",
        onClick: handleValidate,
        loading,
        disabled: !idea.trim() || idea.trim().length < 50,
      }}
      secondaryActions={secondary}
      error={error}
    />
  );
}

// ── Tab: Outline ───────────────────────────────────────────────────────────
function OutlineTab({
  activeTab,
  onTabChange,
  prefillTopic,
  prefillStudyType,
  onChainToDraft,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  prefillTopic?: string;
  prefillStudyType?: StudyType;
  onChainToDraft: (outline: string) => void;
}) {
  const [topic, setTopic] = useState(prefillTopic ?? "");
  const [studyType, setStudyType] = useState<StudyType>(prefillStudyType ?? "RCT");
  const [outlineText, setOutlineText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studyTypes: { value: StudyType; label: string }[] = [
    { value: "RCT", label: "RCT" },
    { value: "cohort", label: "Cohort" },
    { value: "MA", label: "Meta-analysis" },
    { value: "SR", label: "Systematic Review" },
    { value: "case_report", label: "Case Report" },
    { value: "narrative", label: "Narrative Review" },
    { value: "letter", label: "Letter to Editor" },
  ];

  async function handleOutline() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setOutlineText(null);
    try {
      const res = await apiFetch("/api/pipeline/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), studyType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Outline generation failed");
      setOutlineText(data.outline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Topic *
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Laparoscopic vs open appendectomy in children under 5"
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="rm-outline-topic"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Study type
        </label>
        <div className="flex flex-wrap gap-2">
          {studyTypes.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStudyType(st.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                studyType === st.value
                  ? "border-[#C4634E] bg-[#C4634E] text-white"
                  : "border-black/10 text-stone-600 hover:border-stone-300"
              }`}
              id={`rm-study-type-${st.value}`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const secondary = outlineText ? (
    <>
      <button
        onClick={() => navigator.clipboard.writeText(outlineText).catch(() => {})}
        className="rounded-lg px-4 py-2 text-xs font-semibold border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
      >
        Copy
      </button>
      <button
        onClick={() => onChainToDraft(outlineText)}
        className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#8B5CF6" }}
      >
        Draft manuscript →
      </button>
    </>
  ) : null;

  return (
    <ToolShell
      title="Research Mentor"
      subtitle="Generate a structured outline — PICO, inclusion / exclusion, methods, analysis plan."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={
        loading ? (
          <ToolLoadingState label="Generating PICO + analysis plan…" />
        ) : outlineText ? (
          <MarkdownBlock text={outlineText} />
        ) : (
          <ToolEmptyState
            title="No outline yet"
            description="Type a research topic, pick a study type, then generate. Output is markdown — copy or chain to Draft."
          />
        )
      }
      primaryAction={{
        label: "Generate outline",
        loadingLabel: "Generating…",
        onClick: handleOutline,
        loading,
        disabled: !topic.trim(),
      }}
      secondaryActions={secondary}
      error={error}
    />
  );
}

// ── Tab: Draft ─────────────────────────────────────────────────────────────
function DraftTab({
  activeTab,
  onTabChange,
  prefillOutline,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  prefillOutline?: string;
}) {
  const [refs, setRefs] = useState("");
  const [outline, setOutline] = useState(prefillOutline ?? "");
  const [articleType, setArticleType] = useState("narrative_review");
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDraft() {
    if (!refs.trim()) return;
    setLoading(true);
    setError(null);
    setManuscript("");

    const refsParsed = refs
      .split(/\n{2,}|\n---+\n/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r, i) => ({
        id: `ref-${String(i + 1).padStart(3, "0")}`,
        source: "openalex" as const,
        title: r.slice(0, 100),
        authors: [],
        journal: "",
        year: new Date().getFullYear(),
        abstract: r,
        url: "",
      }));

    try {
      const response = await apiFetch("/api/pipeline/avr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: outline.split("\n")[0] ?? "Research topic",
          references: refsParsed,
          language: "EN",
          articleType,
          outline: outline || undefined,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Draft failed");

      const { createParser } = await import("eventsource-parser");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = createParser({
        onEvent(ev) {
          if (!ev.data) return;
          try {
            const event = JSON.parse(ev.data);
            if (event.type === "manuscript_chunk") {
              setManuscript((prev) => prev + event.data.content);
            }
            if (event.type === "error") setError(event.data.message);
          } catch {/* ignore non-json keepalives */}
        },
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
      parser.feed(decoder.decode());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBlock = (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex-1 flex flex-col">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          References * (titles + abstracts, separated by blank lines)
        </label>
        <textarea
          value={refs}
          onChange={(e) => setRefs(e.target.value)}
          placeholder={"Smith et al. 2023 – Laparoscopic outcomes…\n\nJones et al. 2022 – Open vs laparoscopic meta-analysis…"}
          rows={6}
          className="flex-1 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="rm-draft-refs"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Outline (optional)
        </label>
        <textarea
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          placeholder="PICO, I/E criteria, analysis plan…"
          rows={3}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          id="rm-draft-outline"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Article type
        </label>
        <select
          value={articleType}
          onChange={(e) => setArticleType(e.target.value)}
          className="w-full md:w-auto rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none"
          id="rm-draft-type"
        >
          <option value="narrative_review">Narrative Review</option>
          <option value="systematic_review">Systematic Review</option>
          <option value="original_research">Original Research</option>
          <option value="case_report">Case Report</option>
          <option value="letter_to_editor">Letter to Editor</option>
        </select>
      </div>
    </div>
  );

  const secondary = manuscript && !loading ? (
    <>
      <button
        onClick={() => navigator.clipboard.writeText(manuscript).catch(() => {})}
        className="rounded-lg px-4 py-2 text-xs font-semibold border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
      >
        Copy draft
      </button>
      <button
        onClick={() => {
          sessionStorage.setItem("afa_manuscript_for_check", manuscript);
          router.push("/tools/paper-checker");
        }}
        className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#EF4444" }}
      >
        Check this draft →
      </button>
    </>
  ) : null;

  return (
    <ToolShell
      title="Research Mentor"
      subtitle="Stream a manuscript draft from your shortlisted references — section by section."
      tabs={SUB_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as Tab)}
      input={inputBlock}
      output={
        loading && !manuscript ? (
          <ToolLoadingState label="Drafting the first section…" />
        ) : manuscript ? (
          <div className="rounded-lg border border-black/[0.07] bg-white/60 p-4 max-h-[480px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed font-sans">
              {manuscript}
            </pre>
          </div>
        ) : (
          <ToolEmptyState
            title="No draft yet"
            description="Paste 3–10 references on the left (titles + abstracts), pick an article type, and the mentor streams a draft."
          />
        )
      }
      primaryAction={{
        label: "Draft manuscript",
        loadingLabel: loading && manuscript ? "Streaming…" : "Drafting…",
        onClick: handleDraft,
        loading,
        disabled: !refs.trim(),
      }}
      secondaryActions={secondary}
      error={error}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ResearchMentorPage() {
  const [tab, setTab] = useState<Tab>("validate");
  const [prefillOutlineTopic, setPrefillOutlineTopic] = useState<string | undefined>();
  const [prefillOutlineStudyType, setPrefillOutlineStudyType] = useState<StudyType | undefined>();
  const [prefillDraftOutline, setPrefillDraftOutline] = useState<string | undefined>();

  function handleChainToOutline(topic: string, studyType: StudyType) {
    setPrefillOutlineTopic(topic);
    setPrefillOutlineStudyType(studyType);
    setTab("outline");
  }

  function handleChainToDraft(outline: string) {
    setPrefillDraftOutline(outline);
    setTab("draft");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
      {tab === "validate" && (
        <ValidateTab activeTab={tab} onTabChange={setTab} onChainToOutline={handleChainToOutline} />
      )}
      {tab === "outline" && (
        <OutlineTab
          activeTab={tab}
          onTabChange={setTab}
          prefillTopic={prefillOutlineTopic}
          prefillStudyType={prefillOutlineStudyType}
          onChainToDraft={handleChainToDraft}
        />
      )}
      {tab === "draft" && (
        <DraftTab activeTab={tab} onTabChange={setTab} prefillOutline={prefillDraftOutline} />
      )}
    </div>
  );
}
