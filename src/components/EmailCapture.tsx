"use client";

import { useState } from "react";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-4">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div
          className="rounded-2xl px-6 py-5 md:px-10 md:py-6"
          style={{ backgroundColor: "#EDE8DF" }}
        >
          {status === "success" ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-base font-semibold text-stone-900 mb-1">Done!</p>
                <p className="text-sm text-stone-500">
                  Check your inbox — and download the workflow here:
                </p>
              </div>
              <a
                href="https://tuyentranmd.com/workflow_map.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#C4634E", color: "white" }}
              >
                Download PDF&thinsp;↓
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <p className="text-base font-semibold text-stone-900 mb-1">
                  Get the AI Research Workflow — free
                </p>
                <p className="text-sm text-stone-500 leading-relaxed">
                  How I use AI at every stage of a clinical paper. One page, practical, no hype.
                </p>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2 w-full md:w-auto"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 md:w-56 px-4 py-2.5 rounded-full text-sm bg-white border border-black/10 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: "#1a1a18", color: "#f5f2ed" }}
                >
                  {status === "loading" ? "Sending..." : "Send it to me"}
                </button>
              </form>
            </div>
          )}
          {status === "error" && (
            <p className="text-xs text-red-500 mt-2">Something went wrong — please try again.</p>
          )}
          {status !== "success" && (
            <p className="text-[11px] text-stone-400 mt-3">No spam. New posts and research updates only.</p>
          )}
        </div>
      </div>
    </section>
  );
}
