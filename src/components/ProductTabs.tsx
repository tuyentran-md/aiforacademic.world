"use client";

import { useEffect, useState } from "react";

// ── Tab data ──────────────────────────────────────────────────────────────────

const TABS = [
  {
    key: "ric",
    label: "RIC",
    colors: {
      bg: "#CDE2F0",
      text: "#1A2E44",
      activeBg: "#1A2E44",
      activeText: "#E8E4DC",
    },
  },
  {
    key: "research",
    label: "Research",
    colors: {
      bg: "#F0E6D3",
      text: "#3D2000",
      activeBg: "#C4634E",
      activeText: "#FFF8F4",
    },
  },
  {
    key: "translator",
    label: "Translator",
    colors: {
      bg: "#CDE0D7",
      text: "#1A402F",
      activeBg: "#1A402F",
      activeText: "#E8EDE4",
    },
  },
  {
    key: "avr",
    label: "AVR",
    colors: {
      bg: "#DCD7E6",
      text: "#3A2860",
      activeBg: "#3A2860",
      activeText: "#F0EDF5",
    },
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── RIC panel ─────────────────────────────────────────────────────────────────

function RICPanel() {
  const features = [
    {
      icon: "🔍",
      title: "AI Detection",
      desc: "Detects AI-generated text using multiple models. Gives a probability score and highlights suspect passages.",
    },
    {
      icon: "📑",
      title: "Citation Integrity",
      desc: "Verifies that your citations exist, are relevant, and haven't been fabricated by AI hallucination.",
    },
    {
      icon: "📋",
      title: "Plagiarism Scan",
      desc: "Cross-references your manuscript against published literature for unattributed overlap.",
    },
    {
      icon: "🧑‍⚖️",
      title: "Peer Review Simulation",
      desc: "Runs a structured peer-review pass on your manuscript — methodological critique, clarity, gap analysis.",
    },
  ];

  return (
    <div id="ric" className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-6 md:px-8">

        {/* Hero card */}
        <div
          className="rounded-2xl p-7 md:p-10 mb-8 no-grid"
          style={{ backgroundColor: "#C6D2DC" }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl font-bold text-stone-900">RIC</span>
              </div>
              <p className="text-base font-semibold text-stone-800 mb-2">
                Research Integrity Check
              </p>
              <p className="text-[15px] text-stone-600 leading-relaxed max-w-lg">
                An AI-powered manuscript integrity checker for researchers who want to verify their work before journal submission. Catches AI-generated text, citation hallucinations, and plagiarism — then simulates a peer review.
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href="/ric"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85 no-grid"
                style={{ backgroundColor: "#1a2e44", color: "#e8e4dc" }}
              >
                Open RIC&thinsp;↗
              </a>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 no-grid"
              style={{ backgroundColor: "#EDE8DF" }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="text-sm font-semibold text-stone-900 mb-1.5">{f.title}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Research panel ───────────────────────────────────────────────────────────

function ResearchPanel() {
  const features = [
    {
      title: "PubMed + OpenAlex",
      desc: "Searches both PubMed and OpenAlex simultaneously — giving you broader coverage than either database alone, with citation counts and relevance scoring.",
    },
    {
      title: "AI-ranked results",
      desc: "Results are ranked by an LLM for relevance to your specific research question, not just keyword match. The most useful papers rise to the top.",
    },
    {
      title: "Abstract translation",
      desc: "Translate any abstract to Vietnamese instantly. Preserves statistical terminology, p-values, and clinical vocabulary that general translators mangle.",
    },
    {
      title: "One-click to Draft",
      desc: "Select the references you want to cite, then click \"Draft manuscript\" — the AVR pipeline turns them into a structured manuscript outline immediately.",
    },
  ];

  return (
    <div id="research" className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-6 md:px-8">

        {/* Hero card */}
        <div
          className="rounded-2xl p-7 md:p-10 mb-8 no-grid"
          style={{ backgroundColor: "#F5DDD4" }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl font-bold" style={{ color: "#3D2000" }}>Research</span>
              </div>
              <p className="text-base font-semibold mb-2" style={{ color: "#3D2000" }}>
                Literature Search &amp; Reference Manager
              </p>
              <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: "#7A3A1E" }}>
                AI-powered literature search across PubMed and OpenAlex. Find, rank, and translate
                relevant papers for your research question — then draft a manuscript directly from
                your selected references.
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href="/app"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85 no-grid"
                style={{ backgroundColor: "#C4634E", color: "#fff8f4" }}
              >
                Open Workspace&thinsp;→
              </a>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 no-grid"
              style={{ backgroundColor: "#EDE8DF" }}
            >
              <p className="text-sm font-semibold text-stone-900 mb-1.5">{f.title}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Workflow hint */}
        <div
          className="mt-6 rounded-2xl px-6 py-5 no-grid"
          style={{ backgroundColor: "#F0E6D3" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: "#C4634E" }}>
            Workflow
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "#3D2000" }}>
            <span className="px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#C4634E", color: "#fff8f4" }}>Search</span>
            <span style={{ color: "#C4634E" }}>→</span>
            <span className="px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#E8D0BC" }}>Select references</span>
            <span style={{ color: "#C4634E" }}>→</span>
            <span className="px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#E8D0BC" }}>Draft manuscript</span>
            <span style={{ color: "#C4634E" }}>→</span>
            <span className="px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#E8D0BC" }}>Check integrity</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Translator panel ──────────────────────────────────────────────────────────

