"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangToggle from "@/components/LangToggle";

const navLinks = [
  { href: "/workspace", label: "Workspace" },
  { href: "/tools", label: "Tools" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isWorkspace = pathname?.startsWith("/workspace");

  return (
    <header
      className={`sticky top-0 z-50 no-grid border-b border-black/[0.06]${isWorkspace ? " hidden md:block" : ""}`}
      style={{
        backgroundColor: "rgba(245, 241, 234, 0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0" onClick={() => setOpen(false)}>
          <span className="text-sm font-semibold text-stone-900 tracking-tight">
            AI for Academic
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  active
                    ? "text-stone-900 font-medium"
                    : "text-stone-400 hover:text-stone-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <LangToggle />
          <a
            href="https://tuyentranmd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-400 hover:text-stone-700 transition-colors whitespace-nowrap border-l border-stone-200 pl-4 ml-1"
          >
            Tuyến Trần, MD&thinsp;↗
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1 text-stone-500 hover:text-stone-700"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t border-black/[0.06] px-6 py-4 no-grid"
          style={{ backgroundColor: "#F5F1EA" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2.5 text-sm ${
                pathname?.startsWith(link.href)
                  ? "font-medium text-stone-900"
                  : "text-stone-500"
              }`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-black/[0.06] mt-2 flex items-center gap-4">
            <LangToggle />
            <a
              href="https://tuyentranmd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-400"
              onClick={() => setOpen(false)}
            >
              Tuyến Trần, MD&thinsp;↗
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
