import Link from "next/link";
import Footer from "@/components/Footer";
import EmailCapture from "@/components/EmailCapture";

export default function Home() {
  return (
    <div className="relative">
      <div className="relative z-10">
        <section className="pt-12 pb-6 md:pt-20 md:pb-8">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
                AI · Research · Academic
              </p>
              <h1
                className="mb-5 font-serif font-bold leading-[1.08] text-stone-900"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
              >
                AI tools for
                <br />
                academic works.
              </h1>
              <p className="max-w-xl text-[16px] leading-relaxed text-stone-600">
                A small product studio{" "}
                <Link
                  href="/about"
                  className="text-stone-800 underline underline-offset-3 transition-colors hover:text-stone-900"
                >
                  more on the About page
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Tools
            </p>

            <div className="mb-4">
              <Link
                href="/app"
                className="block rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-8 text-white transition-opacity hover:opacity-95"
              >
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-400">
                  New
                </p>
                <p className="mb-2 text-2xl font-serif font-bold">
                  From question to manuscript in minutes
                </p>
                <p className="text-sm text-stone-400">
                  Search literature → Generate draft → Check integrity — powered by AI.
                </p>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="/ric"
                target="_blank"
                rel="noopener noreferrer"
                className="no-grid block rounded-2xl p-6 transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#C6D2DC" }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-stone-900">RIC&thinsp;↗</p>
                </div>
                <p className="mb-1 text-sm font-medium text-stone-700">
                  Research Integrity Check
                </p>
                <p className="text-sm leading-relaxed text-stone-600">
                  AI detection, citation integrity, plagiarism scan, and peer review simulation
                  before you submit.
                </p>
              </a>

              <a
                href="/trans"
                className="no-grid block rounded-2xl p-6 transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#C6DCD2" }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-stone-900">Translator&thinsp;↗</p>
                </div>
                <p className="mb-1 text-sm font-medium text-stone-700">
                  Context-aware academic translation
                </p>
                <p className="text-sm leading-relaxed text-stone-600">
                  Translates any academic text across languages while preserving technical terms,
                  statistics, and domain vocabulary.
                </p>
              </a>

              <a
                href="/srma"
                className="no-grid block rounded-2xl p-6 transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#F5E6D8" }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-stone-900">SRMA&thinsp;↗</p>
                </div>
                <p className="mb-1 text-sm font-medium text-stone-700">
                  Systematic Review Automation
                </p>
                <p className="text-sm leading-relaxed text-stone-600">
                  AI-powered pipeline that automates deduplication and abstract screening with
                  human-in-the-loop control.
                </p>
              </a>

              <Link
                href="/products#avr"
                className="no-grid block rounded-2xl p-6 transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#DDD4EC" }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-stone-900">AVR →</p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: "#D0C8E0", color: "#3a2860" }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className="mb-1 text-sm font-medium text-stone-700">
                  AI for Vietnamese Research
                </p>
                <p className="text-sm leading-relaxed text-stone-600">
                  A research formation system for Vietnamese clinicians: idea → blueprint →
                  validated abstract → submission gate → manuscript outline.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <EmailCapture />
        <Footer />
      </div>
    </div>
  );
}
