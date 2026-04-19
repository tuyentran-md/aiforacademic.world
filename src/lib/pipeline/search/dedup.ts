import { type Reference } from "@/lib/pipeline/types";

function normaliseDoi(doi?: string): string | null {
  if (!doi) {
    return null;
  }

  return doi.replace(/^https?:\/\/doi.org\//i, "").trim().toLowerCase() || null;
}

function normaliseTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function levenshtein(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const matrix = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0));

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function hasSimilarTitle(left: Reference, right: Reference): boolean {
  const normalisedLeft = normaliseTitle(left.title);
  const normalisedRight = normaliseTitle(right.title);
  const longest = Math.max(normalisedLeft.length, normalisedRight.length, 1);
  const distance = levenshtein(normalisedLeft, normalisedRight);
  return distance / longest < 0.1;
}

function chooseBestValue(left: string | undefined, right: string | undefined): string | undefined {
  return (right && right.length > (left?.length || 0) ? right : left) || undefined;
}

function mergeUnique(left: string[] | undefined, right: string[] | undefined): string[] | undefined {
  const merged = Array.from(new Set([...(left || []), ...(right || [])].filter(Boolean)));
  return merged.length > 0 ? merged : undefined;
}

function mergeReferences(primary: Reference, duplicate: Reference): Reference {
  const doi = normaliseDoi(primary.doi) || normaliseDoi(duplicate.doi) || undefined;

  return {
    ...primary,
    doi,
    pmid: primary.pmid || duplicate.pmid,
    openalexId: primary.openalexId || duplicate.openalexId,
    title: chooseBestValue(primary.title, duplicate.title) || primary.title,
    authors: primary.authors.length >= duplicate.authors.length ? primary.authors : duplicate.authors,
    journal: chooseBestValue(primary.journal, duplicate.journal) || primary.journal,
    year: Math.max(primary.year || 0, duplicate.year || 0) || primary.year,
    abstract: chooseBestValue(primary.abstract, duplicate.abstract) || "",
    abstractTranslated:
      chooseBestValue(primary.abstractTranslated, duplicate.abstractTranslated) || undefined,
    url: chooseBestValue(primary.url, duplicate.url) || primary.url,
    citationCount: Math.max(primary.citationCount || 0, duplicate.citationCount || 0) || undefined,
    relevanceScore: Math.max(primary.relevanceScore || 0, duplicate.relevanceScore || 0) || undefined,
    meshTerms: mergeUnique(primary.meshTerms, duplicate.meshTerms),
    concepts: mergeUnique(primary.concepts, duplicate.concepts),
  };
}

function indexReferenceDoi(
  doiIndex: Map<string, number>,
  reference: Reference,
  index: number,
): void {
  const doi = normaliseDoi(reference.doi);
  if (doi) {
    doiIndex.set(doi, index);
  }
}

export function deduplicateReferences(refs: Reference[]): Reference[] {
  const deduped: Reference[] = [];
  const doiIndex = new Map<string, number>();

  for (const reference of refs) {
    const doi = normaliseDoi(reference.doi);
    if (doi && doiIndex.has(doi)) {
      const existingIndex = doiIndex.get(doi);
      if (existingIndex !== undefined) {
        deduped[existingIndex] = mergeReferences(deduped[existingIndex], reference);
      }
      continue;
    }

    const fuzzyMatchIndex = deduped.findIndex((candidate) => hasSimilarTitle(candidate, reference));
    if (fuzzyMatchIndex >= 0) {
      deduped[fuzzyMatchIndex] = mergeReferences(deduped[fuzzyMatchIndex], reference);
      indexReferenceDoi(doiIndex, deduped[fuzzyMatchIndex], fuzzyMatchIndex);
      continue;
    }

    if (doi) {
      doiIndex.set(doi, deduped.length);
    }

    deduped.push({ ...reference });
  }

  return deduped.map((reference, index) => ({
    ...reference,
    id: `ref-${String(index + 1).padStart(3, "0")}`,
  }));
}
