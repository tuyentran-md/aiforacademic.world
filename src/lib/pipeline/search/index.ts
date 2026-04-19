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
      message: "Refining search query...",
      timestamp: now(),
    },
  });
  const refinedQuery = await refineQuery(request.query);
  const openAlexQuery = request.query.trim();

  emit({
    type: "log",
    data: {
      tool: "PubMed",
      message: `Searching: "${refinedQuery}"...`,
      timestamp: now(),
    },
  });
  emit({
    type: "log",
    data: {
      tool: "OpenAlex",
      message: `Searching: "${openAlexQuery}"...`,
      timestamp: now(),
    },
  });

  const maxResults = request.maxResults || 10;
  const [pubmedResult, openAlexResult] = await Promise.allSettled([
    searchPubMedWithFallback(refinedQuery, request.query, maxResults, emit),
    searchOpenAlex(openAlexQuery, maxResults),
  ]);

  const pubmedReferences =
    pubmedResult.status === "fulfilled" ? pubmedResult.value.references : [];
  const openAlexReferences = openAlexResult.status === "fulfilled" ? openAlexResult.value : [];

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
      message: `${allReferences.length} unique references after dedup`,
      timestamp: now(),
    },
  });

  const rankedReferences = await rankReferences(allReferences, request.query);
  for (const reference of rankedReferences) {
    emit({ type: "reference", data: reference });
  }

  if (request.language === "VI") {
    emit({
      type: "status",
      data: {
        status: "translating",
        message: "Translating abstracts...",
      },
    });
    emit({
      type: "log",
      data: {
        tool: "Translator",
        message: "Translating abstracts to Vietnamese...",
        timestamp: now(),
      },
    });

    const translated = await translateAbstracts(rankedReferences, "VI");
    for (const reference of translated) {
      if (reference.abstractTranslated) {
        emit({ type: "reference", data: reference });
      }
    }

    emit({
      type: "status",
      data: {
        status: "completed",
        message: `Found ${translated.length} references`,
      },
    });
    emit({ type: "done", data: { step: 1 } });
    return translated;
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
