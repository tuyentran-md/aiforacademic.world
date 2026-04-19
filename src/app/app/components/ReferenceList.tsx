"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Reference } from "@/lib/pipeline/types";
import { ReferenceCard } from "./ReferenceCard";

type SortKey = "relevance" | "year" | "citations";

interface ReferenceListProps {
  references: Reference[];
  selectedReferenceIds: string[];
  language: "EN" | "VI";
  disabled: boolean;
  onToggleReference: (referenceId: string) => void;
  onRemoveReference: (referenceId: string) => void;
  onContinue: () => Promise<void>;
}

export function ReferenceList({
  references,
  selectedReferenceIds,
  language,
  disabled,
  onToggleReference,
  onRemoveReference,
  onContinue,
}: ReferenceListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const deferredReferences = useDeferredValue(references);

  const sortedReferences = useMemo(() => {
    const copy = [...deferredReferences];
    copy.sort((left, right) => {
      if (sortKey === "year") {
        return right.year - left.year;
      }
      if (sortKey === "citations") {
        return (right.citationCount || 0) - (left.citationCount || 0);
      }
      return (right.relevanceScore || 0) - (left.relevanceScore || 0);
    });
    return copy;
  }, [deferredReferences, sortKey]);

  const selectedCount = selectedReferenceIds.length;

  return (
    <div className="rounded-[32px] border border-black/8 bg-white/88 p-5 shadow-[0_18px_40px_rgba(17,17,16,0.05)]">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            Step 1 workspace
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-stone-900">
            References ({references.length} found)
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Review and trim the evidence set before sending it to AVR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="rounded-full border border-black/10 bg-stone-50 px-4 py-2 text-sm text-stone-700 outline-none"
          >
            <option value="relevance">Sort by relevance</option>
            <option value="year">Sort by year</option>
            <option value="citations">Sort by citations</option>
          </select>
          <button
            type="button"
            onClick={() => void onContinue()}
            disabled={disabled || selectedCount === 0}
            className="inline-flex items-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to AVR
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-stone-500">
        {selectedCount} reference(s) selected for drafting.
      </p>

      <div className="space-y-4">
        {sortedReferences.map((reference) => (
          <ReferenceCard
            key={reference.id}
            reference={reference}
            selected={selectedReferenceIds.includes(reference.id)}
            language={language}
            onToggle={onToggleReference}
            onRemove={onRemoveReference}
          />
        ))}
      </div>
    </div>
  );
}
