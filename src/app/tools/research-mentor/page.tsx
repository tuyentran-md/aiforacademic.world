"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/Icons";
import { apiFetch } from "@/lib/api-client";
import ToolTabs from "@/components/ToolTabs";

type Tab = "validate" | "outline" | "draft";
type StudyType = "RCT" | "cohort" | "MA" | "SR" | "case_report" | "narrative" | "letter";

// ── Tab: Validate ──────────────────────────────────────────────────────────
function ValidateTab({ onChainToOutline }: { onChainToOutline: (topic: string, studyType: StudyType) => void }) {
  const [idea, setIdea] = useState("");
  const [field, setField] = useState("");
  const [journal, setJournal] = useState("");
  const [result, setResult] = useState<null | {
    novelty: { score: number; comment: string };
    feasibility: { score: number; comment: string };
    publishability: { score: number; comment: string };
    redFlags: string[];
    recommendation: string;
    suggestedStudyType: StudyType;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch("/api/pipeline/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), field: field.trim() || undefined, journal: journal.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Validation failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  const scores = result
    ? [
        { label: "Novelty", score: result.novelty.score, comment: result.novelty.comment },
        { label: "Feasibility", score: result.feasibility.score, comment: result.feasibility.comment },
        { label: "Publishability", score: result.publishability.score, comment: result.publishability.comment },
      ]
    : [];

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Describe your research idea. We score <strong>novelty, feasibility, and publishability</strong> against your target field and journal, then suggest a study type.
      </p>
      <form onSubmit={handleValidate} className="mb-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Research idea *
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your research idea in 200–2000 characters. Include the problem, proposed method, and population."
            rows={5}
            maxLength={2000}
            required
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="rm-idea-input"
          />
          <p className="mt-1 text-xs text-stone-400 text-right">{idea.length}/2000</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Field (optional)</label>
            <input
              type="text"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="e.g. Pediatric surgery"
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              id="rm-field-input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Target journal (optional)</label>
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="e.g. JAMA Pediatrics"
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              id="rm-journal-input"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || idea.trim().length < 50}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }}
          id="rm-validate-btn"
        >
          {loading ? "Analyzing…" : "Validate idea"}
        </button>
      </form>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* Score cards */}
          <div className="grid grid-cols-3 gap-3">
            {scores.map((s) => (
              <div key={s.label} className="rounded-xl border border-black/[0.07] bg-white p-4 text-center">
                <p className="text-2xl font-bold text-stone-900 mb-0.5">{s.score}/10</p>
                <p className="text-xs font-semibold text-stone-500 mb-1">{s.label}</p>
                <p className="text-xs text-stone-500 leading-relaxed">{s.comment}</p>
              </div>
            ))}
          </div>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800 mb-2">⚠ Red flags</p>
              <ul className="space-y-1">
                {result.redFlags.map((f, i) => (
                  <li key={i} className="text-sm text-amber-700">{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="rounded-xl border border-black/[0.07] bg-white p-4">
            <p className="text-xs font-semibold text-stone-500 mb-1">Recommendation</p>
            <p className="text-sm text-stone-700 leading-relaxed">{result.recommendation}</p>
          </div>

          {/* Chain CTA */}
          <button
            onClick={() => onChainToOutline(idea.trim(), result.suggestedStudyType)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#8B5CF6" }}
            id="rm-chain-outline-btn"
          >
            Generate outline for this idea →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Outline ───────────────────────────────────────────────────────────
function OutlineTab({
  prefillTopic,
  prefillStudyType,
  onChainToDraft,
}: {
  prefillTopic?: string;
  prefillStudyType?: StudyType;
  onChainToDraft: (outline: string) => void;
}) {
  const [topic, setTopic] = useState(prefillTopic ?? "");
  const [studyType, setStudyType] = useState<StudyType>(prefillStudyType ?? "RCT");
  const [result, setResult] = useState<string | null>(null);
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

  async function handleOutline(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch("/api/pipeline/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), studyType }),
      });
      if (!res.ok) throw new Error("Outline generation failed");
      const data = await res.json();
      setResult(data.outline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Pick a topic and study type. We generate a <strong>structured outline</strong> with PICO, inclusion/exclusion criteria, methods, and analysis plan.
      </p>
      <form onSubmit={handleOutline} className="mb-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Topic *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Laparoscopic vs open appendectomy in children under 5"
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="rm-outline-topic"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Study type</label>
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
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }}
          id="rm-outline-btn"
        >
          {loading ? "Generating…" : "Generate outline"}
        </button>
      </form>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.07] bg-white p-5">
            <pre className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed font-sans">{result}</pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(result).catch(() => {})}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
            >
              Copy outline
            </button>
            <button
              onClick={() => onChainToDraft(result)}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8B5CF6" }}
              id="rm-chain-draft-btn"
            >
              Draft manuscript →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Draft ─────────────────────────────────────────────────────────────
function DraftTab({ prefillOutline }: { prefillOutline?: string }) {
  const [refs, setRefs] = useState("");
  const [outline, setOutline] = useState(prefillOutline ?? "");
  const [articleType, setArticleType] = useState("narrative_review");
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDraft(e: React.FormEvent) {
    e.preventDefault();
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
          const event = JSON.parse(ev.data);
          if (event.type === "manuscript_chunk") {
            setManuscript((prev) => prev + event.data.content);
          }
          if (event.type === "error") setError(event.data.message);
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

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Paste references and an optional outline. We <strong>draft a full manuscript</strong> with proper citations, streamed section by section.
      </p>
      <form onSubmit={handleDraft} className="mb-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            References * (paste titles + abstracts, separate with blank line)
          </label>
          <textarea
            value={refs}
            onChange={(e) => setRefs(e.target.value)}
            placeholder={"Smith et al. 2023 – Laparoscopic outcomes in pediatric appendicitis...\n\nJones et al. 2022 – Open vs laparoscopic: a meta-analysis..."}
            rows={5}
            required
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            id="rm-draft-refs"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Outline (optional — from Outline tab or manual)
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Article type</label>
          <select
            value={articleType}
            onChange={(e) => setArticleType(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none"
            id="rm-draft-type"
          >
            <option value="narrative_review">Narrative Review</option>
            <option value="systematic_review">Systematic Review</option>
            <option value="original_research">Original Research</option>
            <option value="case_report">Case Report</option>
            <option value="letter_to_editor">Letter to Editor</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !refs.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C4634E" }}
          id="rm-draft-btn"
        >
          {loading ? "Drafting…" : "Draft manuscript"}
        </button>
      </form>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

      {manuscript && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.07] bg-white p-5 max-h-[500px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed font-sans">{manuscript}</pre>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigator.clipboard.writeText(manuscript).catch(() => {})}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-black/10 text-stone-600 hover:border-stone-300 transition-colors"
            >
              Copy draft
            </button>
            {!loading && (
              <button
                onClick={() => {
                  sessionStorage.setItem("afa_manuscript_for_check", manuscript);
                  router.push("/tools/paper-checker");
                }}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#EF4444" }}
                id="rm-chain-checker-btn"
              >
                Check this draft →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ResearchMentorPage() {
  const [tab, setTab] = useState<Tab>("validate");
  const [prefillOutlineTopic, setPrefillOutlineTopic] = useState<string | undefined>();
  const [prefillOutlineStudyType, setPrefillOutlineStudyType] = useState<StudyType | undefined>();
  const [prefillDraftOutline, setPrefillDraftOutline] = useState<string | undefined>();

  const tabs: { key: Tab; label: React.ReactNode }[] = [
    { key: "validate", label: <span className="flex items-center gap-1.5"><Icons.Lightbulb className="w-4 h-4" /> Validate</span> },
    { key: "outline", label: <span className="flex items-center gap-1.5"><Icons.ClipboardList className="w-4 h-4" /> Outline</span> },
    { key: "draft", label: <span className="flex items-center gap-1.5"><Icons.Edit className="w-4 h-4" /> Draft</span> },
  ];

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
    <div className="flex-1 flex flex-col min-h-0">
      <ToolTabs tabs={tabs} active={tab} onChange={setTab} idPrefix="rm-tab" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
          {tab === "validate" && <ValidateTab onChainToOutline={handleChainToOutline} />}
          {tab === "outline" && (
            <OutlineTab
              prefillTopic={prefillOutlineTopic}
              prefillStudyType={prefillOutlineStudyType}
              onChainToDraft={handleChainToDraft}
            />
          )}
          {tab === "draft" && <DraftTab prefillOutline={prefillDraftOutline} />}
        </div>
      </div>
    </div>
  );
}
