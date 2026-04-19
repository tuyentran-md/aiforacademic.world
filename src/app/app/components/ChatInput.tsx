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

  return (
    <div className="rounded-[28px] border border-black/10 bg-white/90 p-3 shadow-[0_20px_40px_rgba(17,17,16,0.06)] backdrop-blur">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
          }
        }}
        rows={4}
        placeholder={disabled ? "Pipeline running..." : "Ask a research question or describe the paper you want to draft"}
        className="min-h-[112px] w-full resize-none rounded-2xl border border-black/8 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-300"
        disabled={disabled}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-black/10 bg-stone-100 p-1 text-xs font-medium text-stone-600">
          {(["EN", "VI"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onLanguageChange(option)}
              className={`rounded-full px-3 py-1 transition ${
                language === option ? "bg-white text-stone-900 shadow-sm" : "opacity-70"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={disabled}
          className="inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
