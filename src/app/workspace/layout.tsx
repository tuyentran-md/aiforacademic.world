import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace — AI for Academic",
  description: "AI research workspace: chat with Gemini to search literature, draft manuscripts, and check paper integrity — all in one conversation.",
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
