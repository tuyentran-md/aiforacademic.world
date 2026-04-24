"use client";

import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type ArtifactType =
  | "paper_cards"
  | "manuscript"
  | "citation_report"
  | "ai_detect_score"
  | "plagiarism_scan"
  | "peer_review"
  | "feasibility"
  | "outline"
  | "translation"
  | "fetch_result"
  | "polish_diff";

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  payload: unknown;
  createdAt: number;
  pinned?: boolean;
}

// ── Markdown helpers (shared) ──────────────────────────────────────────────

export function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={j} className="rounded bg-stone-100 px-1 py-0.5 text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    return <span key={j}>{part}</span>;
  });
}

export function MarkdownBlock({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="text-sm text-stone-700 leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (/^###\s/.test(line))
          return (
            <h4 key={i} className="text-sm font-semibold text-stone-900 mt-3">
              {line.replace(/^###\s/, "")}
            </h4>
          );
        if (/^##\s/.test(line))
          return (
            <h3 key={i} className="text-base font-bold text-stone-900 mt-3">
              {line.replace(/^##\s/, "")}
            </h3>
          );
        if (/^#\s/.test(line))
          return (
            <h2 key={i} className="text-lg font-bold text-stone-900 mt-3">
              {line.replace(/^#\s/, "")}
            </h2>
          );
        if (/^[\-\*]\s/.test(line))
          return (
            <p key={i} className="ml-4">
              • {renderInlineMarkdown(line.replace(/^[\-\*]\s/, ""))}
            </p>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <p key={i} className="ml-4">
              {renderInlineMarkdown(line)}
            </p>
          );
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

// ── ArtifactRenderer ───────────────────────────────────────────────────────

export function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  const p = artifact.payload as Record<string, unknown>;
  switch (artifact.type) {
    case "paper_cards": {
      const refs = (p.refs as unknown[]) ?? [];
      if (refs.length === 0)
        return <p className="text-sm text-stone-500 italic">No matching papers.</p>;
      return (
        <div className="space-y-3">
          {refs.map((ref: unknown, i) => {
            const r = ref as Record<string, unknown>;
            return (
              <div
                key={(r.id as string) ?? i}
                className="rounded-lg border border-black/[0.07] bg-white/60 p-4"
              >
                <a
                  href={r.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-stone-900 hover:text-[#C4634E]"
                >
                  {r.title as string}
                </a>
                <p className="text-xs text-stone-400 mt-1">
                  {(r.authors as string[])?.slice(0, 3).join(", ")}
                  {(r.authors as string[])?.length > 3 ? " et al." : ""} ·{" "}
                  {r.journal as string} · {r.year as number}
                </p>
                {r.abstract ? (
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {r.abstract as string}
                  </p>
                ) : null}
                {r.doi ? (
                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    <a
                      href={`https://doi.org/${r.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 hover:text-[#C4634E]"
                    >
                      doi:{r.doi as string}
                    </a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }
    case "manuscript":
    case "outline": {
      const text = ((p.text ?? p.outline) as string) ?? "";
      const ris = p.ris as string | undefined;
      return (
        <div className="space-y-3">
          <MarkdownBlock text={text} />
          {ris ? (
            <button
              onClick={() => {
                const blob = new Blob([ris], { type: "application/x-research-info-systems" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "refs.ris";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-stone-300"
            >
              Download .ris ↓
            </button>
          ) : null}
        </div>
      );
    }
    case "feasibility": {
      const scores = [
        { label: "Novelty", d: p.novelty as Record<string, unknown> },
        { label: "Feasibility", d: p.feasibility as Record<string, unknown> },
        { label: "Publishability", d: p.publishability as Record<string, unknown> },
      ];
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {scores.map((s) => {
              const score = (s.d?.score as number) ?? 0;
              const tone =
                score >= 7 ? "text-green-600" : score >= 5 ? "text-amber-600" : "text-red-600";
              return (
                <div
                  key={s.label}
                  className="rounded-lg border border-black/[0.07] bg-white/60 p-3 text-center"
                >
                  <p className={`text-2xl font-bold ${tone}`}>
                    {score}
                    <span className="text-sm text-stone-400">/10</span>
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    {s.label}
                  </p>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {s.d?.comment as string}
                  </p>
                </div>
              );
            })}
          </div>
          {p.suggestedStudyType ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">Suggested study type:</span>{" "}
              {p.suggestedStudyType as string}
            </div>
          ) : null}
          {Array.isArray(p.redFlags) && (p.redFlags as string[]).length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Red flags</p>
              {(p.redFlags as string[]).map((f, i) => (
                <p key={i} className="text-sm text-amber-700">
                  • {f}
                </p>
              ))}
            </div>
          )}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">
              Recommendation
            </p>
            <p className="text-sm text-stone-700">{p.recommendation as string}</p>
          </div>
        </div>
      );
    }
    case "citation_report": {
      const refs =
        (p.refs as Array<{
          ref: string;
          status: "verified" | "unverified" | "error";
          sources?: string[];
          doi?: string;
        }>) ?? [];
      const warning = (p.warning as string) ?? "";
      return (
        <div className="space-y-3">
          {warning && (p.total as number) === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {warning}
            </div>
          ) : null}
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-stone-900">{(p.total as number) ?? 0}</p>
              <p className="text-xs text-stone-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{(p.verified as number) ?? 0}</p>
              <p className="text-xs text-stone-500">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{(p.unverified as number) ?? 0}</p>
              <p className="text-xs text-stone-500">Unverified</p>
            </div>
          </div>
          {refs.length > 0 ? (
            <div className="space-y-2">
              {refs.map((r, i) => (
                <div
                  key={r.doi ?? i}
                  className="rounded-lg border border-black/[0.07] bg-white/60 px-3 py-2 flex items-start gap-2"
                >
                  <span
                    className={`mt-0.5 flex-shrink-0 text-sm ${
                      r.status === "verified" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {r.status === "verified" ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-stone-700 leading-relaxed break-words">{r.ref}</p>
                    {r.sources && r.sources.length > 0 && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        via {r.sources.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case "ai_detect_score": {
      const score = (p.score as number) ?? 0;
      const verdict = (p.verdict as string) ?? "Mixed";
      const tone =
        verdict === "Human"
          ? "text-green-600 bg-green-50 border-green-100"
          : verdict === "AI"
          ? "text-red-600 bg-red-50 border-red-100"
          : "text-amber-600 bg-amber-50 border-amber-100";
      const patterns = (p.patterns as string[]) ?? [];
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-black/[0.07] bg-white/60 p-4 text-center">
            <p className="text-5xl font-bold text-stone-900">
              {score}
              <span className="text-base font-normal text-stone-400">/100</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">AI score (0 = human · 100 = AI)</p>
            <span
              className={`inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full border ${tone}`}
            >
              {verdict}
            </span>
          </div>
          {p.summary ? (
            <div className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
              <p className="text-sm text-stone-700">{p.summary as string}</p>
            </div>
          ) : null}
          {patterns.length > 0 && (
            <div className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                Detected patterns
              </p>
              <ul className="space-y-1">
                {patterns.map((pat, i) => (
                  <li key={i} className="text-sm text-stone-700">
                    • {pat}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    case "plagiarism_scan": {
      const sim = (p.similarity as number) ?? 0;
      const tone = sim < 15 ? "bg-green-500" : sim < 35 ? "bg-amber-500" : "bg-red-500";
      const sources =
        (p.sources as Array<{ url?: string; title?: string; similarity?: number }>) ?? [];
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-black/[0.07] bg-white/60 p-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Overall similarity
              </p>
              <p className="text-2xl font-bold text-stone-900">{sim}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full ${tone} transition-all`}
                style={{ width: `${Math.min(100, sim)}%` }}
              />
            </div>
          </div>
          {p.summary ? (
            <div className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
              <p className="text-sm text-stone-700">{p.summary as string}</p>
            </div>
          ) : null}
          {sources.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Sources
              </p>
              {sources.map((s, i) => (
                <div key={i} className="rounded-lg border border-black/[0.07] bg-white/60 px-3 py-2">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-stone-800 hover:text-[#C4634E] break-all"
                    >
                      {s.title || s.url}
                    </a>
                  ) : (
                    <p className="text-xs font-medium text-stone-800">{s.title}</p>
                  )}
                  {typeof s.similarity === "number" && (
                    <p className="text-[10px] text-stone-400 mt-0.5">{s.similarity}% match</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic">No matching sources detected.</p>
          )}
        </div>
      );
    }
    case "peer_review": {
      const sections =
        (p.sections as Array<{ heading: string; comments: string[] }>) ?? [];
      const rec = (p.recommendation as string) ?? "";
      const recTone = /accept/i.test(rec)
        ? "bg-green-50 text-green-700 border-green-200"
        : /reject/i.test(rec)
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200";
      return (
        <div className="space-y-3">
          {p.summary ? (
            <p className="text-sm text-stone-700 leading-relaxed">{p.summary as string}</p>
          ) : null}
          {sections.map((s, i) => (
            <div key={i} className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
                {s.heading}
              </p>
              <ul className="space-y-1">
                {s.comments.map((c, j) => (
                  <li key={j} className="text-sm text-stone-700">
                    • {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {rec ? (
            <div className={`rounded-lg border px-3 py-2 ${recTone}`}>
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Recommendation
              </span>
              <p className="text-sm font-semibold mt-0.5">{rec}</p>
            </div>
          ) : null}
        </div>
      );
    }
    case "fetch_result": {
      const results =
        (p.results as Array<{
          doi: string;
          status: string;
          source?: string;
          downloadUrl?: string;
        }>) ?? [];
      return (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-stone-500 italic">No results.</p>
          ) : (
            results.map((r, i) => (
              <div key={i} className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-stone-500 break-all">doi:{r.doi}</p>
                    {r.source ? (
                      <p className="text-[11px] text-stone-400 mt-0.5">via {r.source}</p>
                    ) : null}
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
                {r.downloadUrl ? (
                  <a
                    href={r.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C4634E] hover:underline"
                  >
                    Open PDF →
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      );
    }
    case "translation": {
      const translated = (p.translated as string) ?? "";
      const lang = (p.targetLanguage as string) ?? "VI";
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">→ {lang}</span>
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(translated)}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-800"
            >
              Copy
            </button>
          </div>
          <div className="rounded-lg border border-black/[0.07] bg-white/60 p-4">
            <MarkdownBlock text={translated} />
          </div>
        </div>
      );
    }
    case "polish_diff": {
      const original = (p.original as string) ?? "";
      const polished = (p.polished as string) ?? "";
      return (
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-black/[0.07] bg-stone-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
                Original
              </p>
              <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">
                {original}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-1.5">
                Polished
              </p>
              <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                {polished}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(polished)}
            className="text-xs font-semibold text-[#C4634E] hover:underline"
          >
            Copy polished text
          </button>
        </div>
      );
    }
    default:
      return (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
          Unsupported artifact type. Open the relevant tool page for full output.
        </div>
      );
  }
}
