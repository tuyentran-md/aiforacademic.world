import { callLLM, hasLLMConfiguration } from "@/lib/llm";
import {
  parseManuscriptSections,
  type ParsedManuscriptSection,
} from "@/lib/pipeline/manuscript";
import { parseJsonResponse } from "@/lib/pipeline/json";
import {
  type IntegrityFlag,
  type IntegrityReport,
  type RICRequest,
  type Reference,
  type SSEEvent,
} from "@/lib/pipeline/types";

function now(): string {
  return new Date().toISOString();
}

function normaliseSeverity(value: unknown): IntegrityFlag["severity"] {
  const normalised = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (["error", "high", "critical", "severe"].includes(normalised)) {
    return "error";
  }
  if (["warning", "warn", "medium", "moderate"].includes(normalised)) {
    return "warning";
  }
  if (["info", "informational", "low", "minor"].includes(normalised)) {
    return "info";
  }

  return "warning";
}

function normaliseFlagType(value: unknown, message: string): IntegrityFlag["type"] {
  const normalised = typeof value === "string" ? value.trim().toLowerCase() : "";
  const haystack = `${normalised} ${message.toLowerCase()}`;

  if (haystack.includes("hallucinated") || haystack.includes("invented reference")) {
    return "hallucinated_reference";
  }
  if (haystack.includes("missing citation")) {
    return "missing_citation";
  }
  if (haystack.includes("unsupported claim")) {
    return "unsupported_claim";
  }
  if (
    haystack.includes("overclaim") ||
    haystack.includes("overstatement") ||
    haystack.includes("misrepresentation of evidence")
  ) {
    return "overclaiming";
  }
  if (
    haystack.includes("method") ||
    haystack.includes("structural") ||
    haystack.includes("context") ||
    haystack.includes("missing information")
  ) {
    return "methodology_concern";
  }
  if (haystack.includes("logical inconsistency") || haystack.includes("contradict")) {
    return "logical_inconsistency";
  }
  if (haystack.includes("misquoted statistic") || haystack.includes("number doesn't match")) {
    return "misquoted_statistic";
  }
  if (haystack.includes("fact") || haystack.includes("factual")) {
    return "factual_error";
  }

  return "unsupported_claim";
}

function normaliseParagraphIndex(value: unknown): number {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function normaliseTextSnippet(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 200);
  }

  return fallback.slice(0, 200);
}

function normaliseRelatedReferenceIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return ids.length > 0 ? Array.from(new Set(ids)) : undefined;
}

function createFlagDeduplicationKey(flag: Omit<IntegrityFlag, "id">): string {
  return [
    flag.type,
    flag.location.sectionHeading.trim().toLowerCase(),
    flag.location.paragraphIndex,
  ].join("|");
}

