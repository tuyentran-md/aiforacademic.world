"use client";

import { useState } from "react";

interface AboutSection {
  id: string;
  question: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: Array<{ href: string; label: string }>;
}

const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: "founder",
    question: "Founder",
    eyebrow: "Founder",
    title: "Who is building AI for Academic?",
    paragraphs: [
      "AI for Academic is a small product studio by Tuyen Tran, MD, a pediatric and plastic surgeon in Vietnam.",
      "The studio is shaped by clinical work, academic publishing, and the frustration of doing research without the support systems that many well-resourced institutions take for granted.",
    ],
    bullets: [
      "Clinical background: pediatric and plastic surgery",
      "Research background: clinical studies, long-term outcomes, academic publishing",
      "Technical angle: builds tools from the perspective of a working clinician-researcher",
    ],
    links: [
      { href: "https://tuyentranmd.com/about", label: "Full bio" },
      { href: "https://scholar.google.com/citations?hl=en&user=7bQ6kmsAAAAJ", label: "Google Scholar" },
      { href: "https://orcid.org/0009-0003-0535-6225", label: "ORCID" },
      { href: "https://github.com/tuyentran-md", label: "GitHub" },
    ],
  },
  {
    id: "story",
    question: "The story",
    eyebrow: "The story",
    title: "Why does this studio exist?",
    paragraphs: [
      "Because academic work is often harder than it should be, especially for researchers working outside large English-speaking institutions.",
      "The goal is not to replace scientific judgment. The goal is to reduce friction around searching, translating, drafting, and checking so researchers can spend more energy on the actual science.",
    ],
  },
  {
    id: "how",
    question: "How it works",
    eyebrow: "How it works",
    title: "What does the product actually do?",
    paragraphs: [
      "The main workspace is a direct pipeline: ask a question, gather sources, turn the shortlist into a draft scaffold, then run an integrity check.",
      "Other tools stay available as focused utilities when you only need one part of that workflow.",
    ],
    bullets: [
      "Pipeline: sources -> draft -> integrity check",
      "RIC: research integrity and claim checking",
      "Translator: academic translation with terminology preservation",
      "SRMA: systematic review automation support",
    ],
  },
  {
    id: "beliefs",
    question: "What we believe",
    eyebrow: "What we believe",
    title: "What principles shape the tools?",
    paragraphs: [
      "AI should assist thinking, not replace it.",
      "Credibility matters more than sounding impressive. The product should say exactly what it can do, where the evidence is thin, and where the user still needs to decide.",
    ],
    bullets: [
      "The user owns the science.",
      "The tool should surface uncertainty, not hide it.",
      "Academic integrity is part of the product, not an afterthought.",
    ],
  },
  {
    id: "focus",
    question: "Focus areas",
    eyebrow: "Focus areas",
    title: "Which problems does the studio care about most?",
    paragraphs: [
      "The focus is narrow on purpose: academic writing workflows, research integrity, translation, and practical tools for clinicians and researchers who need useful output quickly.",
    ],
    bullets: [
      "Research integrity",
      "Academic translation",
      "Drafting support for clinical and academic manuscripts",
      "Workflows for Vietnamese and cross-language researchers",
    ],
  },
];

export function AboutTabs() {
  const [activeId, setActiveId] = useState(ABOUT_SECTIONS[0].id);
  const activeSection =
    ABOUT_SECTIONS.find((section) => section.id === activeId) || ABOUT_SECTIONS[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <aside className="rounded-[28px] border border-black/[0.08] bg-white/82 p-3 shadow-[0_18px_40px_rgba(17,17,16,0.05)]">
        <div className="mb-3 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            Questions
          </p>
        </div>
        <div className="space-y-2">
          {ABOUT_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveId(section.id)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                section.id === activeId
                  ? "bg-stone-900 text-white"
                  : "bg-stone-50 text-stone-600 hover:bg-white"
              }`}
            >
              {section.question}
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-[32px] border border-black/[0.08] bg-white/88 p-6 shadow-[0_20px_44px_rgba(17,17,16,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          {activeSection.eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-[clamp(1.6rem,4vw,2.3rem)] font-bold leading-tight text-stone-900">
          {activeSection.title}
        </h2>

        <div className="mt-5 space-y-4 text-[15px] leading-8 text-stone-600">
          {activeSection.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {activeSection.bullets?.length ? (
          <div className="mt-6 grid gap-3">
            {activeSection.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-2xl border border-black/[0.08] bg-stone-50 px-4 py-3 text-sm text-stone-600"
              >
                {bullet}
              </div>
            ))}
          </div>
        ) : null}

        {activeSection.links?.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {activeSection.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
