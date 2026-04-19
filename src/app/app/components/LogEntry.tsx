"use client";

import type { LogEntry as LogEntryType } from "@/lib/pipeline/types";

const TOOL_STYLES: Record<LogEntryType["tool"], string> = {
  System: "border-stone-200 bg-white text-stone-700",
  Search: "border-sky-200 bg-sky-50 text-sky-700",
  PubMed: "border-sky-200 bg-sky-50 text-sky-700",
  OpenAlex: "border-orange-200 bg-orange-50 text-orange-700",
  Translator: "border-emerald-200 bg-emerald-50 text-emerald-700",
  AVR: "border-violet-200 bg-violet-50 text-violet-700",
  RIC: "border-rose-200 bg-rose-50 text-rose-700",
};

export function LogEntry({ entry }: { entry: LogEntryType }) {
  return (
    <div
      className={`max-w-[92%] rounded-[28px] rounded-tl-md border px-4 py-3 text-sm shadow-[0_10px_24px_rgba(17,17,16,0.04)] ${TOOL_STYLES[entry.tool]}`}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="font-medium">{entry.tool}</span>
        <span className="text-[11px] uppercase tracking-[0.12em] opacity-60">
          {new Date(entry.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="leading-relaxed">{entry.message}</p>
    </div>
  );
}
