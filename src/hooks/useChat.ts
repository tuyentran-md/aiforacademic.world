"use client";

import { useState, useCallback } from "react";

import { apiFetch } from "@/lib/api-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  artifactId?: string;
  isStreaming?: boolean;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Chào mừng đến AFA Workspace! 👋\n\nEm là AFA — trợ lý nghiên cứu AI của sếp.\n\n**Phase 1 🔍** Tìm tài liệu, tải full-text, dịch bài\n**Phase 2 ✍️** Validate idea, outline PICO, draft manuscript\n**Phase 3 ✅** Check citations, AI detect, plagiarism, peer review\n\nSếp bắt đầu từ đâu?",
};

/**
 * useChat — manages message streaming + history for the Workspace.
 */
export function useChat(systemPrompt: string, outputLanguage: "VI" | "EN" = "VI") {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);

  function createId() { return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

  function reset(welcomeText?: string) {
    setMessages([{ ...WELCOME, id: createId(), text: welcomeText ?? WELCOME.text }]);
  }

  function loadMessages(msgs: Message[]) {
    if (msgs.length > 0) setMessages(msgs);
  }

  const sendMessage = useCallback(async (
    content: string,
    onAssistantChunk?: (id: string, text: string) => void,
    onToolCall?: (text: string) => Promise<{ cleanText: string; artifactId: string } | null>,
    onSave?: (role: "user" | "assistant", text: string, artifactId?: string) => Promise<void>,
  ): Promise<Message | null> => {
    if (!content.trim() || isLoading) return null;
    setIsLoading(true);

    const userMsgId = createId();
    const assistantId = createId();
    const userMsg: Message = { id: userMsgId, role: "user", text: content };
    const assistantMsg: Message = { id: assistantId, role: "assistant", text: "", isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    void onSave?.("user", content);

    const history = messages.slice(-10).concat(userMsg).map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.text }],
    }));

    try {
      const res = await apiFetch("/api/workspace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, systemPrompt, outputLanguage }),
      });

      if (!res.ok || !res.body) throw new Error("Chat failed");

      let fullText = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: fullText } : m));
        onAssistantChunk?.(assistantId, fullText);
      }

      let finalMsg: Message;
      if (onToolCall) {
        const toolResult = await onToolCall(fullText);
        if (toolResult) {
          finalMsg = { id: assistantId, role: "assistant", text: toolResult.cleanText, artifactId: toolResult.artifactId, isStreaming: false };
          setMessages((prev) => prev.map((m) => m.id === assistantId ? finalMsg : m));
          void onSave?.("assistant", toolResult.cleanText, toolResult.artifactId);
          setIsLoading(false);
          return finalMsg;
        }
      }

      finalMsg = { id: assistantId, role: "assistant", text: fullText, isStreaming: false };
      setMessages((prev) => prev.map((m) => m.id === assistantId ? finalMsg : m));
      void onSave?.("assistant", fullText);
      setIsLoading(false);
      return finalMsg;
    } catch (error) {
      const errText = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: `Lỗi: ${errText}`, isStreaming: false } : m));
      setIsLoading(false);
      return null;
    }
  }, [messages, isLoading, systemPrompt, outputLanguage]);

  return { messages, isLoading, sendMessage, reset, loadMessages };
}
