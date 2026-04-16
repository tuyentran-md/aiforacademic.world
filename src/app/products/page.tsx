import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import ProductTabs from "@/components/ProductTabs";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "AI tools for academic works — Research Integrity Check, context-aware academic translation, and AI for Vietnamese Research.",
};

export default function ProductsPage() {
  return (
    <>
      <ProductTabs />

      {/* ── FOOTER CTA ─────────────────────────────────────── */}
      <section className="py-12 no-grid" style={{ backgroundColor: "#111111" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-white/55">AI tools for academic works.</p>
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

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 text-center">
        <p className="text-sm text-stone-500 mb-2">Looking for downloadable resources?</p>
        <Link href="/resources" className="text-sm font-medium text-stone-800 hover:text-stone-600 underline underline-offset-2">
          Browse prompt packs and playbooks →
        </Link>
      </div>

      <Footer />
    </>
  );
}
