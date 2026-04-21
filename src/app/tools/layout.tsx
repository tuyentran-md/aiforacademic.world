import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Tools — AI for Academic",
  description: "Three-phase AI research toolkit: Literature Review, Research Mentor, Paper Checker, and Polish.",
};

const toolNav = [
  { href: "/tools/literature-review", icon: <Icons.Search className="w-3.5 h-3.5" />, label: "Literature Review", phase: "Phase 1" },
  { href: "/tools/research-mentor", icon: <Icons.Edit className="w-3.5 h-3.5" />, label: "Research Mentor", phase: "Phase 2" },
  { href: "/tools/paper-checker", icon: <Icons.CheckCircle className="w-3.5 h-3.5" />, label: "Paper Checker", phase: "Phase 3" },
  { href: "/tools/polish", icon: <Icons.Sparkles className="w-3.5 h-3.5" />, label: "Polish", phase: "Side tool" },
];

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top sub-nav bar for tools */}
      <div
        className="no-grid sticky top-14 z-40 border-b border-black/[0.06] hidden md:block"
        style={{ backgroundColor: "rgba(250,249,246,0.95)", backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-1 h-10">
            <Link
              href="/tools"
              className="mr-3 text-sm font-bold uppercase tracking-widest text-stone-500 hover:text-stone-800 transition-colors"
            >
              ← Back
            </Link>
            {toolNav.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                {t.icon}
                <span>{t.label}</span>
              </Link>
            ))}
            <div className="flex-1" />
            <Link
              href="/workspace"
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C4634E" }}
            >
              Workspace →
            </Link>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
