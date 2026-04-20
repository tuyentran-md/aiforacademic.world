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
import {
  saveSession,
  trackUsage,
  cacheReference,
} from "@/lib/firebase/sessions";

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

export function useCanvas(userId?: string) {
  // ── Core state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [canvasState, setCanvasState] = useState<CanvasState>("idle");
  const [canvasHistory, setCanvasHistory] = useState<CanvasHistoryEntry[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Welcome to AI for Academic — your research mentor.\n\nStart by typing a research question in the Canvas — I'll find relevant papers, help you draft a manuscript, and check it for integrity issues before you submit.",
    },
  ]);

  const [language, setLanguage] = useState<"EN" | "VI">("EN");
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [translatingIds, setTranslatingIds] = useState<string[]>([]);
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
  const sessionIdRef = useRef<string | null>(null);
  const queryRef = useRef(""); // last search query — used by AVR

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
          // Cache reference to Firestore by DOI (fire-and-forget)
          void cacheReference(event.data);
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
              ? `Error: ${event.data.message}`
              : `Lỗi: ${event.data.message}`,
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
                      label: isEN ? "Draft from these references" : "Viết bản thảo từ tài liệu này",
                      trigger: () => void startAVR(),
                    },
                    {
                      id: "ric",
                      label: isEN ? "Check my paper against these sources" : "Kiểm tra bài viết theo nguồn này",
                      trigger: () =>
                        appendMessage({
                          role: "agent",
                          text: isEN
                            ? "Please paste your manuscript into the chat and write 'check this paper' to proceed."
                            : "Vui lòng dán nội dung bài vào chat và gõ 'kiểm tra bài này' để phân tích.",
                        }),
                    },
                  ]
                : undefined,
          });
          // Save session to Firestore (fire-and-forget)
          if (userId && count > 0) {
            void saveSession(
              userId,
              {
                query: referencesRef.current[0]?.title ?? "",
                language: languageRef.current,
                referenceIds: referencesRef.current.map((r) => r.id),
              },
            ).then((id) => { sessionIdRef.current = id; });
          }
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
                label: isEN ? "Check Integrity" : "Kiểm tra tính toàn vẹn",
                trigger: () => void startRIC(),
              },
              {
                id: "more-refs",
                label: isEN ? "Search more references" : "Tìm thêm tài liệu",
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
          // Update session with manuscript (fire-and-forget)
          if (userId) {
            void saveSession(
              userId,
              { manuscript: manuscriptRef.current },
              sessionIdRef.current ?? undefined,
            ).then((id) => { if (id) sessionIdRef.current = id; });
            void trackUsage(userId, "avr");
          }
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
                label: isEN ? "Fix flagged items" : "Sửa các lỗi cảnh báo",
                trigger: () => void startAVR(),
              },
              {
                id: "find-refs",
                label: isEN ? "Find citations for flags" : "Tìm trích dẫn cho cảnh báo",
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
          // Update session with integrity score (fire-and-forget)
          if (userId) {
            void saveSession(
              userId,
              { integrityScore: integrityReport?.overallScore },
              sessionIdRef.current ?? undefined,
            ).then((id) => { if (id) sessionIdRef.current = id; });
            void trackUsage(userId, "ric");
          }
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
    queryRef.current = query; // store for AVR

    pushCanvas("reference", "References");
    appendMessage({
      role: "agent",
      text: useLang === "EN" ? "Searching PubMed and OpenAlex..." : "Đang tìm kiếm trên PubMed và OpenAlex...",
    });

    try {
      if (userId) void trackUsage(userId, "search");
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
        text: useLang === "EN" ? `Search failed: ${msg}` : `Tìm kiếm thất bại: ${msg}`,
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
            ? "Please paste your manuscript into the Editor (or upload a file) before checking."
            : "Vui lòng dán bản thảo vào Editor (hoặc tải tệp lên) trước khi kiểm tra.",
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

    pushCanvas("integrity", "Integrity Report");
    appendMessage({
      role: "agent",
      text:
        languageRef.current === "EN"
          ? "Analyzing your manuscript for integrity issues..."
          : "Đang phân tích bản thảo để kiểm tra toàn vẹn học thuật...",
    });

    try {
      await consumeSSE(
        "/api/pipeline/ric",
        { manuscript: text, language: languageRef.current, references: refs },
        handleEvent,
      );
    } catch (error) {
      setStatus("error");
      const msg = error instanceof Error ? error.message : "Integrity check failed";
      setErrorMessage(msg);
      appendMessage({
        role: "agent",
        text: languageRef.current === "EN" ? `Integrity check failed: ${msg}` : `Kiểm tra thất bại: ${msg}`,
      });
    }
  }

  // ── AVR ──────────────────────────────────────────────────────────────────
  async function startAVR() {
    const query = queryRef.current;
    if (!query.trim()) {
      appendMessage({
        role: "agent",
        text:
          languageRef.current === "EN"
            ? "Please search for references first, then click Draft."
            : "Vui lòng tìm tài liệu trước, sau đó bấm Viết bản thảo.",
      });
      return;
    }

    const refs = referencesRef.current.filter((r) =>
      selectedReferenceIdsRef.current.includes(r.id),
    );

    if (refs.length === 0) {
      appendMessage({
        role: "agent",
        text:
          languageRef.current === "EN"
            ? "Please select at least one reference to draft from."
            : "Vui lòng chọn ít nhất một tài liệu để viết.",
      });
      return;
    }

    setManuscript("");
    manuscriptRef.current = "";
    setErrorMessage(null);
    pushCanvas("editor", "Draft");

    appendMessage({
      role: "agent",
      text:
        languageRef.current === "EN"
          ? `Generating manuscript draft from ${refs.length} selected references...`
          : `Đang tạo bản thảo từ ${refs.length} tài liệu đã chọn...`,
    });

    try {
      if (userId) void trackUsage(userId, "avr");
      await consumeSSE(
        "/api/pipeline/avr",
        { query, references: refs, language: languageRef.current },
        handleEvent,
      );
    } catch (error) {
      setStatus("error");
      const msg = error instanceof Error ? error.message : "AVR failed";
      setErrorMessage(msg);
      appendMessage({
        role: "agent",
        text:
          languageRef.current === "EN"
            ? `Draft generation failed: ${msg}`
            : `Tạo bản thảo thất bại: ${msg}`,
      });
    }
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

    // Smart fallback: if user is on idle screen and types anything ≥ 3 words
    // treat it as a research question and search directly
    if (canvasState === "idle" && trimmed.split(/\s+/).length >= 3) {
      void startSearch(trimmed);
      return;
    }

    // Fallback
    appendMessage({
      role: "agent",
      text:
        languageRef.current === "EN"
          ? "I'm not sure what you'd like to do. Try typing a research question — for example: 'laparoscopic vs open appendectomy in children' — and I'll find relevant papers."
          : "Tôi chưa hiểu rõ yêu cầu. Hãy thử nhập câu hỏi nghiên cứu — ví dụ: 'So sánh phẫu thuật nội soi và mổ mở ruột thừa ở trẻ em' — tôi sẽ tìm tài liệu.",
    });
  }

  // ── Open editor directly (adds to canvas history for back-navigation) ────
  function openEditor() {
    pushCanvas("editor", "Your manuscript");
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

  async function translateReference(id: string) {
    const ref = referencesRef.current.find((r) => r.id === id);
    if (!ref || ref.abstractTranslated) return;

    setTranslatingIds((prev) => [...prev, id]);

    try {
      const res = await fetch("/api/pipeline/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ref.id,
          abstract: ref.abstract,
          targetLanguage: "VI",
        }),
      });

      if (!res.ok) throw new Error("Translation failed");

      const data = await res.json();

      if (data.abstractTranslated) {
        setReferences((prev) => {
          const next = prev.map((r) => (r.id === id ? { ...r, abstractTranslated: data.abstractTranslated } : r));
          referencesRef.current = next;
          return next;
        });
        if (userId) void trackUsage(userId, "translate");
      }
    } catch (error) {
      console.error(error);
      appendMessage({
        role: "agent",
        text:
          languageRef.current === "EN"
            ? "Translation failed. Please try again."
            : "Dịch thất bại. Vui lòng thử lại.",
      });
    } finally {
      setTranslatingIds((prev) => prev.filter((i) => i !== id));
    }
  }

  function dismissFlag(flagId: string) {
    setDismissedFlagIds((prev) => (prev.includes(flagId) ? prev : [...prev, flagId]));
  }

  async function bulkTranslate(ids: string[]) {
    for (const id of ids) {
      await translateReference(id);
    }
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
            ? "Welcome to AI for Academic — your research mentor.\n\nStart by typing a research question in the Canvas — I'll find relevant papers, help you draft a manuscript, and check it for integrity issues before you submit."
            : "Chào mừng đến AI for Academic — trợ lý nghiên cứu của bạn.\n\nBắt đầu bằng cách nhập câu hỏi nghiên cứu ở Canvas bên phải — tôi sẽ tìm tài liệu, giúp bạn viết bản thảo, và kiểm tra trước khi nộp.",
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
    translatingIds,
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
    openEditor,
    translateReference,
    bulkTranslate,
    selectCanvasTab,
    toggleReference,
    removeReference,
    updateManuscript,
    dismissFlag,
    updateLanguage,
    reset,
  };
}
