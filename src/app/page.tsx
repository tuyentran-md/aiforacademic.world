import Link from "next/link";
import Footer from "@/components/Footer";
import EmailCapture from "@/components/EmailCapture";
import { Icons } from "@/components/Icons";

export const metadata = {
  title: "AI for Academic — Three phases. Literature to publication.",
  description:
    "AI tools for Vietnamese clinical researchers. Search literature, draft manuscripts, check integrity — powered by Gemini 2.5 Flash.",
};

const stats = [
  { value: "2,400+", label: "papers checked" },
  { value: "340+", label: "fabricated refs found" },
  { value: "120+", label: "doctors onboard" },
];

const phases = [
  {
    phase: "Phase 1",
    icon: <Icons.Search className="w-5 h-5" />,
    title: "Literature Review",
    desc: "Search PubMed + OpenAlex, fetch open-access PDFs, translate full-text to Vietnamese.",
    features: ["Smart search with LLM ranking", "Legal fulltext fetch (Unpaywall)", "Full-text translation → .docx"],
    href: "/tools/literature-review",
    stat: "20 searches/day free",
  },
  {
    phase: "Phase 2",
    icon: <Icons.Edit className="w-5 h-5" />,
    title: "Research Mentor",
    desc: "Validate your idea, generate a PICO protocol, draft a manuscript from your references.",
    features: ["Feasibility critique (novelty, red flags)", "Protocol generator (RCT / cohort / MA)", "Streaming manuscript draft"],
    href: "/tools/research-mentor",
    stat: "5 validations/day free",
  },
  {
    phase: "Phase 3",
    icon: <Icons.CheckCircle className="w-5 h-5" />,
    title: "Paper Checker",
    desc: "4-in-1 integrity suite: citation check, AI detection, plagiarism scan, peer review.",
    features: ["Citation verify vs CrossRef + OpenAlex", "AI writing detector (0–100 score)", "Peer review simulation"],
    href: "/tools/paper-checker",
    stat: "5 checks/day free",
  },
];

export default function Home() {
  return (
    <div className="relative">
      <div className="relative z-10">

        {/* ── Hero + How it works (merged) ─────────────────────────────── */}
        <section className="pt-14 pb-10 md:pt-20 md:pb-14">
          <div className="mx-auto max-w-5xl px-6 md:px-8">

            {/* One-line headline */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
              AI · Research · Academic
            </p>
            <h1
              className="mb-3 font-serif font-bold text-stone-900 whitespace-nowrap"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
            >
              AI tools for academic works.
            </h1>
            <p className="mb-6 text-base leading-relaxed text-stone-500">
              Three phases. From literature to publication.
            </p>

            {/* Stats */}
            <div className="mb-7 flex flex-wrap gap-5">
              {stats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-stone-900">{s.value}</span>
                  <span className="text-sm text-stone-500">{s.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#C4634E" }}
              >
                Try Workspace free →
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50"
              >
                Browse tools
              </Link>
            </div>

            {/* How it works — inline below hero */}
            <div className="no-grid rounded-2xl border border-black/[0.06] bg-white px-6 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
                How it works
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { n: "1", t: "Gather literature", d: "Search, fetch full-text, translate abstracts and PDFs into Vietnamese." },
                  { n: "2", t: "Draft with AI mentor", d: "Validate your idea, generate a PICO protocol, stream a manuscript draft." },
                  { n: "3", t: "Check before submit", d: "Citation audit, AI detection, plagiarism scan, editor-style peer review." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-3">
                    <span
                      className="flex-shrink-0 h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: "#C4634E" }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-stone-900">{step.t}</p>
                      <p className="text-sm leading-relaxed text-stone-500">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Workspace CTA ─────────────────────────────────────────────── */}
        <section className="py-6 md:py-8">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div
              className="no-grid rounded-2xl p-7 md:p-9 text-white"
              style={{ backgroundColor: "#1a1a18" }}
            >
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-stone-400">Workspace</p>
              <p className="mb-2 font-serif font-bold" style={{ fontSize: "clamp(1.3rem, 3vw, 1.9rem)" }}>
                AI Workspace — from idea to manuscript
              </p>
              <p className="mb-5 max-w-lg text-sm leading-relaxed text-stone-400">
                Chat-based research assistant. Gemini invokes all 11 tools — search, draft, check — in one conversation. Artifacts persist per project.
              </p>
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#C4634E", color: "white" }}
              >
                Try Workspace free →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Three-phase grid ─────────────────────────────────────────── */}
        <section className="py-6 md:py-10">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Tools
            </p>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              {phases.map((p) => (
                <Link
                  key={p.phase}
                  href={p.href}
                  className="no-grid block rounded-2xl p-5 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#EDE8DF" }}
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    {p.phase}
                  </p>
                  <p className="mb-1 text-lg font-serif font-bold flex items-center gap-2 text-stone-900">
                    {p.icon} {p.title}
                  </p>
                  <p className="mb-3 text-sm leading-relaxed text-stone-600">
                    {p.desc}
                  </p>
                  <ul className="mb-3 space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="mt-0.5 text-stone-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-medium text-stone-400">{p.stat}</p>
                </Link>
              ))}
            </div>

            {/* Polish side-tool */}
            <div className="mt-3">
              <Link
                href="/tools/polish"
                className="no-grid flex items-center justify-between rounded-2xl p-5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#EDE8DF" }}
              >
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-stone-400">Side tool</p>
                  <p className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Icons.Sparkles className="w-4 h-4 text-stone-500" /> Polish — Prose refinement
                  </p>
                  <p className="text-sm text-stone-500">Upload a DOCX, pick a journal style, get a tracked-changes diff. Citation markers preserved verbatim.</p>
                </div>
                <span className="ml-4 flex-shrink-0 text-stone-400">→</span>
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
