"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useLang } from "@/context/LangContext";
import { PAYMENT } from "@/lib/i18n/strings";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");
  const { lang } = useLang();
  const s = (key: keyof typeof PAYMENT) => PAYMENT[key][lang];

  const [status, setStatus] = useState<"polling" | "success" | "timeout" | "error">("polling");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    const startTime = Date.now();
    const timeoutMs = 60000;

    const checkStatus = async () => {
      try {
        const res = await apiFetch(`/api/payment/status?order=${orderId}`);
        const data = await res.json();

        if (data.status === "paid") {
          setStatus("success");
          if (intervalId) clearInterval(intervalId);
          setTimeout(() => {
            router.push("/workspace");
          }, 2000);
        } else if (Date.now() - startTime > timeoutMs) {
          setStatus("timeout");
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, router]);

  useEffect(() => {
    if (status !== "polling") return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      {status === "polling" && (
        <>
          <div className="mb-6 animate-spin text-[#C4634E]">
            <svg className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-stone-800">
            {s("pollingTitle")}
          </h2>
          <p className="mt-2 text-stone-500">
            {s("pollingDesc")}{dots}
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mb-6 text-green-500">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-stone-800">
            {s("successTitle")}
          </h2>
          <p className="mt-2 text-stone-500">
            {s("successDesc")}
          </p>
        </>
      )}

      {status === "timeout" && (
        <>
          <div className="mb-6 text-amber-500">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-stone-800">
            {s("pendingTitle")}
          </h2>
          <p className="mt-2 max-w-md text-stone-500">
            {s("pendingDesc")}
          </p>
          <button
            onClick={() => router.push("/workspace")}
            className="mt-6 rounded-lg bg-stone-900 px-6 py-2 text-white hover:bg-stone-800 transition-colors"
          >
            {s("goToWorkspace")}
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <h2 className="text-2xl font-semibold text-stone-800">
            {s("failedTitle")}
          </h2>
          <p className="mt-2 text-stone-500">
            {s("failedDesc")}
          </p>
          <button
            onClick={() => router.push("/account/billing")}
            className="mt-6 rounded-lg bg-stone-900 px-6 py-2 text-white hover:bg-stone-800 transition-colors"
          >
            {s("backToBilling")}
          </button>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
