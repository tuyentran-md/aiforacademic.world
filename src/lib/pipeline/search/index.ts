import { callLLM, hasLLMConfiguration } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { type Reference, type SSEEvent, type SearchRequest } from "@/lib/pipeline/types";
import { deduplicateReferences } from "./dedup";
import { searchOpenAlex } from "./openalex";
import { searchPubMed } from "./pubmed";
import { translateAbstracts } from "./translate";

interface RankedReferenceScore {
  id: string;
  relevanceScore: number;
}

interface SearchAttemptResult {
  query: string;
  references: Reference[];
}

const SEARCH_PREAMBLE_PATTERNS = [
  /^\s*(tim|tìm)\s+(tai lieu|tài liệu|nghien cuu|nghiên cứu|bai bao|bài báo)\s+(ve|về)\s+/i,
  /^\s*(tim|tìm)\s+/i,
  /^\s*(find|search for|look for|show me)\s+(papers?|studies?|literature|articles?)\s+(about|on|for)\s+/i,
  /^\s*(papers?|studies?|literature)\s+(about|on|for)\s+/i,
];
const VIETNAMESE_QUERY_HINT =
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

function now(): string {
  return new Date().toISOString();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normaliseTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function getQueryTerms(query: string): string[] {
  const stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "into", "using"]);
  return query
    .split(/\s+/)
    .map(normaliseTerm)
    .filter((term) => term.length > 2 && !stopWords.has(term));
}

function cleanSearchQuestion(query: string): string {
  let cleaned = query.trim();

  for (const pattern of SEARCH_PREAMBLE_PATTERNS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, "").trim();
      break;
    }
  }

  return cleaned.replace(/[?.!]+$/g, "").trim() || query.trim();
}

function stripOuterDelimiters(value: string): string {
  let result = value.trim();

  while (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'")) ||
    (result.startsWith("`") && result.endsWith("`"))
  ) {
    result = result.slice(1, -1).trim();
  }

  return result;
}

function arePairsBalanced(value: string, open: string, close: string): boolean {
  let depth = 0;

  for (const character of value) {
    if (character === open) {
      depth += 1;
    }
    if (character === close) {
      depth -= 1;
    }
    if (depth < 0) {
      return false;
    }
  }

  return depth === 0;
}

