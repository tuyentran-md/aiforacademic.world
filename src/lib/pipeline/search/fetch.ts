/**
 * src/lib/pipeline/search/fetch.ts
 *
 * Legal open-access fulltext fetcher.
 * Cascade: Unpaywall → OpenAlex → Europe PMC → Semantic Scholar.
 * No Sci-Hub. No copyright violation.
 */

const UNPAYWALL_EMAIL = process.env.UNPAYWALL_EMAIL ?? "research@aiforacademic.world";

export interface FetchResult {
  doi: string;
  status: "ok" | "no_oa" | "failed";
  source?: string;
  downloadUrl?: string;
}

async function tryUnpaywall(doi: string): Promise<FetchResult | null> {
  try {
    const res = await fetch(
      `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${UNPAYWALL_EMAIL}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      is_oa?: boolean;
      best_oa_location?: { url_for_pdf?: string };
    };
    if (data.is_oa && data.best_oa_location?.url_for_pdf) {
      return { doi, status: "ok", source: "Unpaywall", downloadUrl: data.best_oa_location.url_for_pdf };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryOpenAlex(doi: string): Promise<FetchResult | null> {
  try {
    const res = await fetch(
      `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { open_access?: { oa_url?: string } };
    if (data.open_access?.oa_url) {
      return { doi, status: "ok", source: "OpenAlex", downloadUrl: data.open_access.oa_url };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryEuropePMC(doi: string): Promise<FetchResult | null> {
  try {
    const res = await fetch(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(doi)}&format=json&resultType=core`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      resultList?: {
        result?: Array<{
          isOpenAccess?: string;
          fullTextUrlList?: { fullTextUrl?: Array<{ documentStyle: string; url: string }> };
        }>;
      };
    };
    const result = data.resultList?.result?.[0];
    if (result?.isOpenAccess === "Y") {
      const pdfEntry = result.fullTextUrlList?.fullTextUrl?.find((u) => u.documentStyle === "pdf");
      if (pdfEntry?.url) {
        return { doi, status: "ok", source: "Europe PMC", downloadUrl: pdfEntry.url };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function trySemanticScholar(doi: string): Promise<FetchResult | null> {
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=openAccessPdf`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { openAccessPdf?: { url?: string } };
    if (data.openAccessPdf?.url) {
      return { doi, status: "ok", source: "Semantic Scholar", downloadUrl: data.openAccessPdf.url };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchFulltext(doi: string): Promise<FetchResult> {
  const sources = [tryUnpaywall, tryOpenAlex, tryEuropePMC, trySemanticScholar];
  for (const fn of sources) {
    const result = await fn(doi);
    if (result) return result;
  }
  return { doi, status: "no_oa" };
}

export async function fetchMultiple(dois: string[]): Promise<FetchResult[]> {
  return Promise.all(dois.map(fetchFulltext));
}