function normaliseLLMFlags(
  rawFlags: unknown,
  sectionHeading: string,
  paragraphs: string[],
): Omit<IntegrityFlag, "id">[] {
  if (!Array.isArray(rawFlags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalisedFlags: Omit<IntegrityFlag, "id">[] = [];

  for (const entry of rawFlags) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Record<string, unknown>;
    const location =
      candidate.location && typeof candidate.location === "object"
        ? (candidate.location as Record<string, unknown>)
        : {};

    const paragraphIndex = normaliseParagraphIndex(location.paragraphIndex);
    const message = typeof candidate.message === "string" ? candidate.message.trim() : "";
    if (!message) {
      continue;
    }

    const flag: Omit<IntegrityFlag, "id"> = {
      severity: normaliseSeverity(candidate.severity),
      type: normaliseFlagType(candidate.type, message),
      location: {
        sectionHeading:
          typeof location.sectionHeading === "string" && location.sectionHeading.trim()
            ? location.sectionHeading.trim()
            : sectionHeading,
        paragraphIndex,
        textSnippet: normaliseTextSnippet(location.textSnippet, paragraphs[paragraphIndex] || ""),
      },
      message,
      suggestion:
        typeof candidate.suggestion === "string" && candidate.suggestion.trim()
          ? candidate.suggestion.trim()
          : undefined,
      relatedReferenceIds: normaliseRelatedReferenceIds(candidate.relatedReferenceIds),
    };

    const key = createFlagDeduplicationKey(flag);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalisedFlags.push(flag);
  }

  return normalisedFlags;
}

function buildFlag(
  base: Omit<IntegrityFlag, "id">,
  index: number,
): IntegrityFlag {
  return {
    ...base,
    id: `flag-${String(index + 1).padStart(3, "0")}`,
  };
}

function knownReferenceIds(references: Reference[]): Set<string> {
  return new Set(references.map((reference) => reference.id));
}

function heuristicAuditSection(
  section: ParsedManuscriptSection,
  references: Reference[],
): Omit<IntegrityFlag, "id">[] {
  const flags: Array<Omit<IntegrityFlag, "id">> = [];
  const referenceIds = knownReferenceIds(references);

  section.paragraphs.forEach((paragraph, paragraphIndex) => {
    const citations = [...paragraph.matchAll(/\[(ref-\d{3})\]/gi)].map((match) => match[1]);
    const uniqueCitations = Array.from(new Set(citations));
    const textSnippet = paragraph.slice(0, 200);

    for (const citation of uniqueCitations) {
      if (!referenceIds.has(citation)) {
        flags.push({
          severity: "error",
          type: "hallucinated_reference",
          location: {
            sectionHeading: section.heading,
            paragraphIndex,
            textSnippet,
          },
          message: `Citation ${citation} is not present in the provided reference set.`,
          suggestion: "Replace the citation or add the missing source to the context.",
          relatedReferenceIds: [],
        });
      }
    }

    if (/\[NEEDS_MORE_EVIDENCE\]/i.test(paragraph)) {
      flags.push({
        severity: "warning",
        type: "methodology_concern",
        location: {
          sectionHeading: section.heading,
          paragraphIndex,
          textSnippet,
        },
        message: "The draft explicitly marked this paragraph as needing stronger supporting evidence.",
        suggestion: "Add higher-quality references or soften the claim.",
        relatedReferenceIds: uniqueCitations,
      });
    }

    const hasStatistic = /\b\d+(\.\d+)?%?\b/.test(paragraph);
    if (hasStatistic && uniqueCitations.length === 0) {
      flags.push({
        severity: "warning",
        type: "missing_citation",
        location: {
          sectionHeading: section.heading,
          paragraphIndex,
          textSnippet,
        },
        message: "This paragraph contains a statistic or quantitative statement without a citation.",
        suggestion: "Add a supporting reference for the reported number or outcome.",
        relatedReferenceIds: [],
      });
    }

    if (
      /\b(proves|definitive|guarantees|always|never)\b/i.test(paragraph) &&
      uniqueCitations.length > 0
    ) {
      flags.push({
        severity: "warning",
        type: "overclaiming",
        location: {
          sectionHeading: section.heading,
          paragraphIndex,
          textSnippet,
        },
        message: "The claim reads stronger than the likely level of evidence.",
        suggestion: "Use more cautious wording unless the cited evidence is genuinely definitive.",
        relatedReferenceIds: uniqueCitations,
      });
    }

    if (
      /\b(improves|reduces|associated|significant|effective|benefit)\b/i.test(paragraph) &&
      uniqueCitations.length === 0
    ) {
      flags.push({
        severity: "warning",
        type: "unsupported_claim",
        location: {
          sectionHeading: section.heading,
          paragraphIndex,
          textSnippet,
        },
        message: "This paragraph makes an evidence-dependent claim but does not cite a supporting reference.",
        suggestion: "Add a citation or rewrite the statement as background context only.",
        relatedReferenceIds: [],
      });
    }
  });

  return flags;
}

function summariseHeuristically(score: number, flags: IntegrityFlag[]): string {
  const errorCount = flags.filter((flag) => flag.severity === "error").length;
  const warningCount = flags.filter((flag) => flag.severity === "warning").length;

  if (flags.length === 0) {
    return "No obvious integrity issues were detected in the heuristic audit, but full source verification is still recommended before submission.";
  }

  return `The draft scored ${score}/100 with ${errorCount} error(s) and ${warningCount} warning(s). Most issues relate to unsupported or weakly supported claims, so the next pass should focus on citation coverage and cautious wording.`;
}

async function auditWithLLM(
  section: ParsedManuscriptSection,
  request: RICRequest,
): Promise<Omit<IntegrityFlag, "id">[]> {
  if (!hasLLMConfiguration()) {
    return heuristicAuditSection(section, request.references);
  }

  try {
    const response = await callLLM({
      messages: [
        {
          role: "system",
          content:
            'You are a research integrity auditor. Output only a JSON array of flags. Use severity values error, warning, or info. Use type values unsupported_claim, misquoted_statistic, logical_inconsistency, missing_citation, hallucinated_reference, overclaiming, methodology_concern, or factual_error. Each flag must include severity, type, location { sectionHeading, paragraphIndex, textSnippet }, message, suggestion?, relatedReferenceIds?.',
        },
        {
          role: "user",
          content: JSON.stringify({
            section,
            fullManuscript: request.manuscript,
            references: request.references,
          }),
        },
      ],
      responseFormat: "json",
      temperature: 0.1,
      maxTokens: 2048,
    });

    const parsed = parseJsonResponse<unknown>(response);
    const normalised = normaliseLLMFlags(parsed, section.heading, section.paragraphs);

    return normalised.length > 0 ? normalised : heuristicAuditSection(section, request.references);
  } catch {
    return heuristicAuditSection(section, request.references);
  }
}

export async function runRIC(
  request: RICRequest,
  emit: (event: SSEEvent) => void,
): Promise<IntegrityReport> {
  emit({
    type: "status",
    data: {
      status: "auditing",
      message: "Checking manuscript integrity...",
    },
  });

  const sections = parseManuscriptSections(request.manuscript);
  const allFlags: IntegrityFlag[] = [];
  const seenFlagKeys = new Set<string>();

  for (const section of sections) {
    emit({
      type: "log",
      data: {
        tool: "RIC",
        message: `Analyzing: ${section.heading}...`,
        timestamp: now(),
      },
    });

    const flags = await auditWithLLM(section, request);
    for (const flag of flags) {
      const flagKey = createFlagDeduplicationKey(flag);
      if (seenFlagKeys.has(flagKey)) {
        continue;
      }

      seenFlagKeys.add(flagKey);
      const flagged = buildFlag(flag, allFlags.length);
      allFlags.push(flagged);
      emit({ type: "integrity_flag", data: flagged });
    }
  }

  const errorCount = allFlags.filter((flag) => flag.severity === "error").length;
  const warningCount = allFlags.filter((flag) => flag.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

  let summary = summariseHeuristically(score, allFlags);
  if (hasLLMConfiguration()) {
    try {
      const llmSummary = await callLLM({
        messages: [
          {
            role: "system",
            content: "Summarize this integrity audit in 2-3 sentences. Be constructive and concise.",
          },
          {
            role: "user",
            content: JSON.stringify({ score, flags: allFlags }),
          },
        ],
        temperature: 0.2,
        maxTokens: 200,
      });
      const trimmedSummary = llmSummary.trim();
      summary =
        trimmedSummary.length >= 60 && /[.!?]$/.test(trimmedSummary)
          ? trimmedSummary
          : summariseHeuristically(score, allFlags);
    } catch {
      summary = summariseHeuristically(score, allFlags);
    }
  }

  const report: IntegrityReport = {
    overallScore: score,
    flags: allFlags,
    summary,
  };

  emit({ type: "integrity_summary", data: { score, summary } });
  emit({
    type: "status",
    data: {
      status: "completed",
      message: "Integrity check complete",
    },
  });
  emit({ type: "done", data: { step: 3 } });

  return report;
}