function isBalancedDoubleQuotes(value: string): boolean {
  return (value.match(/"/g) || []).length % 2 === 0;
}

function sanitiseEnglishSearchQuestion(candidate: string, fallback: string): string {
  const cleaned = stripOuterDelimiters(candidate)
    .replace(/^english\s*(query|translation)?\s*:\s*/i, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (
    !cleaned ||
    /\b(json|requested|please provide|input|output|question:|answer:)\b/i.test(cleaned)
  ) {
    return fallback;
  }

  return cleanSearchQuestion(cleaned);
}

function shouldTranslateQuery(query: string, language: SearchRequest["language"]): boolean {
  if (language === "VI") {
    return true;
  }

  return VIETNAMESE_QUERY_HINT.test(query);
}

function sanitisePubMedQuery(candidate: string, originalQuery: string): string {
  const refined = stripOuterDelimiters(candidate)
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  const originalTerms = getQueryTerms(originalQuery);

  if (!refined) {
    return originalQuery;
  }

  if (
    refined.length < Math.min(Math.max(Math.floor(originalQuery.length * 0.5), 12), 40) ||
    refined.length > 500
  ) {
    return originalQuery;
  }

  if (
    refined.includes('""') ||
    /\[[^\]]+\]"/.test(refined) ||
    !isBalancedDoubleQuotes(refined) ||
    !arePairsBalanced(refined, "(", ")") ||
    !arePairsBalanced(refined, "[", "]") ||
    /\b(?:AND|OR|NOT)\s*$/i.test(refined)
  ) {
    return originalQuery;
  }

  if (originalTerms.length > 0) {
    const refinedHaystack = normaliseTerm(refined);
    const overlapCount = originalTerms.filter((term) => refinedHaystack.includes(term)).length;
    if (overlapCount === 0) {
      return originalQuery;
    }
  }

  return refined;
}

async function translateSearchQuestionToEnglish(query: string): Promise<string> {
  if (!hasLLMConfiguration()) {
    return query;
  }

  try {
    const translated = await callLLM({
      messages: [
        {
          role: "system",
          content:
            "Translate the user's literature-search request into a concise English biomedical search phrase. Keep every important medical noun phrase. Do not omit the procedure, postoperative context, device or intervention, population, comparator, or outcome. Return only the English search phrase, not JSON and not an explanation.",
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.1,
      maxTokens: 120,
    });

    return sanitiseEnglishSearchQuestion(translated, query);
  } catch {
    return query;
  }
}

async function buildWorkingQuery(
  query: string,
  language: SearchRequest["language"],
): Promise<string> {
  const cleaned = cleanSearchQuestion(query);

  if (!shouldTranslateQuery(cleaned, language)) {
    return cleaned;
  }

  return translateSearchQuestionToEnglish(cleaned);
}

async function refineQuery(query: string): Promise<string> {
  if (!hasLLMConfiguration()) {
    return query;
  }

  try {
    const refined = await callLLM({
      messages: [
        {
          role: "system",
          content:
            'Given the user\'s research question, generate an optimized PubMed search query using MeSH terms and Boolean operators. Return ONLY the query string.',
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.1,
      maxTokens: 300,
    });

    return sanitisePubMedQuery(refined, query);
  } catch {
    return query;
  }
}

async function searchPubMedWithFallback(
  refinedQuery: string,
  originalQuery: string,
  maxResults: number,
  emit: (event: SSEEvent) => void,
): Promise<SearchAttemptResult> {
  const initialReferences = await searchPubMed(refinedQuery, maxResults);
  if (initialReferences.length > 0 || refinedQuery === originalQuery) {
    return { query: refinedQuery, references: initialReferences };
  }

  emit({
    type: "log",
    data: {
      tool: "PubMed",
      message: "Refined PubMed query returned no results, retrying with the original question...",
      timestamp: now(),
    },
  });

  return {
    query: originalQuery,
    references: await searchPubMed(originalQuery, maxResults),
  };
}

function rankReferencesHeuristically(references: Reference[], query: string): Reference[] {
  const terms = getQueryTerms(query);

  return references
    .map((reference) => {
      const haystack = `${reference.title} ${reference.abstract}`.toLowerCase();
      const overlap = terms.filter((term) => haystack.includes(term)).length;
      const citationBoost = Math.min((reference.citationCount || 0) / 100, 0.2);
      const recencyBoost = Math.max(0, (reference.year - 2018) * 0.02);
      const score = clampScore((overlap / Math.max(terms.length, 1)) * 0.75 + citationBoost + recencyBoost);

      return {
        ...reference,
        relevanceScore: Number(score.toFixed(2)),
      };
    })
    .sort((left, right) => (right.relevanceScore || 0) - (left.relevanceScore || 0));
}

async function rankReferences(references: Reference[], query: string): Promise<Reference[]> {
  if (references.length === 0 || !hasLLMConfiguration()) {
    return rankReferencesHeuristically(references, query);
  }

  try {
    const response = await callLLM({
      messages: [
        {
          role: "system",
          content:
            "Rank these references for the user's research question. Return only a JSON array of objects like {\"id\":\"ref-001\",\"relevanceScore\":0.91}.",
        },
        {
          role: "user",
          content: JSON.stringify({
            query,
            references: references.map((reference) => ({
              id: reference.id,
              title: reference.title,
              abstract: reference.abstract,
              year: reference.year,
              citationCount: reference.citationCount || 0,
            })),
          }),
        },
      ],
      responseFormat: "json",
      temperature: 0.1,
      maxTokens: 2048,
    });

    const ranked = parseJsonResponse<RankedReferenceScore[]>(response);
    if (!ranked) {
      return rankReferencesHeuristically(references, query);
    }

    const scoreMap = new Map(ranked.map((entry) => [entry.id, clampScore(entry.relevanceScore)]));

    return references
      .map((reference) => ({
        ...reference,
        relevanceScore: scoreMap.get(reference.id) ?? reference.relevanceScore ?? 0,
      }))
      .sort((left, right) => (right.relevanceScore || 0) - (left.relevanceScore || 0));
  } catch {
    return rankReferencesHeuristically(references, query);
  }
}

export async function runSearch(
  request: SearchRequest,
  emit: (event: SSEEvent) => void,
): Promise<Reference[]> {
  emit({
    type: "status",
    data: {
      status: "searching",
      message: "Searching PubMed and OpenAlex...",
    },
  });

  emit({
    type: "log",
    data: {
      tool: "System",
      message: "Preparing your search...",
      timestamp: now(),
    },
  });
  const workingQuery = await buildWorkingQuery(request.query, request.language);
  if (workingQuery !== request.query.trim()) {
    emit({
      type: "log",
      data: {
        tool: "System",
        message: `Using search question: "${workingQuery}"`,
        timestamp: now(),
      },
    });
  }

  const refinedQuery = await refineQuery(workingQuery);
  const openAlexQuery = workingQuery;

  emit({
    type: "log",
    data: {
      tool: "PubMed",
      message: "Searching medical databases...",
      timestamp: now(),
    },
  });
  emit({
    type: "log",
    data: {
      tool: "OpenAlex",
      message: "Searching academic databases...",
      timestamp: now(),
    },
  });

  const maxResults = request.maxResults || 10;
  const [pubmedResult, openAlexResult] = await Promise.allSettled([
    searchPubMedWithFallback(refinedQuery, workingQuery, maxResults, emit),
    searchOpenAlex(openAlexQuery, maxResults),
  ]);

  const pubmedReferences =
    pubmedResult.status === "fulfilled" ? pubmedResult.value.references : [];
  const openAlexReferences = openAlexResult.status === "fulfilled" ? openAlexResult.value : [];

  emit({
    type: "log",
    data: {
      tool: "PubMed",
      message: `${pubmedReferences.length} result(s) returned`,
      timestamp: now(),
      status: "done",
    },
  });
  emit({
    type: "log",
    data: {
      tool: "OpenAlex",
      message: `${openAlexReferences.length} result(s) returned`,
      timestamp: now(),
      status: "done",
    },
  });

  if (pubmedResult.status === "rejected") {
    emit({
      type: "log",
      data: {
        tool: "PubMed",
        message: `PubMed search failed: ${pubmedResult.reason instanceof Error ? pubmedResult.reason.message : "unknown error"}`,
        timestamp: now(),
        status: "error",
      },
    });
  } else if (pubmedResult.value.query !== refinedQuery) {
    emit({
      type: "log",
      data: {
        tool: "PubMed",
        message: `Using fallback query: "${pubmedResult.value.query}"`,
        timestamp: now(),
      },
    });
  }

  if (openAlexResult.status === "rejected") {
    emit({
      type: "log",
      data: {
        tool: "OpenAlex",
        message: `OpenAlex search failed: ${openAlexResult.reason instanceof Error ? openAlexResult.reason.message : "unknown error"}`,
        timestamp: now(),
        status: "error",
      },
    });
  }

  const allReferences = deduplicateReferences([...pubmedReferences, ...openAlexReferences]);
  emit({
    type: "log",
    data: {
      tool: "System",
      message: `Found ${allReferences.length} relevant papers`,
      timestamp: now(),
    },
  });

  emit({
    type: "log",
    data: {
      tool: "System",
      message: "Ranking papers by relevance...",
      timestamp: now(),
    },
  });

  const rankedReferences = await rankReferences(allReferences, workingQuery);
  if (rankedReferences.length === 0) {
    emit({
      type: "status",
      data: {
        status: "completed",
        message: "No references found",
      },
    });
    emit({
      type: "log",
      data: {
        tool: "System",
        message:
          "No matching papers found. Try a broader topic, fewer details, or a more standard clinical term.",
        timestamp: now(),
        status: "error",
      },
    });
    return [];
  }

  for (const reference of rankedReferences) {
    emit({ type: "reference", data: reference });
  }



  emit({
    type: "status",
    data: {
      status: "completed",
      message: `Found ${rankedReferences.length} references`,
    },
  });
  emit({ type: "done", data: { step: 1 } });
  return rankedReferences;
}
