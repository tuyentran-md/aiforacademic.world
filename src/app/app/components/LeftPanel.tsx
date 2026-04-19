"use client";

import { useEffect, useRef } from "react";
import type { LogEntry as LogEntryType } from "@/lib/pipeline/types";
import { ChatInput } from "./ChatInput";
import { LogEntry } from "./LogEntry";

const EXAMPLES = [
  "Outcomes of cleft palate repair techniques in children",
  "AI-assisted diagnosis in radiology: systematic review",
  "Laparoscopic versus open appendectomy in pediatric patients",
  "Pressure dressing after circumcision in children",
] as const;

interface LeftPanelProps {
  logs: LogEntryType[];
  language: "EN" | "VI";
  query: string;
  isRunning: boolean;
  onLanguageChange: (language: "EN" | "VI") => void;
  onSearch: (query: string) => Promise<void>;
  onReset: () => void;
}

export function LeftPanel({
  logs,
  language,
  query,
  isRunning,
  onLanguageChange,
  onSearch,
  onReset,
}: LeftPanelProps) {
  const logAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <aside className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,241,234,0.96))] shadow-lg">
      <div className="border-b border-black/6 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Chat
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-stone-900">Ask AFA</h1>
            <p className="mt-1 text-sm text-stone-600">Ask a question or try an example.</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg bg-stone-900 px-3 py-2 text-[11px] font-medium text-white transition hover:opacity-90"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {query ? (
            <div className="flex justify-end">
              <div className="max-w-[88%] rounded-xl rounded-br-md bg-stone-900 px-4 py-3 text-sm leading-relaxed text-white shadow-md">
                {query}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/10 bg-white/72 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                Try an example
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => void onSearch(example)}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-left text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              AFA
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 shadow-sm">
              {isRunning ? "Live" : logs.length > 0 ? "Ready" : "Waiting"}
            </span>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-xl rounded-tl-md border border-black/8 bg-white px-4 py-4 text-sm leading-relaxed text-stone-500 shadow-sm">
                Updates will appear here.
              </div>
            ) : (
              logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
            )}
            <div ref={logAnchorRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-black/6 bg-white/70 px-4 py-4">
        <ChatInput
          disabled={isRunning}
          defaultQuery={query}
          language={language}
          onLanguageChange={onLanguageChange}
          onSubmit={onSearch}
        />
      </div>
    </aside>
  );
}
