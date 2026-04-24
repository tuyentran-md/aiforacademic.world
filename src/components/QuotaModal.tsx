"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/LangContext";

interface QuotaInfo {
  resetAt?: string;
  upgradeUrl?: string;
}

const copy = {
  EN: {
    title: "You've reached today's free limit",
    body: "Free quota resets at midnight UTC. If you need more runs sooner, Pro unlocks higher daily limits across every tool.",
    whyTitle: "Why subscribe?",
    why: "Each run uses Gemini API credits and cloud compute. Pro subscriptions help us keep the infrastructure running and the free tier generous for everyone — it's not a profit margin, it's how the lights stay on.",
    later: "Maybe later",
    cta: "See plans",
  },
  VI: {
    title: "Bạn đã hết lượt dùng miễn phí hôm nay",
    body: "Quota miễn phí sẽ reset vào nửa đêm UTC. Nếu cần dùng nhiều hơn, Pro mở khóa giới hạn cao hơn cho tất cả tools.",
    whyTitle: "Vì sao nên subscribe?",
    why: "Mỗi lần chạy đều tốn credit Gemini API và compute trên cloud. Subscribe Pro giúp duy trì infrastructure để free tier vẫn hào phóng cho mọi người — đây không phải lợi nhuận, mà là chi phí vận hành.",
    later: "Để sau",
    cta: "Xem các gói",
  },
};

export default function QuotaModal() {
  const { lang } = useLang();
  const t = copy[lang];
  const [info, setInfo] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<QuotaInfo>).detail || {};
      setInfo(detail);
    };
    window.addEventListener("afa:quota-exceeded", handler);
    return () => window.removeEventListener("afa:quota-exceeded", handler);
  }, []);

  if (!info) return null;

  const close = () => setInfo(null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <div
        className="max-w-md w-full bg-white rounded-2xl p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">{t.title}</h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">{t.body}</p>
        <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 mb-5">
          <p className="text-xs text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-700">{t.whyTitle}</span> {t.why}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={close}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            {t.later}
          </button>
          <Link
            href={info.upgradeUrl || "/account/billing"}
            onClick={close}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4634E" }}
          >
            {t.cta} →
          </Link>
        </div>
      </div>
    </div>
  );
}
