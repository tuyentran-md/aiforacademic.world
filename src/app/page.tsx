import Link from "next/link";
import Footer from "@/components/Footer";

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
                AI · Research · Medicine
              </p>
              <h1
                className="font-serif font-bold text-stone-900 leading-[1.08] mb-5"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
              >
                AI tools for
                <br />
                clinicians who publish.
              </h1>
              <p className="text-[16px] text-stone-600 leading-relaxed max-w-xl">
                A small product studio by a surgeon —{" "}
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
                href="https://ric.tuyentranmd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid"
                style={{ backgroundColor: "#C6D2DC" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">RIC&thinsp;↗</p>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#B0C2CC", color: "#1a3040" }}
                  >
                    Live · Free
                  </span>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  Research Integrity Check
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  AI detection, citation integrity, plagiarism scan, and peer review simulation — before you submit.
                </p>
              </a>

              {/* Med Translate */}
              <a
                href="https://translate.tuyentranmd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid"
                style={{ backgroundColor: "#C6DCD2" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">Med Translate&thinsp;↗</p>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#B0CCC2", color: "#1a402f" }}
                  >
                    Beta
                  </span>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  Medical Translation
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Preserves statistical constructs and surgical terminology across languages.
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
                  Automated Variable Reviewer
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Systematic variable extraction and validation for clinical datasets.
                </p>
              </Link>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
