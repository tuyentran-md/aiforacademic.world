import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Resources",
  description: "Research tools and prompt packs for clinical academics — from paper structuring to systematic reviews.",
  alternates: { canonical: "https://aiforacademic.world/resources" },
};

const products = [
  {
    id: "PP_PAPER",
    name: "Prompt Pack: Paper Structuring",
    price: "$5",
    description: "25 tested prompts for structuring your paper with AI — from intro to revision.",
    url: "https://researchcraft.gumroad.com/l/xrjeei",
    tag: "Prompt Pack",
  },
  {
    id: "PP_SRMA",
    name: "Prompt Pack: SR/MA",
    price: "$5",
    description: "25 prompts for systematic review & meta-analysis — protocol to forest plot.",
    url: "https://researchcraft.gumroad.com/l/oovlmj",
    tag: "Prompt Pack",
  },
  {
    id: "CK_IDEA2SUB",
    name: "Checklist: Idea to Submission",
    price: "$5",
    description: "Stage-by-stage checklist from research idea to journal submission.",
    url: "https://researchcraft.gumroad.com/l/bbpabf",
    tag: "Checklist",
  },
  {
    id: "PB_DISCUSSION",
    name: "Discussion Section Playbook",
    price: "$7",
    description: "6-block framework to write discussions that survive peer review.",
    url: "https://researchcraft.gumroad.com/l/jlgyae",
    tag: "Playbook",
  },
  {
    id: "FW_REBUTTAL",
    name: "Rebuttal Letter Framework",
    price: "$7",
    description: "Response strategy + templates for every type of reviewer comment.",
    url: "https://researchcraft.gumroad.com/l/ivdrkd",
    tag: "Framework",
  },
  {
    id: "FM_CLINICIAN",
    name: "AI Field Manual for Clinicians",
    price: "$10",
    description: "Complete guide to integrating AI into clinical research — from literature review to manuscript submission.",
    url: "https://researchcraft.gumroad.com/l/cxdrfs",
    tag: "Field Manual",
  },
  {
    id: "BUNDLE_CYBORG",
    name: "The Cyborg Researcher Toolkit",
    price: "$30",
    description: "All 5 products + Operating Manual + R scripts + Python tools. Everything you need to run AI-assisted research.",
    url: "https://researchcraft.gumroad.com/l/rmhvsj",
    tag: "Bundle",
    featured: true,
  },
];

export default function ResourcesPage() {
  return (
    <>
      <section className="pt-12 pb-16">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">Resources</p>
          <h1
            className="font-serif font-bold text-stone-900 leading-tight mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Research tools
          </h1>
          <p className="text-stone-500 text-sm mb-10 max-w-lg">
            Prompt packs, playbooks, and frameworks for clinical researchers — tested in real manuscript workflows.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block rounded-2xl p-6 hover:opacity-85 transition-opacity no-grid ${p.featured ? "sm:col-span-2 lg:col-span-1" : ""}`}
                style={{ backgroundColor: p.featured ? "#1a1a18" : "#F0EDE8" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: p.featured ? "#333" : "#E5E1DC",
                      color: p.featured ? "#ccc" : "#78716c",
                    }}
                  >
                    {p.tag}
                  </span>
                  <span
                    className="text-sm font-bold flex-shrink-0"
                    style={{ color: p.featured ? "#fff" : "#1a1a18" }}
                  >
                    {p.price}
                  </span>
                </div>
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: p.featured ? "#fff" : "#1a1a18" }}
                >
                  {p.name}&thinsp;↗
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: p.featured ? "#a8a29e" : "#78716c" }}
                >
                  {p.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
