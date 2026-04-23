"use client";

import { useLang } from "@/context/LangContext";
import type { Lang } from "@/lib/i18n";

export default function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div className={`inline-flex rounded-full border border-black/10 bg-stone-100 p-0.5 ${className}`}>
      {(["VI", "EN"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
            lang === l
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-400 hover:text-stone-700"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
