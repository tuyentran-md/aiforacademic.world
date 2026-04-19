"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { createParser, type EventSourceMessage } from "eventsource-parser";
import type {
  IntegrityReport,
  LogEntry,
  PipelineStatus,
  Reference,
  SSEEvent,
} from "@/lib/pipeline/types";

// ── Canvas types ────────────────────────────────────────────────────────────

export type CanvasState = "idle" | "reference" | "editor" | "integrity";

export interface SuggestedAction {
  id: string;
  label: string;
  trigger: () => void;
}

export interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  suggestedActions?: SuggestedAction[];
}

export interface CanvasHistoryEntry {
  state: CanvasState;
  label: string;
  timestamp: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function upsertReference(previous: Reference[], incoming: Reference): Reference[] {
  const index = previous.findIndex((r) => r.id === incoming.id);
  if (index < 0) return [...previous, incoming];
  const clone = [...previous];
  clone[index] = { ...clone[index], ...incoming };
  return clone;
}

async function consumeSSE(
  url: string,
  body: unknown,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (!response.body) throw new Error("Streaming response body is missing");

  const parser = createParser({
    onEvent(event: EventSourceMessage) {
      if (!event.data) return;
      const parsed = JSON.parse(event.data) as SSEEvent;
      startTransition(() => onEvent(parsed));
    },
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value, { stream: true }));
  }
  parser.feed(decoder.decode());
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCanvas() {
  // ── Core state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [canvasState, setCanvasState] = useState<CanvasState>("idle");
  const [canvasHistory, setCanvasHistory] = useState<CanvasHistoryEntry[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hi! I'm AFA Assistant. I can help you **search literature**, **draft a manuscript** (AVR), or **check research integrity** (RIC). What would you like to do?",
    },
  ]);

  const [language, setLanguage] = useState<"EN" | "VI">("EN");
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [manuscript, setManuscript] = useState("");
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [dismissedFlagIds, setDismissedFlagIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Refs (avoid stale closures in SSE handlers) ──────────────────────────
  const mountedRef = useRef(true);
  const languageRef = useRef<"EN" | "VI">("EN");
  const referencesRef = useRef<Reference[]>([]);
  const selectedReferenceIdsRef = useRef<string[]>([]);
  const manuscriptRef = useRef("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const selectedReferences = useMemo(
    () => references.filter((r) => selectedReferenceIds.includes(r.id)),
    [references, selectedReferenceIds],
  );

  const visibleFlags = useMemo(
    () => (integrityReport?.flags || []).filter((f) => !dismissedFlagIds.includes(f.id)),
    [dismissedFlagIds, integrityReport?.flags],
  );

  const isRunning =
    status === "searching" ||
    status === "translating" ||
    status === "drafting" ||
    status === "auditing";

  // ── Canvas history ───────────────────────────────────────────────────────
  function pushCanvas(state: CanvasState, label: string) {
    setCanvasState(state);
    setCanvasHistory((prev) => {
      // Reference stacks; others replace existing entry for that state
      if (state === "reference") {
        return [...prev, { state, label, timestamp: Date.now() }];
      }
      const existing = prev.findIndex((e) => e.state === state);
      if (existing >= 0) {
        const clone = [...prev];
        clone[existing] = { state, label, timestamp: Date.now() };
        return clone;
      }
      return [...prev, { state, label, timestamp: Date.now() }];
    });
  }

  function selectCanvasTab(state: CanvasState) {
    setCanvasState(state);
  }

  // ── Message helpers ──────────────────────────────────────────────────────
  function appendMessage(msg: Omit<Message, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: createId() }]);
  }

  // ── SSE event handler ────────────────────────────────────────────────────
  // NOTE: All setters here use functional updaters to avoid stale closures.
  const handleEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "status":
        setStatus(event.data.status);
        return;

      case "log":
        setLogs((prev) => [
          ...prev,
          {
            id: createId(),
            tool: event.data.tool as LogEntry["tool"],
            message: event.data.message,
            timestamp: event.data.timestamp,
            status: event.data.status,
          },
        ]);
        return;

      case "reference":
        setReferences((prev) => {
          const next = upsertReference(prev, event.data);
          referencesRef.current = next;
          return next;
        });
        setSelectedReferenceIds((prev) => {
          const next = prev.includes(event.data.id) ? prev : [...prev, event.data.id];
          selectedReferenceIdsRef.current = next;
          return next;
        });
        return;

      case "manuscript_chunk":
        setManuscript((prev) => {
          const next = prev + event.data.content;
          manuscriptRef.current = next;
          return next;
        });
        return;

      case "integrity_flag":
        setIntegrityReport((prev) => ({
          overallScore: prev?.overallScore ?? 0,
          summary: prev?.summary ?? "",
          flags: [...(prev?.flags ?? []), event.data],
        }));
        return;

      case "integrity_summary":
        setIntegrityReport((prev) => ({
          overallScore: event.data.score,
          summary: event.data.summary,
          flags: prev?.flags ?? [],
        }));
        return;

      case "error":
        setStatus("error");
        setErrorMessage(event.data.message);
        appendMessage({
          role: "agent",
          text:
            languageRef.current === "EN"
              ? `❌ Error: ${event.data.message}`
              : `❌ Lỗi: ${event.data.message}`,
        });
        return;

      case "done":
        setStatus("completed");

        if (event.data.step === 1) {
          const ids = referencesRef.current.map((r) => r.id);
          selectedReferenceIdsRef.current = ids;
          setSelectedReferenceIds(ids);
          const count = referencesRef.current.length;

          const isEN = languageRef.current === "EN";
          appendMessage({
            role: "agent",
            text:
              count > 0
                ? isEN
                  ? `Found **${count} references**. Please check the Canvas list.`
                  : `Đã tìm thấy **${count} tài liệu**. Vui lòng xem danh sách tại Canvas.`
                : isEN
                ? "No references found. Please try different keywords or language."
                : "Không tìm thấy tài liệu. Vui lòng thử từ khoá hoặc ngôn ngữ khác.",
            suggestedActions:
              count > 0
                ? [
                    {
                      id: "draft",
                      label: isEN ? "✍️ Draft from these references" : "✍️ Viết bản thảo từ tài liệu này",
                      trigger: () => void startAVR(),
                    },
                    {
                      id: "ric",
                      label: isEN ? "🔬 Check my paper against these sources" : "🔬 Kiểm tra bài viết theo nguồn này",
                      trigger: () =>
                        appendMessage({
                          role: "agent",
                          text: isEN
                            ? "Please paste your manuscript into the chat and write 'check this paper' to proceed."
                            : "Vui lòng dán nội dung bài vào chat và gõ 'kiểm tra bài này' để RIC phân tích.",
                        }),
                    },
                  ]
                : undefined,
          });
        }

        if (event.data.step === 2) {
          const isEN = languageRef.current === "EN";
          appendMessage({
            role: "agent",
            text: isEN
              ? "Draft created. You can edit it directly in the Canvas."
              : "Bản thảo đã được tạo. Bạn có thể chỉnh sửa trực tiếp tại Canvas.",
            suggestedActions: [
              {
                id: "check",
                label: isEN ? "🔬 Check draft with RIC" : "🔬 Kiểm tra bản thảo bằng RIC",
                trigger: () => void startRIC(),
              },
              {
                id: "more-refs",
                label: isEN ? "🔍 Search more references" : "🔍 Tìm thêm tài liệu",
                trigger: () =>
                  appendMessage({
                    role: "agent",
                    text: isEN
                      ? "Please type the keywords you want to search for."
                      : "Vui lòng nhập từ khoá bạn muốn tìm thêm.",
                  }),
              },
            ],
          });
        }

        if (event.data.step === 3) {
          const isEN = languageRef.current === "EN";
          appendMessage({
            role: "agent",
            text: isEN
              ? "Check complete! Policy flags are highlighted on the Canvas. Click each item to view details."
              : "Hoàn tất kiểm tra! Các cảnh báo đã được highlight tại Canvas. Click vào từng mục để xem chi tiết.",
            suggestedActions: [
              {
                id: "fix",
                label: isEN ? "✍️ Fix flagged items" : "✍️ Sửa các lỗi cảnh báo",
                trigger: () => void startAVR(),
              },
              {
                id: "find-refs",
                label: isEN ? "🔍 Find citations for flags" : "🔍 Tìm trích dẫn cho cảnh báo",
                trigger: () =>
                  appendMessage({
                    role: "agent",
                    text: isEN
                      ? "Please type keywords to find relevant citations."
                      : "Vui lòng nhập từ khoá để tìm trích dẫn.",
                  }),
              },
            ],
          });
        }
        return;

      default:
        return;
    }
  };

  // ── Search ───────────────────────────────────────────────────────────────
  async function startSearch(query: string, lang?: "EN" | "VI") {
    const useLang = lang ?? languageRef.current;
    languageRef.current = useLang;
    setLanguage(useLang);

    referencesRef.current = [];
    selectedReferenceIdsRef.current = [];
    setReferences([]);
    setSelectedReferenceIds([]);
    setErrorMessage(null);
    setLogs([]);

    pushCanvas("reference", "References");
    appendMessage({
      role: "agent",
      text: useLang === "EN" ? "Searching PubMed and OpenAlex..." : "Đang tìm kiếm trên PubMed và OpenAlex...",
    });

    try {
      await consumeSSE(
        "/api/pipeline/search",
        { query, language: useLang, maxResults: 10 },
        handleEvent,
      );
    } catch (error) {
      setStatus("error");
      const msg = error instanceof Error ? error.message : "Search failed";
      setErrorMessage(msg);
      appendMessage({
        role: "agent",
        text: useLang === "EN" ? `❌ Search error: ${msg}` : `❌ Lỗi tìm kiếm: ${msg}`,
      });
    }
  }

  // ── RIC ──────────────────────────────────────────────────────────────────
  async function startRIC(manuscriptText?: string) {
    const text = manuscriptText ?? manuscriptRef.current;

    if (!text.trim()) {
      appendMessage({
        role: "agent",
        text:
          languageRef.current === "EN"
            ? "Please paste your manuscript into the Canvas Editor (or include it in chat) before running RIC."
            : "Vui lòng dán nội dung bản thảo vào Editor tại Canvas (hoặc gửi kèm trong chat) trước khi chạy RIC.",
      });
      return;
    }

    manuscriptRef.current = text;
    setManuscript(text);

    const refs = referencesRef.current.filter((r) =>
      selectedReferenceIdsRef.current.includes(r.id),
    );

    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setErrorMessage(null);

    pushCanvas("integrity", "RIC Report");
    appendMessage({
      role: "agent",
      text:
        languageRef.current === "EN"
          ? "Scanning manuscript with RIC Audit..."
          : "Đang phân tích bản thảo qua RIC Audit...",
    });

    try {
      await consumeSSE(
        "/api/pipeline/ric",
        { manuscript: text, language: languageRef.current, references: refs },
        handleEvent,
      );
    } catch (error) {
      setStatus("error");
      const msg = error instanceof Error ? error.message : "RIC failed";
      setErrorMessage(msg);
      appendMessage({
        role: "agent",
        text: languageRef.current === "EN" ? `❌ RIC error: ${msg}` : `❌ Lỗi RIC: ${msg}`,
      });
    }
  }

  // ── AVR (placeholder until Tool 2 merges) ────────────────────────────────
  async function startAVR() {
    pushCanvas("editor", "Draft");
    appendMessage({
      role: "agent",
      text:
        languageRef.current === "EN"
          ? "✍️ AVR (AI Drafting) is coming soon. For now, you can paste your draft in the Editor and check it with RIC."
          : "✍️ Tính năng AVR (Viết AI) đang được hoàn thiện. Trong lúc chờ, bạn có thể dán bản thảo vào Editor để sử dụng RIC.",
    });
  }

  // ── Message routing ──────────────────────────────────────────────────────
  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage({ role: "user", text: trimmed });

    const lower = trimmed.toLowerCase();

    const isSearch =
      /tìm|search|tài liệu|literature|pubmed|openalex|paper|nghiên cứu|bài báo|find|look for/.test(lower);
    const isRIC =
      /check|ric|kiểm tra|soát lỗi|integrity|plagiarism|lỗi trích|review bài|xem bài|audit|verify/.test(lower);
    const isAVR =
      /viết|draft|avr|dàn ý|outline|bản thảo|manuscript|lên ý|bắt đầu viết|write|writing/.test(lower);

    if (isSearch) {
      void startSearch(trimmed);
      return;
    }

    if (isRIC) {
      // Try to extract pasted manuscript after a colon or newline
      const colonIdx = trimmed.indexOf(":\n");
      const newlineIdx = trimmed.indexOf("\n");
      const bodyStart = colonIdx >= 0 ? colonIdx + 2 : newlineIdx >= 0 ? newlineIdx + 1 : -1;
      const body = bodyStart >= 0 ? trimmed.slice(bodyStart).trim() : "";
      void startRIC(body || undefined);
      return;
    }

    if (isAVR) {
      void startAVR();
      return;
    }

    // Fallback
    appendMessage({
      role: "agent",
      text:
        languageRef.current === "EN"
          ? "I couldn't catch that. Do you want to:\n• **Search**: 'Find papers on [topic]'\n• **Write / Draft**: 'Draft a manuscript about [topic]'\n• **Check**: 'Check this paper:' then paste your text"
          : "Hệ thống chưa hiểu rõ yêu cầu. Bạn muốn:\n• **Tìm tài liệu**: gõ 'Tìm tài liệu về...'\n• **Viết bài**: gõ 'Viết bản thảo về...'\n• **Kiểm tra**: gõ 'Kiểm tra bài này:' kèm theo nội dung",
    });
  }

  // ── Reference management ─────────────────────────────────────────────────
  function toggleReference(id: string) {
    setSelectedReferenceIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      selectedReferenceIdsRef.current = next;
      return next;
    });
  }

  function removeReference(id: string) {
    setReferences((prev) => {
      const next = prev.filter((r) => r.id !== id);
      referencesRef.current = next;
      return next;
    });
    setSelectedReferenceIds((prev) => {
      const next = prev.filter((i) => i !== id);
      selectedReferenceIdsRef.current = next;
      return next;
    });
  }

  function updateManuscript(text: string) {
    manuscriptRef.current = text;
    setManuscript(text);
  }

  function dismissFlag(flagId: string) {
    setDismissedFlagIds((prev) => (prev.includes(flagId) ? prev : [...prev, flagId]));
  }

  function updateLanguage(lang: "EN" | "VI") {
    languageRef.current = lang;
    setLanguage(lang);
  }

  function reset() {
    referencesRef.current = [];
    selectedReferenceIdsRef.current = [];
    manuscriptRef.current = "";
    setStatus("idle");
    setCanvasState("idle");
    setCanvasHistory([]);
    setMessages([
      {
        id: "welcome",
        role: "agent",
        text:
          languageRef.current === "EN"
            ? "Hi! I'm AFA Assistant. I can help you **search literature**, **draft a manuscript** (AVR), or **check research integrity** (RIC). What would you like to do?"
            : "Xin chào! Đây là trợ lý AFA. Tôi có thể hỗ trợ **tìm tài liệu**, **viết bản thảo** (AVR), hoặc **kiểm tra toàn vẹn học thuật** (RIC). Bạn muốn bắt đầu với chức năng nào?",
      },
    ]);
    setLanguage(languageRef.current);
    setReferences([]);
    setSelectedReferenceIds([]);
    setManuscript("");
    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setLogs([]);
    setErrorMessage(null);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    // State
    status,
    isRunning,
    canvasState,
    canvasHistory,
    messages,
    language,
    references,
    selectedReferenceIds,
    selectedReferences,
    manuscript,
    integrityReport: integrityReport ? { ...integrityReport, flags: visibleFlags } : null,
    logs,
    errorMessage,
    // Actions
    sendMessage,
    startSearch,
    startRIC,
    startAVR,
    selectCanvasTab,
    toggleReference,
    removeReference,
    updateManuscript,
    dismissFlag,
    updateLanguage,
    reset,
  };
}
