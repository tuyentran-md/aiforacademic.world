"use client";

/**
 * ToolShell — canonical 2-column layout for every /tools/* page.
 *
 *   ┌───────── header (title + subtitle) ──────────┐
 *   │ [optional sub-tab strip]                     │
 *   ├──────────────┬───────────────────────────────┤
 *   │ INPUT (left) │ OUTPUT (right · artifact)     │
 *   │  textarea    │  ArtifactRenderer / loading / │
 *   │  uploader    │  empty-state                  │
 *   │  primary CTA │                               │
 *   │  inline err  │                               │
 *   └──────────────┴───────────────────────────────┘
 *
 * On desktop ≥1024px: side-by-side. On mobile: stacked input on top.
 */

import React from "react";

export type SubTab = { id: string; label: string };

export type ToolShellProps = {
  title: string;
  subtitle?: string;
  tabs?: SubTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  input: React.ReactNode;
  output: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    loadingLabel?: string;
  };
  secondaryActions?: React.ReactNode;
  error?: string | null;
  warning?: string | null;
  // optional pure JSX header slot (e.g. extra meta), shown next to title
  headerSlot?: React.ReactNode;
};

export function ToolShell({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  input,
  output,
  primaryAction,
  secondaryActions,
  error,
  warning,
  headerSlot,
}: ToolShellProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-stone-900 text-2xl md:text-[28px] leading-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-stone-500 leading-relaxed max-w-2xl">{subtitle}</p>
          ) : null}
        </div>
        {headerSlot}
      </div>

      {/* Sub-tab strip */}
      {tabs && tabs.length > 0 ? (
        <div className="flex flex-wrap gap-1 rounded-full border border-black/[0.06] bg-white/60 p-1 w-fit">
          {tabs.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange?.(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Two-column body */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {/* LEFT — input */}
        <div className="rounded-2xl border border-black/[0.07] bg-white/70 p-5 md:p-6 flex flex-col">
          <div className="flex-1">{input}</div>

          {/* Inline action area */}
          {(primaryAction || secondaryActions || error || warning) && (
            <div className="mt-5 space-y-3">
              {warning ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {warning}
                </div>
              ) : null}
              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {error}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {primaryAction ? (
                  <button
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#C4634E" }}
                  >
                    {primaryAction.loading
                      ? primaryAction.loadingLabel ?? `${primaryAction.label}…`
                      : primaryAction.label}
                  </button>
                ) : null}
                {secondaryActions}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — output / artifact */}
        <div className="rounded-2xl border border-black/[0.07] bg-[#FAF7F1] p-5 md:p-6 min-h-[480px] flex flex-col">
          <div className="flex-1">{output}</div>
        </div>
      </div>
    </div>
  );
}

/** Empty placeholder — show in the output column before any result exists. */
export function ToolEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-stone-900 mb-1">{title}</p>
      <p className="text-xs text-stone-500 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}

/** Loading placeholder — show in output column while waiting. */
export function ToolLoadingState({ label }: { label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10">
      <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-[#C4634E] animate-spin mb-3" />
      <p className="text-sm font-medium text-stone-700">{label}</p>
    </div>
  );
}
