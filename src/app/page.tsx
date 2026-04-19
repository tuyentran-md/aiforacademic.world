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
