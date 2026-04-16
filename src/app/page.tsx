import Link from "next/link";
import Footer from "@/components/Footer";

// ── SVG Illustrations ──────────────────────────────────────────────────────────

function RICIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Document */}
      <rect x="22" y="14" width="58" height="76" rx="5" stroke="#1a1a18" strokeWidth="2.5" fill="none"/>
      <rect x="30" y="22" width="42" height="7" rx="2" fill="#1a1a18" fillOpacity="0.12" stroke="#1a1a18" strokeWidth="1.8"/>
      <line x1="32" y1="40" x2="68" y2="40" stroke="#1a1a18" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="50" x2="60" y2="50" stroke="#1a1a18" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="60" x2="64" y2="60" stroke="#1a1a18" strokeWidth="2" strokeLinecap="round"/>
      {/* Checkmark badge */}
      <circle cx="82" cy="86" r="18" fill="#C4634E" stroke="#1a1a18" strokeWidth="2.2"/>
      <polyline points="73,86 79,93 92,77" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function TranslateIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Globe */}
      <circle cx="60" cy="60" r="36" stroke="#1a1a18" strokeWidth="2.5" fill="none"/>
      <ellipse cx="60" cy="60" rx="16" ry="36" stroke="#1a1a18" strokeWidth="1.8" fill="none"/>
      <line x1="24" y1="60" x2="96" y2="60" stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="28" y1="44" x2="92" y2="44" stroke="#1a1a18" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="28" y1="76" x2="92" y2="76" stroke="#1a1a18" strokeWidth="1.4" strokeLinecap="round"/>
      {/* Arrow */}
      <path d="M46 60 L74 60" stroke="#C4634E" strokeWidth="2.5" strokeLinecap="round"/>
      <polyline points="67,53 74,60 67,67" stroke="#C4634E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function BlogIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="24" y="18" width="60" height="78" rx="5" stroke="#1a1a18" strokeWidth="2.5" fill="none"/>
      <line x1="34" y1="38" x2="74" y2="38" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="34" y1="50" x2="74" y2="50" stroke="#1a1a18" strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="34" y1="60" x2="74" y2="60" stroke="#1a1a18" strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="34" y1="70" x2="58" y2="70" stroke="#1a1a18" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M68 78 L88 56 L96 64 L76 86 Z" fill="#C4634E" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M76 86 L70 93 L82 87 Z" fill="#1a1a18" stroke="#1a1a18" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const pillars = [
    {
      label: "Products",
      href: "/products",
      desc: "AI tools for research integrity, medical translation, and academic workflows.",
      bg: "#DDD8CC",
      Illustration: RICIllustration,
    },
    {
      label: "About",
      href: "/about",
      desc: "The story behind the tools — a surgeon building AI for clinicians.",
      bg: "#C6D2DC",
      Illustration: TranslateIllustration,
    },
    {
      label: "Blog",
      href: "https://tuyentranmd.com/blog",
      desc: "Writing on AI in research, methodology, and publishing for clinicians.",
      bg: "#E0D4C8",
      Illustration: BlogIllustration,
      external: true,
    },
  ];

  return (
    <div className="relative">
      <div className="relative z-10">

        {/* ─── HERO ────────────────────────────────────────── */}
        <section className="pt-12 pb-8 md:pt-20 md:pb-12">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">
                AI · Research · Medicine
              </p>

              {/* Headline */}
              <h1
                className="font-serif font-bold text-stone-900 leading-[1.08] mb-5"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
              >
                AI tools built for
                <br />
                clinicians who publish.
              </h1>

              {/* Body */}
              <p className="text-[16px] text-stone-600 leading-relaxed mb-3 max-w-xl">
                AI for Academic is a small product studio by{" "}
                <a
                  href="https://tuyentranmd.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-800 underline underline-offset-3 hover:text-stone-900 transition-colors"
                >
                  Tuyến Trần, MD
                </a>
                {" "}— a pediatric &amp; plastic surgeon building tools at the intersection of AI and clinical research.
              </p>
              <p className="text-[16px] text-stone-600 leading-relaxed mb-6 max-w-xl">
                These tools are made for doctors who don&apos;t have a dedicated research team — but still want to publish rigorously.
              </p>

              {/* Italic note */}
              <p className="text-sm text-stone-500 font-medium italic mb-8">
                AI assists thinking. You own the science.
              </p>

              {/* CTA row */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://check.aiforacademic.world"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "#C4634E", color: "#fff" }}
                >
                  Try RIC — free&thinsp;↗
                </a>
                <Link
                  href="/products"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  See all products →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRODUCT SPOTLIGHT ───────────────────────────── */}
        <section className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-6">
              Featured Tools
            </p>
            <div className="grid md:grid-cols-3 gap-4">

              {/* RIC */}
              <a
                href="https://check.aiforacademic.world"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity group no-grid"
                style={{ backgroundColor: "#C6D2DC" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">
                    RIC&thinsp;↗
                  </p>
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
                href="/products#med-translate"
                className="block rounded-2xl p-6 hover:opacity-85 transition-opacity group no-grid"
                style={{ backgroundColor: "#C6DCD2" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">
                    Med Translate
                  </p>
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
                  Preserves statistical constructs and surgical terminology across languages. Built for clinicians in resource-limited settings.
                </p>
              </a>

              {/* AVR */}
              <div
                className="block rounded-2xl p-6 no-grid opacity-70"
                style={{ backgroundColor: "#DDD4EC" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-base font-semibold text-stone-900">
                    AVR
                  </p>
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
                  Systematic variable extraction and validation for clinical datasets. In development.
                </p>
              </div>

            </div>

            <div className="mt-5 text-right">
              <Link
                href="/products"
                className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
              >
                View all products →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── NAVIGATION PILLARS ──────────────────────────── */}
        <section className="pb-12 no-grid">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pillars.map((item) => {
                const { Illustration } = item;
                const inner = (
                  <>
                    <div className="w-10 h-10 mb-3 opacity-70">
                      <Illustration />
                    </div>
                    <p className="text-sm font-semibold text-stone-900 mb-1">
                      {item.label}
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.external ? "↗" : "→"}
                      </span>
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </>
                );

                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl p-4 group transition-opacity hover:opacity-85 no-grid"
                      style={{ backgroundColor: item.bg }}
                    >
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl p-4 group transition-opacity hover:opacity-85 no-grid"
                    style={{ backgroundColor: item.bg }}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
