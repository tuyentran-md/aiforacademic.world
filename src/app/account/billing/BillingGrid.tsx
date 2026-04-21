"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useState } from "react";
import { buildCheckoutUrl } from "@/lib/payment/lemonsqueezy";
import { apiFetch } from "@/lib/api-client";

export default function BillingGrid() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  
  const lsEnabled = process.env.NEXT_PUBLIC_LS_ENABLED === "true";

  const handleSepayClick = async () => {
    if (!user) {
      window.location.href = `/auth/signin?next=${encodeURIComponent("/account/billing")}`;
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email, plan })
      });
      const data = await res.json();
      if (data.checkoutURL) {
        window.location.href = data.checkoutURL;
      } else {
        alert(data.error || "Failed to initiate payment");
      }
    } catch (err) {
      alert("Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  const currentVND = plan === "monthly" ? "249.000đ" : "2.490.000đ";
  const currentUSD = plan === "monthly" ? "$10" : "$100";

  return (
    <div className="mb-16">
      {/* Plan Toggle */}
      <div className="flex justify-center mb-8">
        <div className="p-1 bg-[#EDE8DF] rounded-full inline-flex">
          <button 
            onClick={() => setPlan("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${plan === "monthly" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
          >
            Hàng tháng
          </button>
          <button 
            onClick={() => setPlan("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${plan === "yearly" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
          >
            Hàng năm (Tiết kiệm $20)
          </button>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
        {/* SePay Card */}
        <div className="no-grid rounded-2xl p-7 flex flex-col border-2 border-[#C4634E]/20 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#C4634E] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
            Recommended
          </div>
          
          <div className="mb-4">
            <span className="text-4xl">🇻🇳</span>
          </div>
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-[#C4634E]">
            Mã QR (Nội Địa)
          </p>
          <div className="mb-1 flex items-baseline gap-1">
            <p className="text-3xl font-bold font-serif text-stone-900">{currentVND}</p>
            <p className="text-sm text-stone-500">/ {plan === "monthly" ? "tháng" : "năm"}</p>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-stone-600">
            Thanh toán nhanh qua chuyển khoản QR code. Phù hợp cho người dùng Việt Nam.
          </p>
          
          <ul className="mb-8 space-y-2 flex-1">
            <li className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 text-green-600">✓</span>
              Hỗ trợ Momo, Viettel Pay
            </li>
            <li className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 text-green-600">✓</span>
              Hỗ trợ tất cả ngân hàng VCB, TCB, MB...
            </li>
            <li className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-0.5 text-green-600">✓</span>
              Tự động kích hoạt sau ~1 phút
            </li>
          </ul>
          
          <button
            onClick={handleSepayClick}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full py-3 px-5 text-sm font-semibold text-white bg-[#111] hover:bg-[#222] transition-colors disabled:opacity-50"
          >
            {loading ? "Đang tạo mã QR..." : user ? `Nâng cấp Pro với QR →` : "Đăng nhập để Nâng cấp"}
          </button>
        </div>

        {/* LS Card */}
        <div className="no-grid rounded-2xl p-7 flex flex-col border border-stone-200 bg-stone-50/50">
          <div className="mb-4">
            <span className="text-4xl" style={{ filter: "grayscale(1)" }}>🌐</span>
          </div>
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-stone-400">
            Thẻ tín dụng (Quốc Tế)
          </p>
          <div className="mb-1 flex items-baseline gap-1">
            <p className="text-3xl font-bold font-serif text-stone-400">{currentUSD}</p>
            <p className="text-sm text-stone-400">/ {plan === "monthly" ? "month" : "year"}</p>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-stone-500">
            Thanh toán qua cổng LemonSqueezy (Paddle). Dành cho người dùng quốc tế hoặc dùng thẻ tín dụng.
          </p>
          
          <ul className="mb-8 space-y-2 flex-1 opacity-60">
            <li className="flex items-start gap-2 text-sm text-stone-500">
              <span className="mt-0.5 text-stone-400">✓</span>
              Hỗ trợ thẻ Visa, Mastercard
            </li>
            <li className="flex items-start gap-2 text-sm text-stone-500">
              <span className="mt-0.5 text-stone-400">✓</span>
              Hỗ trợ Apple Pay, Google Pay
            </li>
          </ul>
          
          {lsEnabled && user ? (
            <a
              href={buildCheckoutUrl(plan === "monthly" ? "pro-monthly" : "pro-annual", { uid: user.uid, email: user.email || undefined })}
              className="w-full inline-flex items-center justify-center rounded-full py-3 px-5 text-sm font-semibold transition-opacity bg-stone-200 text-stone-600 hover:bg-stone-300"
            >
              Thanh toán thẻ →
            </a>
          ) : (
            <button
              disabled
              title="Cổng thanh toán đang chờ xét duyệt"
              className="w-full inline-flex items-center justify-center rounded-full py-3 px-5 text-sm font-semibold transition-opacity bg-stone-200 text-stone-400 cursor-not-allowed"
            >
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
