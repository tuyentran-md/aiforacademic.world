"use client";

import { useState } from "react";
import type { Reference } from "@/lib/pipeline/types";

interface ReferenceCardProps {
  reference: Reference;
  selected: boolean;
  language: "EN" | "VI";
  onToggle: (referenceId: string) => void;
  onRemove: (referenceId: string) => void;
}

export function ReferenceCard({
  reference,
  selected,
  language,
  onToggle,
  onRemove,
}: ReferenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const abstract =
    language === "VI" && showTranslation && reference.abstractTranslated
      ? reference.abstractTranslated
      : reference.abstract;

  return (
    <article className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_12px_32px_rgba(17,17,16,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(reference.id)}
            className="mt-1 h-4 w-4 rounded border-black/20 text-stone-900 focus:ring-stone-400"
          />
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
                {reference.id}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  reference.source === "pubmed"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                {reference.source}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-snug text-stone-900">{reference.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {reference.authors.slice(0, 4).join(", ") || "Unknown authors"} · {reference.journal} ·{" "}
              {reference.year}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-400">
              {reference.doi ? `DOI ${reference.doi}` : "No DOI"} · Cited {reference.citationCount || 0} ·
              Relevance {(reference.relevanceScore || 0).toFixed(2)}
            </p>
          </div>
        </label>

        <button
          type="button"
          onClick={() => onRemove(reference.id)}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-stone-500 transition hover:bg-stone-100"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-stone-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Abstract</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {language === "VI" && reference.abstractTranslated ? (
              <button
                type="button"
                onClick={() => setShowTranslation((previous) => !previous)}
                className="rounded-full border border-black/10 px-3 py-1 text-stone-600 transition hover:bg-white"
              >
                {showTranslation ? "Show original" : "Show Vietnamese"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              className="rounded-full border border-black/10 px-3 py-1 text-stone-600 transition hover:bg-white"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
        <p className={`mt-3 text-sm leading-relaxed text-stone-600 ${expanded ? "" : "line-clamp-4"}`}>
          {abstract || "No abstract available."}
        </p>
      </div>
    </article>
  );
}
