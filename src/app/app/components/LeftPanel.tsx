"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { LogEntry as LogEntryType } from "@/lib/pipeline/types";
import { ChatInput } from "./ChatInput";
import { LogEntry } from "./LogEntry";

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
    <aside className="flex h-full min-h-[420px] flex-col rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,243,236,0.96))] p-4 shadow-[0_24px_60px_rgba(17,17,16,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            AFA Pipeline
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-stone-900">
            Research drafting workspace
          </h1>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-white"
        >
          Reset
        </button>
      </div>

      <div className="mb-4 inline-flex w-fit rounded-full border border-black/10 bg-stone-100 p-1 text-xs font-medium text-stone-700">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Pipeline</span>
        <Link href="/srma" className="rounded-full px-3 py-1 opacity-70 transition hover:opacity-100">
          SRMA
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto rounded-[28px] border border-black/8 bg-white/70 p-3">
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-5 text-sm leading-relaxed text-stone-500">
              Agent logs will appear here while the pipeline runs. Search, drafting, translation,
              and audit events stream into this panel in real time.
            </div>
          ) : (
            logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
          )}
          <div ref={logAnchorRef} />
        </div>
      </div>

      <div className="mt-4">
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
