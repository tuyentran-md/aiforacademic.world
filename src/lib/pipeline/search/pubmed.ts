import { type Reference } from "@/lib/pipeline/types";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripXml(value: string): string {
  return decodeXmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function findFirst(xml: string, pattern: RegExp): string | undefined {
  return pattern.exec(xml)?.[1]?.trim();
}

function findAll(xml: string, pattern: RegExp): string[] {
  return [...xml.matchAll(pattern)].map((match) => stripXml(match[1] || "")).filter(Boolean);
}

function parseAuthors(articleXml: string): string[] {
  const authorBlocks = articleXml.match(/<Author[\s\S]*?<\/Author>/g) || [];
  const authors = authorBlocks
    .map((authorXml) => {
      const lastName = findFirst(authorXml, /<LastName>([\s\S]*?)<\/LastName>/i);
      const initials = findFirst(authorXml, /<Initials>([\s\S]*?)<\/Initials>/i);
      const collective = findFirst(authorXml, /<CollectiveName>([\s\S]*?)<\/CollectiveName>/i);

      if (collective) {
        return stripXml(collective);
      }

      if (lastName && initials) {
        return `${stripXml(lastName)} ${stripXml(initials)}`;
      }

      if (lastName) {
        return stripXml(lastName);
      }

      return "";
    })
    .filter(Boolean);

  return authors.slice(0, 8);
}

function parseYear(articleXml: string): number {
  const candidates = [
    findFirst(articleXml, /<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/i),
    findFirst(articleXml, /<ArticleDate[\s\S]*?<Year>(\d{4})<\/Year>/i),
    findFirst(articleXml, /<DateCompleted>[\s\S]*?<Year>(\d{4})<\/Year>/i),
    findFirst(articleXml, /<MedlineDate>(\d{4})/i),
  ];

  const year = candidates.find(Boolean);
  return year ? Number(year) : new Date().getFullYear();
}

function parseReference(articleXml: string, pmid: string): Reference | null {
  const title = stripXml(findFirst(articleXml, /<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/i) || "");
  if (!title) {
    return null;
  }

  const doi = stripXml(findFirst(articleXml, /<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/i) || "");
  const abstractSections = findAll(articleXml, /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi);
  const abstract = abstractSections.join("\n\n");
  const journal =
    stripXml(findFirst(articleXml, /<Journal>[\s\S]*?<Title>([\s\S]*?)<\/Title>/i) || "") ||
    "Unknown journal";
  const meshTerms = findAll(articleXml, /<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/gi);

  return {
    id: "",
    source: "pubmed",
    pmid,
    doi: doi || undefined,
    title,
    authors: parseAuthors(articleXml),
    journal,
    year: parseYear(articleXml),
    abstract,
    url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    meshTerms,
  };
}

export async function searchPubMed(query: string, maxResults = 10): Promise<Reference[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: String(maxResults),
    retmode: "json",
  });

  if (process.env.NCBI_API_KEY) {
    params.set("api_key", process.env.NCBI_API_KEY);
  }

  const searchResponse = await fetch(`${PUBMED_BASE}/esearch.fcgi?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!searchResponse.ok) {
    throw new Error(`PubMed esearch failed with ${searchResponse.status}`);
  }

  const searchJson = (await searchResponse.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  const pmids = searchJson.esearchresult?.idlist?.filter(Boolean) || [];

  if (pmids.length === 0) {
    return [];
  }

  const fetchParams = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    rettype: "xml",
    retmode: "xml",
  });

  if (process.env.NCBI_API_KEY) {
    fetchParams.set("api_key", process.env.NCBI_API_KEY);
  }

  const fetchResponse = await fetch(`${PUBMED_BASE}/efetch.fcgi?${fetchParams.toString()}`, {
    headers: { Accept: "application/xml, text/xml;q=0.9, */*;q=0.1" },
    cache: "no-store",
  });

  if (!fetchResponse.ok) {
    throw new Error(`PubMed efetch failed with ${fetchResponse.status}`);
  }

  const xml = await fetchResponse.text();
  const articleBlocks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

  return articleBlocks
    .map((articleXml) => {
      const pmid = stripXml(findFirst(articleXml, /<PMID[^>]*>([\s\S]*?)<\/PMID>/i) || "");
      if (!pmid) {
        return null;
      }

      return parseReference(articleXml, pmid);
    })
    .filter((reference): reference is Reference => Boolean(reference));
}
