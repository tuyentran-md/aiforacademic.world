import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Literature Review — AI for Academic",
  description: "Search PubMed + OpenAlex, fetch open-access full text, translate documents to Vietnamese.",
};

export default function LiteratureReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
