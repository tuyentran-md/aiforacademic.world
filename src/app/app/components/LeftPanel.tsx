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
            From question to first draft
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
            Describe the topic you want to write about, review the papers we find, then let the
            app build and audit a first manuscript scaffold.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-white"
        >
          Reset
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-700">
        <span className="rounded-full bg-stone-900 px-3 py-1 text-white shadow-sm">
          Drafting flow
        </span>
        <Link
          href="/srma"
          className="rounded-full border border-black/10 bg-white/80 px-3 py-1 opacity-80 transition hover:opacity-100"
        >
          Open SRMA tool
        </Link>
      </div>

      <div className="mb-4 rounded-[28px] border border-black/8 bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
          How this works
        </p>
        <div className="mt-3 space-y-3">
          {[
            "1. Describe the evidence you need in English or Vietnamese.",
            "2. Review the paper shortlist and keep the useful ones.",
            "3. Generate a first draft, then run the integrity audit.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-black/6 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-600"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <ChatInput
          disabled={isRunning}
          defaultQuery={query}
          language={language}
          onLanguageChange={onLanguageChange}
          onSubmit={onSearch}
        />
      </div>

      <div className="flex-1 overflow-y-auto rounded-[28px] border border-black/8 bg-white/70 p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Live activity
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Search, translation, drafting, and audit events stream here as the workflow runs.
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {isRunning ? "Running" : logs.length > 0 ? "Latest run" : "Idle"}
          </span>
        </div>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-5 text-sm leading-relaxed text-stone-500">
              Start by describing your topic above. Once the workflow begins, each search,
              translation, drafting, and audit event will appear here in order.
            </div>
          ) : (
            logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
          )}
          <div ref={logAnchorRef} />
        </div>
      </div>
    </aside>
  );
}
