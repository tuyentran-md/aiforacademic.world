import type { Metadata } from "next";

import Footer from "@/components/Footer";
import BillingGrid from "./BillingGrid";

export const metadata: Metadata = {
  title: "Billing — AI for Academic",
  description: "Upgrade to Pro for unlimited research tools access.",
};



export default function BillingPage() {
  return (
    <div>
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-14 md:py-20">
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">Pricing</p>
          <h1 className="font-serif font-bold text-stone-900 mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-stone-600 text-[17px] leading-relaxed max-w-xl">
            Start free. Upgrade when your research workflow needs it.
          </p>
        </div>

        <BillingGrid />

        {/* FAQ */}
        <div className="max-w-2xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-stone-400">FAQ</p>
          {[
            {
              q: "Do I need to upgrade to try the tools?",
              a: "No. All tools work without login for 2–3 uses. Login grants larger daily quotas. Pro removes all limits.",
            },
            {
              q: "What payment methods are supported?",
              a: "All major cards via LemonSqueezy. We never store card data.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes — cancel in your LemonSqueezy portal. No questions asked. Pro access continues until end of billing period.",
            },
            {
              q: "Is patient data safe?",
              a: "We never train on your data. Manuscripts, references, and chat logs are isolated per account and never shared.",
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-black/[0.07] py-5">
              <p className="font-semibold text-stone-900 text-sm mb-1.5">{item.q}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
