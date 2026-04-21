import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from "@/components/Nav";
import { LangProvider } from "@/context/LangContext";
import { getCurrentLang } from "@/lib/server-lang";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "AI for Academic — Three phases. Literature to publication.",
    template: "%s | AI for Academic",
  },
  description:
    "AI tools for Vietnamese clinical researchers. Search literature, draft manuscripts, and check paper integrity — powered by Gemini 2.5 Flash.",
  keywords: [
    "AI research tools",
    "literature review AI",
    "manuscript drafting",
    "citation checker",
    "academic writing AI",
    "AI for Vietnamese research",
    "research integrity",
    "clinical research AI",
  ],
  authors: [{ name: "Tuyến Trần" }],
  creator: "Tuyến Trần",
  metadataBase: new URL("https://aiforacademic.world"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aiforacademic.world",
    siteName: "AI for Academic",
    title: "AI for Academic — Three phases. Literature to publication.",
    description:
      "AI tools for Vietnamese clinical researchers. Search literature, draft manuscripts, and check paper integrity — powered by Gemini 2.5 Flash.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI for Academic — Three phases. Literature to publication.",
    description:
      "AI tools for Vietnamese clinical researchers. Search literature, draft manuscripts, and check paper integrity — powered by Gemini 2.5 Flash.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "p0fDei59SUBJ1KPPLJWzWUzjk5wRI6zpOkQRMZx0sEY",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getCurrentLang();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <LangProvider initialLang={lang}>
          <Nav />
          <main className="flex-1">{children}</main>
        </LangProvider>
        <Analytics />
      </body>
    </html>
  );
}
