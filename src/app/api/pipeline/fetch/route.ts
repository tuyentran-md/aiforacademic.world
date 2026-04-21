import { NextRequest, NextResponse } from "next/server";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

interface FetchResult {
  doi: string;
  status: "ok" | "no_oa" | "failed";
  source?: string;
  downloadUrl?: string;
  fileSize?: number;
}

async function tryUnpaywall(doi: string): Promise<FetchResult | null> {
  try {
    const email = process.env.UNPAYWALL_EMAIL ?? "research@aiforacademic.world";
    const res = await fetch(
      `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${email}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.is_oa && data.best_oa_location?.url_for_pdf) {
      return {
        doi,
        status: "ok",
        source: "Unpaywall",
        downloadUrl: data.best_oa_location.url_for_pdf,
      };
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
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const oaUrl = data.open_access?.oa_url;
    if (oaUrl) {
      return { doi, status: "ok", source: "OpenAlex", downloadUrl: oaUrl };
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
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.resultList?.result?.[0];
    if (result?.isOpenAccess === "Y" && result?.fullTextUrlList?.fullTextUrl) {
      const pdfEntry = result.fullTextUrlList.fullTextUrl.find(
        (u: { documentStyle: string; url: string }) => u.documentStyle === "pdf"
      );
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
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.openAccessPdf?.url) {
      return { doi, status: "ok", source: "Semantic Scholar", downloadUrl: data.openAccessPdf.url };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchSingleDOI(doi: string): Promise<FetchResult> {
  // Legal cascade: Unpaywall → OpenAlex → Europe PMC → Semantic Scholar
  const sources = [tryUnpaywall, tryOpenAlex, tryEuropePMC, trySemanticScholar];
  for (const fn of sources) {
    const result = await fn(doi);
    if (result) return result;
  }
  return { doi, status: "no_oa" };
}

export async function POST(request: NextRequest) {
  return withQuota(request, "search_papers", async () => {
    try {
      const body = await request.json();
      const { dois } = body as { dois: string[] };

      if (!Array.isArray(dois) || dois.length === 0) {
        return NextResponse.json({ error: "No DOIs provided" }, { status: 400 });
      }

      if (dois.length > 20) {
        return NextResponse.json({ error: "Max 20 DOIs per request" }, { status: 400 });
      }

      const results = await Promise.all(dois.map(fetchSingleDOI));
      return NextResponse.json({ results });
    } catch (error) {
      console.error("[api/pipeline/fetch]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Fetch failed" },
        { status: 500 }
      );
    }
  });
}
