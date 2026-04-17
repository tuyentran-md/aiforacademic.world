import type { Metadata } from "next";
import Link from "next/link";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "SRMA — Systematic Review & Meta-Analysis Automation",
  description:
    "AI-powered pipeline that automates deduplication and title/abstract screening for systematic reviews — with human-in-the-loop control.",
};

// ── Colors ────────────────────────────────────────────────────────────────────

const PEACH = {
  card: "#F5E6D8",
  darker: "#E8D0BC",
  text: "#3d1e0a",
  accent: "#8B4513",
  accentText: "#fff8f4",
};

// ── Feature cards ─────────────────────────────────────────────────────────────

const features = [
  {
    title: "Deduplicate",
    desc: "DOI-exact plus title-fuzzy matching removes duplicate records automatically. Merge exports from PubMed, Scopus, and Embase into a single de-duplicated set.",
  },
  {
    title: "Screen with AI",
    desc: "Claude screens records against your PICO criteria. Batch processing with per-record confidence scores and include/exclude decisions ready for your review.",
  },
  {
    title: "PRISMA Report",
    desc: "Auto-generates a PRISMA 2020-compliant flow report — record counts at each stage — ready to paste directly into your paper.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SRMAPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdf8f5" }}>

      {/* ── Header strip ──────────────────────────────────────── */}
      <div
        className="border-b"
        style={{
          backgroundColor: PEACH.darker,
          borderColor: "rgba(61,30,10,0.12)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8 h-11 flex items-center justify-between gap-6">

          {/* Home link */}
          <Link
            href="/"
            className="text-sm font-medium transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: PEACH.text }}
          >
            &larr; AI for Academic
          </Link>

          {/* Tool switcher */}
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/ric"
              className="px-3 py-1 rounded-full transition-colors hover:opacity-80"
              style={{ color: PEACH.text, opacity: 0.6 }}
            >
              RIC
            </Link>
            <span style={{ color: PEACH.text, opacity: 0.3 }}>&middot;</span>
            <Link
              href="/trans"
              className="px-3 py-1 rounded-full transition-colors hover:opacity-80"
              style={{ color: PEACH.text, opacity: 0.6 }}
            >
              Trans
            </Link>
            <span style={{ color: PEACH.text, opacity: 0.3 }}>&middot;</span>
            <span
              className="px-3 py-1 rounded-full font-semibold"
              style={{ backgroundColor: PEACH.accent, color: PEACH.accentText }}
            >
              SRMA
            </span>
          </nav>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="max-w-2xl">
            <h1
              className="font-serif font-bold leading-[1.08] mb-4"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 4.5rem)",
                color: PEACH.text,
              }}
            >
              SRMA
            </h1>
            <p
              className="text-lg font-semibold mb-3"
              style={{ color: PEACH.accent }}
            >
              Systematic Review &amp; Meta-Analysis Automation
            </p>
            <p
              className="text-[16px] leading-relaxed max-w-xl"
              style={{ color: "#6b3a1f" }}
            >
              AI-powered pipeline that automates deduplication and title/abstract
              screening for systematic reviews &mdash; with human-in-the-loop control.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────── */}
      <section className="pb-14">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{ backgroundColor: PEACH.card }}
              >
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: PEACH.text }}
                >
                  {f.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b3a1f" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install section ───────────────────────────────────── */}
      <section className="pb-14">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div
            className="rounded-2xl p-7 md:p-10"
            style={{ backgroundColor: PEACH.darker }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em] mb-5"
              style={{ color: PEACH.accent }}
            >
              Install
            </p>

            {/* Code block */}
            <div
              className="rounded-xl px-5 py-4 mb-4 font-mono text-sm overflow-x-auto"
              style={{ backgroundColor: "#2d1206", color: "#fde8d8" }}
            >
              pip install sr-pipeline
            </div>

            <p className="text-xs" style={{ color: "#8a5030" }}>
              Requires Python 3.10+&thinsp;&middot;&thinsp;Claude API key
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-7">
              <a
                href="https://github.com/tuyentran-md/sr-pipeline"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85"
                style={{ backgroundColor: PEACH.accent, color: PEACH.accentText }}
              >
                View on GitHub&thinsp;&rarr;
              </a>
              <a
                href="https://github.com/tuyentran-md/sr-pipeline#quickstart"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: "transparent",
                  color: PEACH.accent,
                  border: `1.5px solid ${PEACH.accent}`,
                }}
              >
                Read Docs&thinsp;&rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer strip ──────────────────────────────────────── */}
      <footer
        className="border-t py-6"
        style={{
          backgroundColor: PEACH.darker,
          borderColor: "rgba(61,30,10,0.12)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <a
            href="https://aiforacademic.world"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: PEACH.text }}
          >
            aiforacademic.world
          </a>
          <Link
            href="/ric"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: PEACH.text, opacity: 0.65 }}
          >
            RIC
          </Link>
          <Link
            href="/trans"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: PEACH.text, opacity: 0.65 }}
          >
            Translator
          </Link>
        </div>
      </footer>

    </div>
  );
}
