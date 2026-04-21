"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { createParser, type EventSourceMessage } from "eventsource-parser";
import type {
  ArticleType,
  Blueprint,
  IntegrityReport,
  LogEntry,
  PipelineStatus,
  Reference,
  SSEEvent,
} from "@/lib/pipeline/types";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function appendLog(
  previous: LogEntry[],
  next: Omit<LogEntry, "id">,
): LogEntry[] {
  return [...previous, { ...next, id: createId() }];
}

function upsertReference(previous: Reference[], incoming: Reference): Reference[] {
  const index = previous.findIndex((reference) => reference.id === incoming.id);
  if (index < 0) {
    return [...previous, incoming];
  }

  const clone = [...previous];
  clone[index] = {
    ...clone[index],
    ...incoming,
  };
  return clone;
}

import { apiFetch } from "@/lib/api-client";

async function consumeSSE(
  url: string,
  body: unknown,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const response = await apiFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is missing");
  }

  const parser = createParser({
    onEvent(event: EventSourceMessage) {
      if (!event.data) {
        return;
      }

      const parsed = JSON.parse(event.data) as SSEEvent;
      startTransition(() => onEvent(parsed));
    },
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    parser.feed(decoder.decode(value, { stream: true }));
  }

  parser.feed(decoder.decode());
}

function updateReportSummary(
  previous: IntegrityReport | null,
  next: Pick<IntegrityReport, "overallScore" | "summary">,
): IntegrityReport {
  return {
    overallScore: next.overallScore,
    summary: next.summary,
    flags: previous?.flags || [],
  };
}

