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
    default: "AI for Academic — AI tools for academic works",
    template: "%s | AI for Academic",
  },
  description:
    "AI tools for academic works: manuscript integrity check, context-aware academic translation, and a research formation system for Vietnamese researchers.",
  keywords: [
    "AI research tools",
    "research integrity check",
    "academic translation",
    "manuscript integrity",
    "academic writing AI",
    "AI for Vietnamese research",
  ],
  authors: [{ name: "Tuyến Trần" }],
  creator: "Tuyến Trần",
  metadataBase: new URL("https://aiforacademic.world"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aiforacademic.world",
    siteName: "AI for Academic",
    title: "AI for Academic — AI tools for academic works",
    description:
      "AI tools for academic works: RIC, Translator, and AVR (AI for Vietnamese Research).",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI for Academic — AI tools for academic works",
    description:
      "AI tools for academic works: RIC, Translator, and AVR (AI for Vietnamese Research).",
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
