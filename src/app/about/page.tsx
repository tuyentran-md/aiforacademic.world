import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { AboutTabs } from "./AboutTabs";

export const metadata: Metadata = {
  title: "About",
  description:
    "AI for Academic is a small product studio building practical AI tools for academic workflows.",
};

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[radial-gradient(circle_at_top_left,rgba(196,99,78,0.06),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(26,46,68,0.05),transparent_32%)]">
      <section className="pt-10 pb-12">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              About
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2.3rem,5vw,4rem)] font-bold leading-[1.04] text-stone-900">
              A compact studio for academic AI tools.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              If you want the workspace, go straight to the pipeline. If you want the context,
              the questions on this page should cover it.
            </p>
          </div>

          <AboutTabs />
        </div>
      </section>

      <Footer />
    </div>
  );
}
