"use client";

import type { IntegrityFlag } from "@/lib/pipeline/types";

const FLAG_STYLE: Record<IntegrityFlag["severity"], string> = {
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function FlagCard({
  flag,
  onDismiss,
}: {
  flag: IntegrityFlag;
  onDismiss: (flagId: string) => void;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${FLAG_STYLE[flag.severity]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
            {flag.severity} · {flag.type.replaceAll("_", " ")}
          </p>
          <p className="mt-2 font-medium leading-relaxed">{flag.message}</p>
          {flag.suggestion ? (
            <p className="mt-2 text-sm opacity-80">Suggestion: {flag.suggestion}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(flag.id)}
          className="rounded-lg border border-current/15 px-3 py-1.5 text-xs font-medium opacity-80"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-80">
        <span className="rounded-full bg-white/80 px-2 py-1">
          {flag.location.sectionHeading} · paragraph {flag.location.paragraphIndex + 1}
        </span>
        {flag.relatedReferenceIds?.map((referenceId) => (
          <span key={referenceId} className="rounded-full bg-white/80 px-2 py-1">
            {referenceId}
          </span>
        ))}
      </div>
    </div>
  );
}