function TranslatorPanel() {
  const features = [
    {
      icon: "🧠",
      title: "Context-aware",
      desc: "Preserves statistics, technical terminology, and domain vocabulary that general-purpose translators mangle.",
    },
    {
      icon: "📊",
      title: "Stats & data intact",
      desc: "p-values, confidence intervals, units, and numerical data are kept unchanged and correctly expressed in the target language.",
    },
    {
      icon: "🌐",
      title: "Any academic domain",
      desc: "Works for medical, legal, scientific, engineering, and humanities texts — not limited to medicine.",
    },
    {
      icon: "🌏",
      title: "Built for non-English researchers",
      desc: "Designed for researchers who read or publish across languages without institutional translation support.",
    },
  ];

  return (
    <div id="translator" className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-6 md:px-8">

        {/* Hero card */}
        <div
          className="rounded-2xl p-7 md:p-10 mb-8 no-grid"
          style={{ backgroundColor: "#C6DCD2" }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl font-bold text-stone-900">Translator</span>
              </div>
              <p className="text-base font-semibold text-stone-800 mb-2">
                Context-aware academic translation
              </p>
              <p className="text-[15px] text-stone-600 leading-relaxed max-w-lg">
                Translates any academic text across languages while preserving technical terms, statistics, and domain vocabulary. Unlike generic translation tools, Translator understands what must not be paraphrased.
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href="/trans"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85 no-grid"
                style={{ backgroundColor: "#1a402f", color: "#e8ede4" }}
              >
                Open Translator&thinsp;↗
              </a>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 no-grid"
              style={{ backgroundColor: "#EDE8DF" }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="text-sm font-semibold text-stone-900 mb-1.5">{f.title}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AVR panel (coming soon) ───────────────────────────────────────────────────

function AVRPanel() {
  return (
    <div id="avr" className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl font-bold text-stone-900">AVR</span>
            <span
              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#D0C8E0", color: "#3a2860" }}
            >
              Coming Soon
            </span>
          </div>
          <p className="text-base font-semibold text-stone-800 mb-3">
            AI for Vietnamese Research
          </p>
          <p className="text-[15px] text-stone-600 leading-relaxed mb-4">
            A research formation system for Vietnamese clinicians. Guides a researcher from a raw idea to a submission-ready manuscript outline.
          </p>
          <p className="text-xs text-stone-400">
            Follow updates on the{" "}
            <a
              href="https://tuyentranmd.com/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-stone-600 transition-colors"
            >
              blog
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductTabs() {
  const [active, setActive] = useState<TabKey>("ric");

  // Activate tab from URL hash (e.g. /products#avr)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "avr" || hash === "translator" || hash === "ric" || hash === "research") {
      setActive(hash as TabKey);
    }
  }, []);

  return (
    <div>
      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div
        className="border-y no-grid"
        style={{
          backgroundColor: "#F5F1EA",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <nav className="flex justify-center gap-4 py-3">
            {TABS.map((tab) => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all
                    ${isActive ? "opacity-100" : "opacity-50 hover:opacity-75"}
                  `}
                  style={{
                    backgroundColor: tab.colors.activeBg,
                    color: tab.colors.activeText,
                    // Use box-shadow for a subtle active indicator instead of changing colors
                    boxShadow: isActive
                      ? `0 0 0 2px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.2)`
                      : "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {tab.label}
                  {tab.key === "avr" && (
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Panel ───────────────────────────────────────────── */}
      {active === "ric" && <RICPanel />}
      {active === "research" && <ResearchPanel />}
      {active === "translator" && <TranslatorPanel />}
      {active === "avr" && <AVRPanel />}
    </div>
  );
}
