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

const TOOL_LINKS = [
  { href: "/app", label: "Pipeline", active: true },
  { href: "/ric", label: "RIC" },
  { href: "/trans", label: "Translator" },
  { href: "/srma", label: "SRMA" },
];

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
    <aside className="flex h-full min-h-[420px] flex-col rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,236,0.96))] p-3 shadow-[0_20px_48px_rgba(17,17,16,0.08)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            AFA Workspace
          </p>
          <h1 className="mt-2 font-serif text-[1.7rem] font-bold leading-tight text-stone-900">
            Research pipeline
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            One prompt in, three outputs out.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-stone-600 transition hover:bg-white"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 rounded-[24px] border border-black/8 bg-white/84 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          Tools
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TOOL_LINKS.map((tool) => (
            <Link
              key={tool.label}
              href={tool.href}
              className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                tool.active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-black/10 bg-stone-50 text-stone-600 hover:bg-white"
              }`}
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <ChatInput
          disabled={isRunning}
          defaultQuery={query}
          language={language}
          onLanguageChange={onLanguageChange}
          onSubmit={onSearch}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-black/8 bg-white/76 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              Activity
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {isRunning ? "AFA is working..." : logs.length > 0 ? "Latest run" : "Waiting"}
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {isRunning ? "Live" : "Idle"}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-2.5">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-4 text-sm leading-relaxed text-stone-500">
                Ask a question above. Search, draft, and check events will stream here.
              </div>
            ) : (
              logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
            )}
            <div ref={logAnchorRef} />
          </div>
        </div>
      </div>
    </aside>
  );
}
