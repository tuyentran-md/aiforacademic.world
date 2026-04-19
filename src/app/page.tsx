import Link from "next/link";
import Footer from "@/components/Footer";
import EmailCapture from "@/components/EmailCapture";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative">
      <div className="relative z-10">

        {/* ─── HERO ────────────────────────────────────────── */}
        <section className="pt-12 pb-6 md:pt-20 md:pb-8">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">
                AI · Research · Academic
              </p>
              <h1
                className="font-serif font-bold text-stone-900 leading-[1.08] mb-5"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
              >
                AI tools for
                <br />
                academic works.
              </h1>
              <p className="text-[16px] text-stone-600 leading-relaxed max-w-xl">
                A small product studio —{" "}
                <Link href="/about" className="text-stone-800 underline underline-offset-3 hover:text-stone-900 transition-colors">
                  more on the About page
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <Link
              href="/app"
              className="block overflow-hidden rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,#171717,#2d2a28_55%,#4b342c)] px-7 py-7 text-white shadow-[0_24px_60px_rgba(17,17,16,0.22)] transition hover:opacity-95"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-300">
                New • Pipeline demo
              </p>
              <div className="mt-4 grid gap-5 md:grid-cols-[1.2fr_0.8fr] md:items-end">
                <div>
                  <h2 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
                    From question to draft
                    <br />
                    in one workflow.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300">
                    Search literature, generate a manuscript scaffold, then run an integrity check
                    without leaving the workspace.
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-stone-300 md:justify-items-end">
                  <span>01 Search &amp; Translate</span>
                  <span>02 AVR Drafting</span>
                  <span>03 RIC Audit</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ─── TOOLS ───────────────────────────────────────── */}
        <section className="pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-6">
              Tools
            </p>
            <div className="grid md:grid-cols-3 gap-4">

              {/* RIC */}
              <a
                href="/ric"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid"
                style={{ backgroundColor: "#C6D2DC" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">RIC&thinsp;↗</p>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  Research Integrity Check
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  AI detection, citation integrity, plagiarism scan, and peer review simulation — before you submit.
                </p>
              </a>

              {/* Translator */}
              <a
                href="/trans"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid"
                style={{ backgroundColor: "#C6DCD2" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">Translator&thinsp;↗</p>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  Context-aware academic translation
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Translates any academic text across languages while preserving technical terms, statistics, and domain vocabulary.
                </p>
              </a>

              {/* SRMA */}
              <a
                href="/srma"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid"
                style={{ backgroundColor: "#F5E6D8" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">SRMA&thinsp;↗</p>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  Systematic Review Automation
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  AI-powered pipeline that automates deduplication and abstract screening with human-in-the-loop control.
                </p>
              </a>

              {/* AVR */}
              <Link
                href="/products#avr"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid"
                style={{ backgroundColor: "#DDD4EC" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">AVR →</p>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#D0C8E0", color: "#3a2860" }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  AI for Vietnamese Research
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  A research formation system for Vietnamese clinicians: idea → blueprint → validated abstract → submission gate → manuscript outline.
                </p>
              </Link>

            </div>
          </div>
        </section>

        {/* ─── LEAD MAGNET ─────────────────────────────── */}
        <EmailCapture />

        <Footer />
      </div>
    </div>
  );
}
