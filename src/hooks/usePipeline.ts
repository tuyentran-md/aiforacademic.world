"use client";

import { startTransition, useMemo, useState } from "react";
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

async function consumeSSE(
  url: string,
  body: unknown,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const response = await fetch(url, {
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

  const handleEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "status":
        setStatus(event.data.status);
        if (event.data.status === "searching" || event.data.status === "translating") {
          setCurrentStep(1);
          setActiveView(1);
        }
        if (event.data.status === "drafting") {
          setCurrentStep(2);
          setActiveView(2);
        }
        if (event.data.status === "auditing") {
          setCurrentStep(3);
          setActiveView(3);
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
        setReferences((previous) => upsertReference(previous, event.data));
        setSelectedReferenceIds((previous) =>
          previous.includes(event.data.id) ? previous : [...previous, event.data.id],
        );
        return;
      case "blueprint":
        setBlueprint(event.data);
        return;
      case "manuscript_chunk":
        setManuscript((previous) => previous + event.data.content);
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
          setCurrentStep(2);
        }
        if (event.data.step === 2) {
          setCurrentStep(3);
        }
        if (event.data.step === 3) {
          setCurrentStep(3);
        }
        return;
      default:
        return;
    }
  };

  async function startSearch(nextQuery: string, nextLanguage: "EN" | "VI") {
    setQuery(nextQuery);
    setLanguage(nextLanguage);
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
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Search failed");
    }
  }

  async function startAVR(articleType?: ArticleType) {
    setStatus("drafting");
    setCurrentStep(2);
    setActiveView(2);
    setManuscript("");
    setBlueprint(null);
    setIntegrityReport(null);
    setDismissedFlagIds([]);
    setErrorMessage(null);

    try {
      await consumeSSE(
        "/api/pipeline/avr",
        {
          query,
          language,
          articleType,
          references: selectedReferences,
        },
        handleEvent,
      );
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "AVR failed");
    }
  }

  async function startRIC() {
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
          manuscript,
          language,
          references: selectedReferences,
        },
        handleEvent,
      );
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "RIC failed");
    }
  }

  function toggleReference(referenceId: string) {
    setSelectedReferenceIds((previous) =>
      previous.includes(referenceId)
        ? previous.filter((id) => id !== referenceId)
        : [...previous, referenceId],
    );
  }

  function removeReference(referenceId: string) {
    setReferences((previous) => previous.filter((reference) => reference.id !== referenceId));
    setSelectedReferenceIds((previous) => previous.filter((id) => id !== referenceId));
  }

  function updateManuscript(nextManuscript: string) {
    setManuscript(nextManuscript);
  }

  function dismissFlag(flagId: string) {
    setDismissedFlagIds((previous) =>
      previous.includes(flagId) ? previous : [...previous, flagId],
    );
  }

  function reset() {
    setStatus("idle");
    setCurrentStep(1);
    setActiveView(1);
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

  return {
    status,
    currentStep,
    activeView,
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
    setActiveView,
    startSearch,
    startAVR,
    startRIC,
    setLanguage,
    reset,
    toggleReference,
    removeReference,
    updateManuscript,
    dismissFlag,
  };
}
