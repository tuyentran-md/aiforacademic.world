import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "AI for Academic is a product studio by Tuyến Trần, MD — a surgeon building AI tools for clinicians who publish.",
};

// ── Illustrations ─────────────────────────────────────────────────────────────

function AboutIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M60 40 C60 40, 40 60, 40 90 C40 120, 65 135, 90 135 C115 135, 140 120, 140 90 C140 60, 120 40, 120 40"
        stroke="#1a1a18"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="60" cy="38" r="6" fill="#C4634E" stroke="#1a1a18" strokeWidth="2.2" />
      <circle cx="120" cy="38" r="6" fill="#C4634E" stroke="#1a1a18" strokeWidth="2.2" />
      <circle cx="90" cy="152" r="18" fill="#f0ede8" stroke="#1a1a18" strokeWidth="2.8" />
      <circle cx="90" cy="152" r="10" fill="#C4634E" fillOpacity="0.7" stroke="#1a1a18" strokeWidth="2" />
      <path d="M90 135 L90 120" stroke="#1a1a18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

const story = [
  "AI for Academic is a small product studio by Tuyến Trần, MD — a pediatric and plastic surgeon at Vinmec International Hospital, Vietnam. It exists because academic work in resource-limited settings is harder than it needs to be, and because AI, used carefully, can close some of that gap.",
  "I wasn't trained to do research — I was trained to operate. When I started publishing, I discovered that most of the tools and workflows in academic publishing were designed for people with support structures I didn't have: protected time, methodological mentors, institutional libraries, integrity-checking subscriptions.",
  "I kept doing research anyway. Because the questions wouldn't leave me alone. And because I came to believe that if AI could make that process less inaccessible — not by replacing judgment, but by making it less opaque — then the work that follows benefits too.",
  "So I started building tools. First for myself, as a clinician-researcher. Then it became clear that other researchers — especially those outside the English-speaking world — were hitting the same walls. The tools here are what came out of it.",
];

const beliefs = [
  {
    title: "AI assists thinking. You own the science.",
    desc: "The most dangerous version of AI in medicine isn't the one that makes mistakes. It's the one that makes people stop thinking. These tools exist to sharpen judgment, not to outsource it.",
    bg: "#D4DCE4",
  },
  {
    title: "Credibility comes from the inside.",
    desc: "I'm not a tech person who learned about medicine. I'm a surgeon who learned to code. That context shapes every decision — what to build, what to question, and what to leave alone.",
    bg: "#D0DCD2",
  },
  {
    title: "Honest pipeline. No inflated claims.",
    desc: "In a world where everyone overstates, the discipline of saying exactly what you know — and what you don't — is a competitive advantage and a moral obligation.",
    bg: "#DCD8E4",
  },
];

const focusAreas = [
  {
    label: "Research integrity (RIC)",
    desc: "AI detection, citation verification, plagiarism, peer-review simulation — before you submit.",
  },
  {
    label: "Academic translation",
    desc: "Context-aware translation across languages that preserves technical terminology, statistics, and domain vocabulary.",
  },
  {
    label: "AI for Vietnamese Research (AVR)",
    desc: "A research formation system for Vietnamese clinicians: idea → blueprint → validated abstract → submission gate → manuscript outline. In development.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="pt-8 pb-0 md:pt-10">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div
            className="rounded-3xl px-6 py-8 md:px-12 md:py-14 no-grid"
            style={{ backgroundColor: "#D8CBC0" }}
          >
            <div className="grid md:grid-cols-[1fr_200px] gap-10 items-center">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#8a7a65" }}
                >
                  About
                </p>
                <h1
                  className="font-serif font-bold text-stone-900 leading-[1.05] mb-4"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                  AI tools for
                  <br />
                  academic works.
                </h1>
                <p className="text-[15px] text-stone-600 leading-relaxed max-w-lg">
                  AI for Academic is a product studio by{" "}
                  <a
                    href="https://tuyentranmd.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-800 underline underline-offset-3 hover:text-stone-900 transition-colors"
                  >
                    Tuyến Trần, MD
                  </a>
                  {" "}— pediatric &amp; plastic surgeon, clinical researcher, and builder.
                </p>
              </div>
              <div className="hidden md:block flex-shrink-0 w-[180px] h-[180px] opacity-70">
                <AboutIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STORY ───────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-[200px_1fr] gap-10">
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-xl sticky top-24">
                The story
              </h2>
            </div>
            <div className="space-y-5 text-[16px] text-stone-600 leading-[1.8]">
              {story.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ──────────────────────────────────────── */}
      <section className="py-10 no-grid" style={{ backgroundColor: "#111111" }}>
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p
            className="font-serif text-2xl md:text-3xl leading-relaxed"
            style={{ color: "#e8e4dc" }}
          >
            &ldquo;AI assists thinking. You own the science.&rdquo;
          </p>
        </div>
      </section>

      {/* ── BELIEFS ─────────────────────────────────────────── */}
      <section className="py-16 no-grid">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <h2 className="font-serif font-bold text-stone-900 text-xl mb-8">
            What the studio believes
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {beliefs.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-6 no-grid"
                style={{ backgroundColor: v.bg }}
              >
                <h3 className="text-sm font-bold text-stone-900 mb-3 leading-snug italic">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5a5248" }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOCUS AREAS ─────────────────────────────────────── */}
      <section className="py-14 border-t border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-[200px_1fr] gap-10">
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-xl">
                Focus areas
              </h2>
            </div>
            <div className="space-y-5">
              {focusAreas.map((f) => (
                <div key={f.label} className="border-l-2 border-stone-200 pl-5">
                  <p className="text-sm font-semibold text-stone-900 mb-1">
                    {f.label}
                  </p>
                  <p className="text-sm text-stone-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BACKGROUND / LINKS ──────────────────────────────── */}
      <section className="py-12 no-grid">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-5">
            Founder &amp; background
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mb-6 max-w-2xl">
            Tuyến Trần, MD — Pediatric &amp; Plastic Surgeon at Vinmec International Hospital, Vietnam.
            Clinical focus: congenital anomalies, neonatal surgery, microsurgery, long-term outcomes.
            Research: clinical trials, retrospective cohorts, diagnostic studies, AI in academic research.
            Training in epidemiology and biostatistics (Johns Hopkins University).
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Full bio", href: "https://tuyentranmd.com/about" },
              { label: "Research", href: "https://tuyentranmd.com/research" },
              { label: "ORCID", href: "https://orcid.org/0009-0003-0535-6225" },
              { label: "Google Scholar", href: "https://scholar.google.com/citations?hl=en&user=7bQ6kmsAAAAJ" },
              { label: "GitHub", href: "https://github.com/tuyentran-md" },
              { label: "LinkedIn", href: "https://linkedin.com/in/tuyentran-md" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors no-grid"
                style={{ backgroundColor: "#E5DFCF", color: "#5a5248" }}
              >
                {link.label}&thinsp;↗
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-12 no-grid" style={{ backgroundColor: "#111111" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-white/55">
            Interested in collaboration, research partnerships, or grant inquiries?
          </p>
          <a
            href="https://tuyentranmd.com/advisory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white/75 hover:text-white transition-colors whitespace-nowrap"
          >
            Get in touch&thinsp;↗
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
