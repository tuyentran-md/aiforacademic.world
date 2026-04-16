"use client";

import Link from "next/link";

const footerLinks = [
  {
    section: "Products",
    links: [
      { label: "RIC — Research Integrity Check", href: "https://ric.tuyentranmd.com", external: true },
      { label: "Translator — Academic translation", href: "https://translate.tuyentranmd.com", external: true },
      { label: "AVR — AI for Vietnamese Research (soon)", href: "/products#avr" },
      { label: "All Products", href: "/products" },
    ],
  },
  {
    section: "Site",
    links: [
      { label: "Blog", href: "https://tuyentranmd.com/blog", external: true },
      { label: "About", href: "/about" },
      { label: "Founder — tuyentranmd.com", href: "https://tuyentranmd.com", external: true },
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#fff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#e0e0e0")
                        }
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
            AI for Academic · Built by Tuyến Trần, MD
          </p>
          <p className="text-[12px]" style={{ color: "#888" }}>
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
