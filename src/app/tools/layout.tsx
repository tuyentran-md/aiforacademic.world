import type { Metadata } from "next";
import ToolsSubNav from "@/components/ToolsSubNav";

export const metadata: Metadata = {
  title: "Tools — AI for Academic",
  description: "Three-phase AI research toolkit: Literature Review, Research Mentor, Paper Checker, and Polish.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ToolsSubNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
