"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { FOOTER } from "@/lib/i18n/strings";

export default function Footer() {
  const { lang } = useLang();
  const f = (key: keyof typeof FOOTER) => FOOTER[key][lang];

  const footerLinks = [
    {
      section: f("toolsHeading"),
      links: [
        { label: f("litReview"), href: "/tools/literature-review" },
        { label: f("mentor"), href: "/tools/research-mentor" },
        { label: f("paperChecker"), href: "/tools/paper-checker" },
        { label: f("polish"), href: "/tools/polish" },
      ],
    },
    {
      section: f("siteHeading"),
      links: [
        { label: f("workspace"), href: "/workspace" },
        { label: f("blog"), href: "/blog" },
        { label: f("about"), href: "/about" },
        { label: f("authorBlog"), href: "https://tuyentranmd.com", external: true },
      ],
    },
    {
      section: f("connectHeading"),
      links: [
        { label: "GitHub", href: "https://github.com/tuyentran-md", external: true },
        { label: "LinkedIn", href: "https://linkedin.com/in/tuyentran-md", external: true },
        { label: "ORCID", href: "https://orcid.org/0009-0003-0535-6225", external: true },
      ],
    },
  ];

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
                        className="text-[13px] text-[#e0e0e0] hover:text-white transition-colors"
                      >
                        {link.label}&thinsp;↗
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] text-[#e0e0e0] hover:text-white transition-colors"
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
            {f("tagline")}
          </p>
          <p className="text-[12px]" style={{ color: "#888" }}>
            {f("builtBy")} · © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
