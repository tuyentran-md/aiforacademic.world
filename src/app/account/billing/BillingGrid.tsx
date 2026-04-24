"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useState } from "react";
import { buildCheckoutUrl } from "@/lib/payment/lemonsqueezy";
import { apiFetch } from "@/lib/api-client";
import { useLang } from "@/context/LangContext";
import { BILLING } from "@/lib/i18n/strings";

export default function BillingGrid() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lsEnabled = process.env.NEXT_PUBLIC_LS_ENABLED === "true";
  const lsMonthlyVariantId = process.env.NEXT_PUBLIC_LS_MONTHLY_VARIANT_ID ?? "";
  const lsYearlyVariantId = process.env.NEXT_PUBLIC_LS_YEARLY_VARIANT_ID ?? "";

  const s = (key: keyof typeof BILLING) => BILLING[key][lang];

  const handleSepayClick = async () => {
    if (!user) {
      window.location.href = `/auth/signin?next=${encodeURIComponent("/account/billing")}`;
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan })
      });
      const data = await res.json();
      if (data.checkoutURL) {
        window.location.href = data.checkoutURL;
      } else {
        setErrorMsg(data.error || s("paymentFailed"));
      }
    } catch {
      setErrorMsg(s("paymentFailed"));
    } finally {
      setLoading(false);
    }
  };

  const currentVND = plan === "monthly" ? "249.000đ" : "2.490.000đ";
  const currentUSD = plan === "monthly" ? "$10" : "$100";
  const periodLabel = plan === "monthly" ? s("month") : s("year");

  return (
    <div className="mb-16">
      {/* Plan Toggle */}
      <div className="flex justify-center mb-8">
        <div className="p-1 bg-[#EDE8DF] rounded-full inline-flex">
          <button
            onClick={() => setPlan("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${plan === "monthly" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
          >
            {s("monthly")}
          </button>
          <button
            onClick={() => setPlan("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${plan === "yearly" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
          >
            {s("yearly")}
          </button>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
        {/* SePay Card */}
        <div className="no-grid rounded-2xl p-7 flex flex-col border-2 border-[#C4634E]/20 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#C4634E] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
            {s("recommended")}
          </div>

          <div className="mb-4">
            <span className="text-4xl">🇻🇳</span>
          </div>
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-[#C4634E]">
            {s("qrLabel")}
          </p>
          <div className="mb-1 flex items-baseline gap-1">
            <p className="text-3xl font-bold font-serif text-stone-900">{currentVND}</p>
            <p className="text-sm text-stone-500">/ {periodLabel}</p>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-stone-600">
            {s("qrDesc")}
          </p>

          <ul className="mb-8 space-y-2 flex-1">
            <li className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 text-green-600">✓</span>
              {s("qrFeat1")}
            </li>
            <li className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 text-green-600">✓</span>
              {s("qrFeat2")}
            </li>
            <li className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 text-green-600">✓</span>
              {s("qrFeat3")}
            </li>
          </ul>

          <button
            onClick={handleSepayClick}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full py-3 px-5 text-sm font-semibold text-white bg-[#111] hover:bg-[#222] transition-colors disabled:opacity-50"
          >
            {loading ? s("qrLoading") : user ? s("qrCta") : s("qrCtaLogin")}
          </button>
          {errorMsg && (
            <p className="mt-3 text-xs text-red-600 text-center" role="alert">
              {errorMsg}
            </p>
          )}
        </div>

        {/* LS Card */}
        <div className="no-grid rounded-2xl p-7 flex flex-col border border-stone-200 bg-stone-50/50">
          <div className="mb-4">
            <span className="text-4xl" aria-hidden>💳</span>
          </div>
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-stone-400">
            {s("cardLabel")}
          </p>
          <div className="mb-1 flex items-baseline gap-1">
            <p className="text-3xl font-bold font-serif text-stone-400">{currentUSD}</p>
            <p className="text-sm text-stone-400">/ {periodLabel}</p>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-stone-500">
            {s("cardDesc")}
          </p>

          <ul className="mb-8 space-y-2 flex-1 opacity-60">
            <li className="flex items-start gap-2 text-sm text-stone-500">
              <span className="mt-0.5 text-stone-400">✓</span>
              {s("cardFeat1")}
            </li>
            <li className="flex items-start gap-2 text-sm text-stone-500">
              <span className="mt-0.5 text-stone-400">✓</span>
              {s("cardFeat2")}
            </li>
          </ul>

          {lsEnabled && user ? (
            <a
              href={buildCheckoutUrl(plan === "monthly" ? lsMonthlyVariantId : lsYearlyVariantId, { uid: user.uid, email: user.email || undefined })}
              className="w-full inline-flex items-center justify-center rounded-full py-3 px-5 text-sm font-semibold transition-opacity bg-stone-200 text-stone-600 hover:bg-stone-300"
            >
              {s("cardCta")}
            </a>
          ) : (
            <button
              disabled
              title={s("pendingReview")}
              className="w-full inline-flex items-center justify-center rounded-full py-3 px-5 text-sm font-semibold transition-opacity bg-stone-200 text-stone-400 cursor-not-allowed"
            >
              {s("comingSoon")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
