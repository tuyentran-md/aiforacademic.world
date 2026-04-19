"use client";

import { useEffect, useState } from "react";

interface ChatInputProps {
  disabled: boolean;
  defaultQuery: string;
  language: "EN" | "VI";
  onLanguageChange: (language: "EN" | "VI") => void;
  onSubmit: (query: string) => Promise<void>;
}

export function ChatInput({
  disabled,
  defaultQuery,
  language,
  onLanguageChange,
  onSubmit,
}: ChatInputProps) {
  const [value, setValue] = useState(defaultQuery);

  useEffect(() => {
    setValue(defaultQuery);
  }, [defaultQuery]);

  async function handleSubmit() {
    const nextValue = value.trim();
    if (!nextValue || disabled) {
      return;
    }

    await onSubmit(nextValue);
  }

  if (disabled && defaultQuery.trim()) {
    return (
      <div className="rounded-xl border border-black/8 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            Current query
          </p>
          <span className="rounded-full bg-[#C4634E]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C4634E]">
            Working
          </span>
        </div>
        <p className="mt-3 rounded-lg border border-black/8 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-700">
          {defaultQuery}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/8 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Message</p>
        <div className="inline-flex rounded-full border border-black/10 bg-stone-100 p-1 text-[11px] font-medium text-stone-600">
          {(["EN", "VI"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onLanguageChange(option)}
              className={`rounded-full px-3 py-1 transition ${
                language === option ? "bg-stone-900 text-white shadow-sm" : "opacity-70"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
          }
        }}
        rows={2}
        placeholder="What's your research question?"
        className="min-h-[72px] w-full resize-none rounded-lg border border-black/8 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-800 outline-none transition focus:border-stone-300"
        disabled={disabled}
      />

      <div className="mt-3 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={disabled}
          className="inline-flex items-center rounded-lg bg-[#C4634E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b45743] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? "Working..." : "Send"}
        </button>
      </div>
    </div>
  );
}
