import { type Reference } from "@/lib/pipeline/types";

const OPENALEX_BASE = "https://api.openalex.org";

interface OpenAlexWork {
  id: string;
  doi?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  cited_by_count?: number | null;
  authorships?: Array<{ author?: { display_name?: string | null } | null }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: Array<{ display_name?: string | null; score?: number | null }>;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
}

interface OpenAlexResponse {
  results?: OpenAlexWork[];
}

export function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const positions = Object.entries(invertedIndex).flatMap(([word, indexes]) =>
    indexes.map((index) => [index, word] as const),
  );

  return positions
    .sort((left, right) => left[0] - right[0])
    .map(([, word]) => word)
    .join(" ")
    .trim();
}

export async function searchOpenAlex(query: string, maxResults = 10): Promise<Reference[]> {
  const params = new URLSearchParams({
    search: query,
    per_page: String(maxResults),
    sort: "relevance_score:desc",
    mailto: process.env.OPENALEX_MAILTO || "tuyen.tran97@gmail.com",
  });

  const response = await fetch(`${OPENALEX_BASE}/works?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": `AFA/1.0 (mailto:${process.env.OPENALEX_MAILTO || "tuyen.tran97@gmail.com"})`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenAlex search failed with ${response.status}`);
  }

  const payload = (await response.json()) as OpenAlexResponse;
  const works = payload.results || [];

  const references: Reference[] = [];

  for (const work of works) {
    const title = (work.display_name || "").trim();
    if (!title) {
      continue;
    }

    const doi = work.doi?.replace(/^https:\/\/doi.org\//i, "") || undefined;
    const abstract = work.abstract_inverted_index
      ? reconstructAbstract(work.abstract_inverted_index)
      : "";

    references.push({
      id: "",
      source: "openalex" as const,
      openalexId: work.id,
      doi,
      title,
      authors:
        work.authorships
          ?.map((authorship) => authorship.author?.display_name?.trim() || "")
          .filter(Boolean)
          .slice(0, 8) || [],
      journal: work.primary_location?.source?.display_name?.trim() || "Unknown journal",
      year: work.publication_year || new Date().getFullYear(),
      abstract,
      url:
        work.primary_location?.landing_page_url ||
        work.primary_location?.pdf_url ||
        (doi ? `https://doi.org/${doi}` : work.id),
      citationCount: work.cited_by_count || 0,
      concepts:
        work.concepts
          ?.filter((concept) => (concept.score || 0) > 0.3)
          .map((concept) => concept.display_name?.trim() || "")
          .filter(Boolean)
          .slice(0, 6) || [],
    });
  }

  return references;
}
