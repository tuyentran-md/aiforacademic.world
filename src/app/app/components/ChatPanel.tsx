"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Message, SuggestedAction } from "@/hooks/useCanvas";

// ── Simple markdown bold renderer ────────────────────────────────────────────
function renderText(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Handle newlines
    return part.split("\n").map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

// ── Props ────────────────────────────────────────────────────────────────────
interface ChatPanelProps {
  messages: Message[];
  isRunning: boolean;
  onSendMessage: (text: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatPanel({ messages, isRunning, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasInput = input.trim().length > 0;

  function handleSubmit() {
    const text = input.trim();
    if (!text || isRunning) return;
    onSendMessage(text);
    setInput("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleChipClick(action: SuggestedAction) {
    action.trigger();
  }

  // Get suggested actions from the last agent message (only if user hasn't started typing)
  const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent");
  const chips = !hasInput ? (lastAgentMsg?.suggestedActions ?? []) : [];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Message list ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isLast = idx === messages.length - 1;

          return (
            <div key={msg.id}>
              <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {/* Agent avatar */}
                {!isUser && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C4634E] flex items-center justify-center text-white font-bold text-[10px] mb-0.5">
                    A
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`
                    px-3.5 py-2.5 rounded-2xl max-w-[82%] text-sm leading-relaxed shadow-sm
                    ${isUser
                      ? "bg-stone-900 text-white rounded-br-sm"
                      : "bg-white border border-black/[0.07] text-stone-800 rounded-bl-sm"
                    }
                  `}
                >
                  {renderText(msg.text)}
                </div>
              </div>

              {/* Typing indicator — only on the last agent message while running */}
              {!isUser && isLast && isRunning && (
                <div className="flex items-center gap-2 mt-2 ml-8">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-stone-400">AI đang xử lý...</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator when running but last message is from user */}
        {isRunning && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 ml-8">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-stone-400">AI đang xử lý...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested action chips ────────────────────────────────────── */}
      {chips.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
          {chips.slice(0, 3).map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C4634E]/30 bg-[#C4634E]/5 text-[#C4634E] text-xs font-medium hover:bg-[#C4634E]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="relative rounded-xl border border-black/[0.1] bg-white shadow-sm focus-within:border-stone-300 focus-within:shadow-md transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isRunning}
            placeholder="Nhập yêu cầu... (VD: Tìm tài liệu về phẫu thuật vạt da)"
            className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-sm text-stone-800 placeholder-stone-400 outline-none leading-relaxed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasInput || isRunning}
            className="absolute right-3 bottom-3 w-7 h-7 rounded-lg bg-[#C4634E] text-white flex items-center justify-center hover:bg-[#b45743] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-stone-400 text-center">
          Enter để gửi · Shift+Enter xuống dòng
        </p>
      </div>
    </div>
  );
}
