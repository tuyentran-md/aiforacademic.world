"use client";

import Link from "next/link";

const footerLinks = [
  {
    section: "Tools",
    links: [
      { label: "Literature Review (Phase 1)", href: "/tools/literature-review" },
      { label: "Research Mentor (Phase 2)", href: "/tools/research-mentor" },
      { label: "Paper Checker (Phase 3)", href: "/tools/paper-checker" },
      { label: "Polish", href: "/tools/polish" },
    ],
  },
  {
    section: "Site",
    links: [
      { label: "Workspace", href: "/workspace" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
      { label: "Tuyến Trần, MD — Courses & Blog", href: "https://tuyentranmd.com", external: true },
    ],
  },
  {
    section: "Connect",
    links: [
      { label: "GitHub", href: "https://github.com/tuyentran-md", external: true },
      { label: "LinkedIn", href: "https://linkedin.com/in/tuyentran-md", external: true },
      { label: "ORCID", href: "https://orcid.org/0009-0003-0535-6225", external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="no-grid" style={{ backgroundColor: "#111111" }}>
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-14">
        <div className="grid sm:grid-cols-3 gap-10 mb-12">
          {footerLinks.map((group) => (
            <div key={group.section}>
              <h3
                className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4"
                style={{ color: "#999" }}
              >
                {group.section}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] transition-colors"
                        style={{ color: "#e0e0e0" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#e0e0e0")}
                      >
                        {link.label}&thinsp;↗
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] transition-colors"
                        style={{ color: "#e0e0e0" }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ borderColor: "#222" }}
        >
          <p className="text-[12px]" style={{ color: "#aaa" }}>
            AI for Academic · Three phases. From literature to publication.
          </p>
          <p className="text-[12px]" style={{ color: "#888" }}>
            Built by Tuyến Trần, MD · © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
