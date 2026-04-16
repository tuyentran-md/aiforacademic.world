"use client";

import { useState } from "react";

// ── Tab data ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: "ric", label: "RIC" },
  { key: "med-translate", label: "Med Translate" },
  { key: "avr", label: "AVR" },
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
                <span
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#B0C2CC", color: "#1a3040" }}
                >
                  Live · Free tier
                </span>
              </div>
              <p className="text-base font-semibold text-stone-800 mb-2">
                Research Integrity Check
              </p>
              <p className="text-[15px] text-stone-600 leading-relaxed max-w-lg">
                An AI-powered manuscript integrity checker built for clinicians who need to verify their research before journal submission. Catches AI-generated text, citation hallucinations, and plagiarism — then simulates a peer review.
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href="https://check.aiforacademic.world"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85 no-grid"
                style={{ backgroundColor: "#1a2e44", color: "#e8e4dc" }}
              >
                Open RIC&thinsp;↗
              </a>
              <p className="text-xs text-stone-500 text-center">Free to use · No sign-up required</p>
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

        {/* Who it's for */}
        <div className="mt-8 rounded-2xl p-6 md:p-8 no-grid" style={{ backgroundColor: "#F0EDE8" }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Who it&apos;s for
          </p>
          <p className="text-[15px] text-stone-700 leading-relaxed">
            Clinical researchers, residents, and surgeons in resource-limited settings who submit to indexed journals but don&apos;t have access to institutional integrity-checking tools. Previously hosted at{" "}
            <a
              href="https://ric.tuyentranmd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-stone-800 hover:text-stone-900 transition-colors"
            >
              ric.tuyentranmd.com
            </a>
            {" "}— now at{" "}
            <a
              href="https://check.aiforacademic.world"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-stone-800 hover:text-stone-900 transition-colors"
            >
              check.aiforacademic.world
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Med Translate panel ───────────────────────────────────────────────────────

function MedTranslatePanel() {
  const features = [
    {
      icon: "🩺",
      title: "Clinical-grade vocabulary",
      desc: "Preserves statistical constructs, drug names, ICD codes, and anatomical terminology that general-purpose translators mangle.",
    },
    {
      icon: "📊",
      title: "Stats-aware translation",
      desc: "Keeps p-values, confidence intervals, odds ratios, and trial-specific jargon intact and correctly expressed in the target language.",
    },
    {
      icon: "🔬",
      title: "Surgical terminology",
      desc: "Trained on operative notes, surgical atlases, and peer-reviewed surgical literature for accurate technical terms.",
    },
    {
      icon: "🌏",
      title: "Built for resource-limited settings",
      desc: "Designed for clinicians in developing countries who need to read or translate clinical literature without institutional support.",
    },
  ];

  return (
    <div id="med-translate" className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-6 md:px-8">

        {/* Hero card */}
        <div
          className="rounded-2xl p-7 md:p-10 mb-8 no-grid"
          style={{ backgroundColor: "#C6DCD2" }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl font-bold text-stone-900">Med Translate</span>
                <span
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#B0CCC2", color: "#1a402f" }}
                >
                  Beta
                </span>
              </div>
              <p className="text-base font-semibold text-stone-800 mb-2">
                Medical Translation
              </p>
              <p className="text-[15px] text-stone-600 leading-relaxed max-w-lg">
                Medical translation tuned specifically for clinical literature. Unlike generic translation tools, Med Translate understands what must not be paraphrased — statistical language, drug names, surgical procedures.
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href="https://translate.tuyentranmd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85 no-grid"
                style={{ backgroundColor: "#1a402f", color: "#e8ede4" }}
              >
                Open Med Translate&thinsp;↗
              </a>
              <p className="text-xs text-stone-500 text-center">Beta · Pay per use (VND)</p>
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
        <div
          className="rounded-2xl p-7 md:p-12 no-grid"
          style={{ backgroundColor: "#DDD4EC" }}
        >
          <div className="max-w-xl">
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
              Automated Variable Reviewer
            </p>
            <p className="text-[15px] text-stone-600 leading-relaxed mb-4">
              AVR is a tool for systematic variable extraction and validation from clinical datasets. It will help researchers define, audit, and document their variables — catching inconsistencies before analysis.
            </p>
            <p className="text-[15px] text-stone-600 leading-relaxed mb-6">
              Designed for observational studies, retrospective analyses, and registry data where variable definitions are often underdocumented.
            </p>

            <div className="rounded-xl p-5 no-grid" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Planned features
              </p>
              <ul className="space-y-2 text-sm text-stone-700">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-stone-400">—</span>
                  <span>Variable dictionary builder from clinical records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-stone-400">—</span>
                  <span>Automated consistency checks across dataset columns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-stone-400">—</span>
                  <span>STROBE / CONSORT variable documentation export</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-stone-400">—</span>
                  <span>Integration with R and Python analysis workflows</span>
                </li>
              </ul>
            </div>

            <p className="mt-6 text-xs text-stone-400">
              Follow updates on the{" "}
              <a href="/blog" className="underline underline-offset-2 hover:text-stone-600 transition-colors">
                blog
              </a>
              {" "}or via{" "}
              <a
                href="https://tuyentranmd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-stone-600 transition-colors"
              >
                tuyentranmd.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductTabs() {
  const [active, setActive] = useState<TabKey>("ric");

  return (
    <div>
      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div
        className="sticky top-14 z-20 border-b no-grid"
        style={{
          backgroundColor: "rgba(245,241,234,0.95)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <nav className="flex gap-1 py-2">
            {TABS.map((tab) => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`
                    flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                    ${isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"}
                  `}
                >
                  {tab.label}
                  {tab.key === "avr" && (
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#D0C8E0",
                        color: isActive ? "rgba(255,255,255,0.8)" : "#3a2860",
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
      {active === "med-translate" && <MedTranslatePanel />}
      {active === "avr" && <AVRPanel />}
    </div>
  );
}
