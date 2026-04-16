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
    default: "AI for Academic — Research Tools for Clinicians",
    template: "%s | AI for Academic",
  },
  description:
    "AI-powered research tools built by a surgeon for clinicians who publish. Check manuscript integrity, translate medical literature, and more.",
  keywords: [
    "AI research tools",
    "research integrity check",
    "medical translation",
    "clinical research AI",
    "academic writing AI",
    "manuscript integrity",
  ],
  authors: [{ name: "Tuyến Trần" }],
  creator: "Tuyến Trần",
  metadataBase: new URL("https://aiforacademic.world"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aiforacademic.world",
    siteName: "AI for Academic",
    title: "AI for Academic — Research Tools for Clinicians",
    description:
      "AI-powered research tools built by a surgeon for clinicians who publish.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI for Academic — Research Tools for Clinicians",
    description:
      "AI-powered research tools built by a surgeon for clinicians who publish.",
  },
  robots: { index: true, follow: true },
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
