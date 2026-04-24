import Link from "next/link";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { Icons } from "@/components/Icons";
import { getCurrentLang } from "@/lib/server-lang";
import { TOOLS } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Tools — AI for Academic",
  description: "Three-phase AI research toolkit: Literature Review, Research Mentor, Paper Checker, and Polish.",
};

// 12 sub-tools across 4 named groups — match the actual product surface
const tools = [
  {
    group: "Review",
    icon: <Icons.Search className="w-6 h-6 inline-block" />,
    title: "Literature Review",
    subtitle: "Search · Fetch · Translate · Extract refs",
    desc: "Find papers on PubMed + OpenAlex, fetch open-access PDFs, translate full documents, and extract bibliographies as .ris.",
    features: [
      "LLM-ranked search across PubMed + OpenAlex",
      "Legal full-text fetch via Unpaywall cascade",
      "Full-document EN ↔ VI translation",
      "Extract bibliography → Zotero/Mendeley .ris",
    ],
    href: "/tools/literature-review",
    quota: "20 searches / day (free login)",
    color: "#C6DCD2",
    textColor: "#1a3d2e",
  },
  {
    group: "Research Mentor",
    icon: <Icons.Edit className="w-6 h-6 inline-block" />,
    title: "Research Mentor",
    subtitle: "Validate · Outline · Draft",
    desc: "Critique your research idea for novelty and feasibility, generate a PICO protocol, draft a manuscript section-by-section.",
    features: [
      "Structured feasibility critique (novelty + red flags)",
      "PICO + I/E + analysis plan for 7 study types",
      "Streaming manuscript draft from your references",
    ],
    href: "/tools/research-mentor",
    quota: "5 validations / day (free login)",
    color: "#DDD4EC",
    textColor: "#2d1a4d",
  },
  {
    group: "Paper Checker",
    icon: <Icons.CheckCircle className="w-6 h-6 inline-block" />,
    title: "Paper Checker",
    subtitle: "Citations · AI detect · Plagiarism · Peer review",
    desc: "4-in-1 integrity suite before you submit. Verify every citation, detect AI writing, scan plagiarism, simulate peer review.",
    features: [
      "Citation verify vs CrossRef + OpenAlex + PubMed",
      "AI writing detector — score 0–100 with patterns",
      "Plagiarism scan with linked source DOIs",
      "Editor-style peer review with section comments",
    ],
    href: "/tools/paper-checker",
    quota: "5 checks / day (free login)",
    color: "#C6D2DC",
    textColor: "#1a2e3d",
  },
  {
    group: "Polish",
    icon: <Icons.Sparkles className="w-6 h-6 inline-block" />,
    title: "Polish",
    subtitle: "Prose refinement",
    desc: "Pick a journal style (Nature / BMJ / JAMA / generic), get a side-by-side diff. Citation markers and statistics are preserved verbatim.",
    features: [
      "Nature / BMJ / JAMA style guides",
      "Before / after side-by-side diff view",
      "Anti-hallucination: locks to your stats + citations",
    ],
    href: "/tools/polish",
    quota: "3 runs / day (free login)",
    color: "#F5E6D8",
    textColor: "#3d2010",
  },
];

export default async function ToolsPage() {
  const lang = await getCurrentLang();
  const s = (key: keyof typeof TOOLS) => TOOLS[key][lang];
  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
            {s("sectionLabel")}
          </p>
          <h1
            className="mb-3 font-serif font-bold leading-[1.1] text-stone-900"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {s("headline")}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-stone-600">
            {s("subhead")}{" "}
            <Link href="/workspace" className="text-stone-900 underline underline-offset-4 hover:text-stone-700">
              {s("workspaceLink")}
            </Link>{" "}
            {s("subheadSuffix")}
          </p>
        </div>

        {/* Tool grid */}
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="no-grid group block rounded-2xl p-7 transition-opacity hover:opacity-92"
              style={{ backgroundColor: tool.color }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-60"
                    style={{ color: tool.textColor }}
                  >
                    {tool.group}
                  </p>
                  <p
                    className="font-serif font-bold text-2xl flex items-center gap-2.5"
                    style={{ color: tool.textColor }}
                  >
                    {tool.icon} {tool.title}
                  </p>
                  <p
                    className="text-xs font-medium mt-0.5 opacity-60"
                    style={{ color: tool.textColor }}
                  >
                    {tool.subtitle}
                  </p>
                </div>
                <span
                  className="mt-1 text-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: tool.textColor }}
                >
                  →
                </span>
              </div>

              <p
                className="mb-4 text-base leading-relaxed"
                style={{ color: tool.textColor, opacity: 0.9 }}
              >
                {tool.desc}
              </p>

              <ul className="mb-5 space-y-1.5">
                {tool.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: tool.textColor, opacity: 0.85 }}
                  >
                    <span className="mt-0.5 opacity-50 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div
                className="inline-block rounded-full px-3 py-1 text-[11px] font-medium"
                style={{
                  backgroundColor: "rgba(0,0,0,0.08)",
                  color: tool.textColor,
                }}
              >
                {tool.quota}
              </div>
            </Link>
          ))}
        </div>

        {/* Workspace CTA */}
        <div
          className="no-grid mt-8 rounded-2xl p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center gap-6"
          style={{ backgroundColor: "#1a1a18" }}
        >
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Or go hands-free
            </p>
            <p className="mb-2 text-xl font-serif font-bold text-white">
              Use the AI Workspace
            </p>
            <p className="text-sm leading-relaxed text-stone-400">
              Type your research question. Gemini chains all tools automatically, saves artifacts per project, and asks before every major action.
            </p>
          </div>
          <Link
            href="/workspace"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4634E", color: "white" }}
          >
            Try Workspace →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
