import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ProductTabs from "@/components/ProductTabs";

export const metadata: Metadata = {
  title: "Products",
  description:
    "AI-powered research tools for clinicians — Research Integrity Check, Medical Translation, and more.",
};

// ── Hero illustration ─────────────────────────────────────────────────────────

function ToolsIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="100" r="16" fill="#C4634E" stroke="#1a1a18" strokeWidth="2.5"/>
      <circle cx="100" cy="100" r="7" fill="white" fillOpacity="0.5"/>
      <line x1="100" y1="84" x2="100" y2="48" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="114" y1="90" x2="142" y2="66" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="114" y1="108" x2="148" y2="130" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="100" y1="116" x2="100" y2="154" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="86" y1="108" x2="52" y2="130" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="86" y1="90" x2="58" y2="66" stroke="#1a1a18" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="100" cy="42" r="10" fill="#f0ede8" stroke="#1a1a18" strokeWidth="2.5"/>
      <circle cx="148" cy="60" r="10" fill="#C4634E" fillOpacity="0.75" stroke="#1a1a18" strokeWidth="2.5"/>
      <circle cx="154" cy="134" r="10" fill="#f0ede8" stroke="#1a1a18" strokeWidth="2.5"/>
      <circle cx="100" cy="160" r="10" fill="#C4634E" fillOpacity="0.75" stroke="#1a1a18" strokeWidth="2.5"/>
      <circle cx="46" cy="134" r="10" fill="#f0ede8" stroke="#1a1a18" strokeWidth="2.5"/>
      <circle cx="52" cy="60" r="10" fill="#C4634E" fillOpacity="0.75" stroke="#1a1a18" strokeWidth="2.5"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  return (
    <>
      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <section className="pt-8 pb-0 md:pt-10">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl px-6 py-8 md:px-12 md:py-14 no-grid" style={{ backgroundColor: "#D4CEBC" }}>
            <div className="grid md:grid-cols-[1fr_200px] gap-10 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#555555" }}>
                  AI · Research · Medicine
                </p>
                <h1
                  className="font-serif font-bold text-stone-900 leading-[1.05] mb-4"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                  Products
                </h1>
                <p className="text-[15px] text-stone-600 leading-relaxed max-w-lg">
                  Software tools built from clinical research experience — for clinicians who want to publish smarter without a dedicated research team.
                </p>
              </div>
              <div className="hidden md:block flex-shrink-0 w-[180px] h-[180px] opacity-60">
                <ToolsIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT TABS ───────────────────────────────────────
          RIC | Med Translate | AVR (coming soon)
          Client component handles interactivity              */}
      <ProductTabs />

      {/* ── FOOTER CTA ─────────────────────────────────────── */}
      <section className="py-12 no-grid" style={{ backgroundColor: "#111111" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-white/55">Built by a surgeon, for surgeons and clinical researchers.</p>
          <a
            href="https://tuyentranmd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white/75 hover:text-white transition-colors whitespace-nowrap"
          >
            About the founder&thinsp;↗
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