export function usePipeline() {
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [activeView, setActiveView] = useState<1 | 2 | 3>(1);
  const [autoChain, setAutoChainState] = useState(true);
  const [language, setLanguage] = useState<"EN" | "VI">("EN");
  const [query, setQuery] = useState("");
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [manuscript, setManuscript] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [dismissedFlagIds, setDismissedFlagIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const autoChainRef = useRef(true);
  const queryRef = useRef("");
  const languageRef = useRef<"EN" | "VI">("EN");
  const referencesRef = useRef<Reference[]>([]);
  const selectedReferenceIdsRef = useRef<string[]>([]);
  const manuscriptRef = useRef("");
  const autoStepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearAutoStepTimeout();
    };
  }, []);

  const selectedReferences = useMemo(
    () => references.filter((reference) => selectedReferenceIds.includes(reference.id)),
    [references, selectedReferenceIds],
  );

  const visibleFlags = useMemo(
    () => (integrityReport?.flags || []).filter((flag) => !dismissedFlagIds.includes(flag.id)),
    [dismissedFlagIds, integrityReport?.flags],
  );

  const isRunning =
    status === "searching" ||
    status === "translating" ||
    status === "drafting" ||
    status === "auditing";

  function clearAutoStepTimeout() {
    if (autoStepTimeoutRef.current) {
      clearTimeout(autoStepTimeoutRef.current);
      autoStepTimeoutRef.current = null;
    }
  }

  function scheduleAutoStep(step: 2 | 3) {
    clearAutoStepTimeout();
    autoStepTimeoutRef.current = setTimeout(() => {
      autoStepTimeoutRef.current = null;
      if (!mountedRef.current || !autoChainRef.current) {
        return;
      }

      if (step === 2) {
        void startAVR();
        return;
      }

      void startRIC();
    }, 1500);
  }

  function setAutoChain(nextAutoChain: boolean) {
    autoChainRef.current = nextAutoChain;
    setAutoChainState(nextAutoChain);

    if (!nextAutoChain) {
      clearAutoStepTimeout();
      return;
    }

    if (status === "completed" && currentStep === 2 && referencesRef.current.length > 0 && !manuscriptRef.current.trim()) {
      scheduleAutoStep(2);
    }

    if (status === "completed" && currentStep === 3 && manuscriptRef.current.trim() && !integrityReport) {
      scheduleAutoStep(3);
    }
  }

  function pauseAutoChain() {
    setAutoChain(false);
  }

  function updateLanguage(nextLanguage: "EN" | "VI") {
    languageRef.current = nextLanguage;
    setLanguage(nextLanguage);
  }

  async function startAVR(articleType?: ArticleType) {
    const nextSelectedReferences = referencesRef.current.filter((reference) =>
      selectedReferenceIdsRef.current.includes(reference.id),
    );

    clearAutoStepTimeout();
    setStatus("drafting");
    setCurrentStep(2);
    setActiveView(2);
    manuscriptRef.current = "";
    setManuscript("");
    setBlueprint(null);
    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setErrorMessage(null);

    try {
      await consumeSSE(
        "/api/pipeline/avr",
        {
          query: queryRef.current,
          language: languageRef.current,
          articleType,
          references: nextSelectedReferences,
        },
        handleEvent,
      );
    } catch (error) {
      clearAutoStepTimeout();
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "AVR failed");
    }
  }

  async function startRIC() {
    const nextSelectedReferences = referencesRef.current.filter((reference) =>
      selectedReferenceIdsRef.current.includes(reference.id),
    );

    clearAutoStepTimeout();
    setStatus("auditing");
    setCurrentStep(3);
    setActiveView(3);
    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setErrorMessage(null);

    try {
      await consumeSSE(
        "/api/pipeline/ric",
        {
          manuscript: manuscriptRef.current,
          language: languageRef.current,
          references: nextSelectedReferences,
        },
        handleEvent,
      );
    } catch (error) {
      clearAutoStepTimeout();
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "RIC failed");
    }
  }

  const handleEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "status":
        setStatus(event.data.status);
        if (event.data.status === "searching" || event.data.status === "translating") {
          setCurrentStep(1);
        }
        if (event.data.status === "drafting") {
          setCurrentStep(2);
        }
        if (event.data.status === "auditing") {
          setCurrentStep(3);
        }
        return;
      case "log":
        setLogs((previous) =>
          appendLog(previous, {
            tool: event.data.tool as LogEntry["tool"],
            message: event.data.message,
            timestamp: event.data.timestamp,
            status: event.data.status,
          }),
        );
        return;
      case "reference":
        setReferences((previous) => {
          const nextReferences = upsertReference(previous, event.data);
          referencesRef.current = nextReferences;
          return nextReferences;
        });
        setSelectedReferenceIds((previous) => {
          const nextIds = previous.includes(event.data.id) ? previous : [...previous, event.data.id];
          selectedReferenceIdsRef.current = nextIds;
          return nextIds;
        });
        return;
      case "blueprint":
        setBlueprint(event.data);
        return;
      case "manuscript_chunk":
        setManuscript((previous) => {
          const nextManuscript = previous + event.data.content;
          manuscriptRef.current = nextManuscript;
          return nextManuscript;
        });
        return;
      case "integrity_flag":
        setIntegrityReport((previous) => ({
          overallScore: previous?.overallScore || 0,
          summary: previous?.summary || "",
          flags: [...(previous?.flags || []), event.data],
        }));
        return;
      case "integrity_summary":
        setIntegrityReport((previous) =>
          updateReportSummary(previous, {
            overallScore: event.data.score,
            summary: event.data.summary,
          }),
        );
        return;
      case "error":
        clearAutoStepTimeout();
        setStatus("error");
        setErrorMessage(event.data.message);
        setLogs((previous) =>
          appendLog(previous, {
            tool: "System",
            message: event.data.message,
            timestamp: new Date().toISOString(),
            status: "error",
          }),
        );
        return;
      case "done":
        if (event.data.step === 1) {
          const nextSelectedIds = referencesRef.current.map((reference) => reference.id);
          selectedReferenceIdsRef.current = nextSelectedIds;
          setSelectedReferenceIds(nextSelectedIds);
          setCurrentStep(2);
          if (autoChainRef.current && referencesRef.current.length > 0) {
            scheduleAutoStep(2);
          }
        }
        if (event.data.step === 2) {
          setCurrentStep(3);
          if (autoChainRef.current && manuscriptRef.current.trim()) {
            scheduleAutoStep(3);
          }
        }
        if (event.data.step === 3) {
          clearAutoStepTimeout();
          setCurrentStep(3);
        }
        return;
      default:
        return;
    }
  };

  async function startSearch(nextQuery: string, nextLanguage: "EN" | "VI") {
    clearAutoStepTimeout();
    autoChainRef.current = true;
    queryRef.current = nextQuery;
    languageRef.current = nextLanguage;
    referencesRef.current = [];
    selectedReferenceIdsRef.current = [];
    manuscriptRef.current = "";
    setQuery(nextQuery);
    setLanguage(nextLanguage);
    setAutoChainState(true);
    setStatus("searching");
    setCurrentStep(1);
    setActiveView(1);
    setReferences([]);
    setSelectedReferenceIds([]);
    setManuscript("");
    setBlueprint(null);
    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setLogs([]);
    setErrorMessage(null);

    try {
      await consumeSSE(
        "/api/pipeline/search",
        { query: nextQuery, language: nextLanguage, maxResults: 10 },
        handleEvent,
      );
    } catch (error) {
      clearAutoStepTimeout();
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Search failed");
    }
  }

  function toggleReference(referenceId: string) {
    setSelectedReferenceIds((previous) => {
      const nextIds = previous.includes(referenceId)
        ? previous.filter((id) => id !== referenceId)
        : [...previous, referenceId];
      selectedReferenceIdsRef.current = nextIds;
      return nextIds;
    });
  }

  function removeReference(referenceId: string) {
    setReferences((previous) => {
      const nextReferences = previous.filter((reference) => reference.id !== referenceId);
      referencesRef.current = nextReferences;
      return nextReferences;
    });
    setSelectedReferenceIds((previous) => {
      const nextIds = previous.filter((id) => id !== referenceId);
      selectedReferenceIdsRef.current = nextIds;
      return nextIds;
    });
  }

  function updateManuscript(nextManuscript: string) {
    pauseAutoChain();
    manuscriptRef.current = nextManuscript;
    setManuscript(nextManuscript);
  }

  function dismissFlag(flagId: string) {
    setDismissedFlagIds((previous) =>
      previous.includes(flagId) ? previous : [...previous, flagId],
    );
  }

  function reset() {
    clearAutoStepTimeout();
    autoChainRef.current = true;
    queryRef.current = "";
    referencesRef.current = [];
    selectedReferenceIdsRef.current = [];
    manuscriptRef.current = "";
    setStatus("idle");
    setCurrentStep(1);
    setActiveView(1);
    setAutoChainState(true);
    setQuery("");
    setReferences([]);
    setSelectedReferenceIds([]);
    setManuscript("");
    setBlueprint(null);
    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setLogs([]);
    setErrorMessage(null);
  }

  function selectView(step: 1 | 2 | 3) {
    pauseAutoChain();
    setActiveView(step);
  }

  return {
    status,
    currentStep,
    activeView,
    autoChain,
    language,
    query,
    references,
    selectedReferenceIds,
    selectedReferences,
    manuscript,
    blueprint,
    integrityReport: integrityReport
      ? {
          ...integrityReport,
          flags: visibleFlags,
        }
      : null,
    logs,
    errorMessage,
    isRunning,
    setAutoChain,
    selectView,
    startSearch,
    startAVR,
    startRIC,
    setLanguage: updateLanguage,
    reset,
    toggleReference,
    removeReference,
    updateManuscript,
    dismissFlag,
  };
}
