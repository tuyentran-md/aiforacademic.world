import { callLLM, hasLLMConfiguration } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { type Reference } from "@/lib/pipeline/types";

interface TranslationResult {
  id: string;
  abstractTranslated: string;
}

const MAX_TRANSLATION_BATCH_CHARS = 5000;
const MAX_TRANSLATION_BATCH_SIZE = 2;

function normaliseTranslatedText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractTranslationEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidate = value as Record<string, unknown>;
  if (Array.isArray(candidate.translations)) {
    return candidate.translations;
  }
  if (Array.isArray(candidate.results)) {
    return candidate.results;
  }
  if (Array.isArray(candidate.items)) {
    return candidate.items;
  }

  return [];
}

function normaliseTranslationResult(entry: unknown): TranslationResult | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  if (!id) {
    return null;
  }

  const abstractTranslated =
    normaliseTranslatedText(candidate.abstractTranslated) ||
    normaliseTranslatedText(candidate.abstract_vi) ||
    normaliseTranslatedText(candidate.translation) ||
    normaliseTranslatedText(candidate.translatedAbstract) ||
    normaliseTranslatedText(candidate.translated_text);

  if (!abstractTranslated) {
    return null;
  }

  return { id, abstractTranslated };
}

function chunkTranslatableReferences(refs: Reference[]): Reference[][] {
  const batches: Reference[][] = [];
  let currentBatch: Reference[] = [];
  let currentChars = 0;

  for (const reference of refs) {
    const nextChars = currentChars + reference.abstract.length;
    if (
      currentBatch.length > 0 &&
      (currentBatch.length >= MAX_TRANSLATION_BATCH_SIZE || nextChars > MAX_TRANSLATION_BATCH_CHARS)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(reference);
    currentChars += reference.abstract.length;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function requestTranslationBatch(batch: Reference[]): Promise<TranslationResult[]> {
  const response = await callLLM({
    messages: [
      {
        role: "system",
        content:
          'Translate these academic abstracts to Vietnamese. Preserve technical terms, statistics, p-values, confidence intervals, gene names, drug names, and proper nouns. Return only valid JSON as an array of objects with exactly these keys: "id" and "abstractTranslated".',
      },
      {
        role: "user",
        content: JSON.stringify(
          batch.map((reference) => ({
            id: reference.id,
            abstract: reference.abstract,
          })),
        ),
      },
    ],
    responseFormat: "json",
    temperature: 0.1,
    maxTokens: 4096,
  });

  const parsed = parseJsonResponse<unknown>(response);
  const entries = extractTranslationEntries(parsed);

  return entries
    .map(normaliseTranslationResult)
    .filter((entry): entry is TranslationResult => Boolean(entry));
}

export async function translateAbstracts(
  refs: Reference[],
  targetLang: "EN" | "VI",
): Promise<Reference[]> {
  if (refs.length === 0 || !hasLLMConfiguration()) {
    return refs;
  }

  const translatable = refs.filter((reference) => reference.abstract.trim().length > 0);
  if (translatable.length === 0) {
    return refs;
  }

  const translationMap = new Map<string, string>();

  for (const batch of chunkTranslatableReferences(translatable)) {
    try {
      const translatedEntries = await requestTranslationBatch(batch);
      for (const entry of translatedEntries) {
        translationMap.set(entry.id, entry.abstractTranslated);
      }
    } catch {
      continue;
    }
  }

  if (translationMap.size === 0) {
    return refs;
  }

  return refs.map((reference) => ({
    ...reference,
    abstractTranslated: translationMap.get(reference.id) || reference.abstractTranslated,
  }));
}
