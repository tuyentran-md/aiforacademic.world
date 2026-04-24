"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/Icons";

const toolNav = [
  { href: "/tools/literature-review", icon: <Icons.Search className="w-3.5 h-3.5" />, label: "Literature Review" },
  { href: "/tools/research-mentor", icon: <Icons.Edit className="w-3.5 h-3.5" />, label: "Research Mentor" },
  { href: "/tools/paper-checker", icon: <Icons.CheckCircle className="w-3.5 h-3.5" />, label: "Paper Checker" },
  { href: "/tools/polish", icon: <Icons.Sparkles className="w-3.5 h-3.5" />, label: "Polish" },
];

export default function ToolsSubNav() {
  const pathname = usePathname();

  return (
    <div
      className="no-grid sticky top-14 z-40 border-b border-black/[0.06]"
      style={{ backgroundColor: "rgba(250,249,246,0.97)", backdropFilter: "blur(8px)" }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 relative">
        <div className="flex justify-center items-center gap-1.5 h-11 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {toolNav.map((t) => {
            const active = pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                }`}
                style={active ? { backgroundColor: "#C4634E" } : {}}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
        <Link
          href="/tools"
          className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 text-stone-400 hover:text-stone-700 transition-colors text-base leading-none"
          aria-label="Back to Tools"
        >
          ←
        </Link>
        <Link
          href="/workspace"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center text-xs font-semibold px-3 py-1.5 rounded-full text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        >
          Workspace →
        </Link>
      </div>
    </div>
  );
}
