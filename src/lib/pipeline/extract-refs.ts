/**
 * src/lib/pipeline/extract-refs.ts
 *
 * Extract bibliography entries from a manuscript and convert to RIS format.
 */
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";

export interface ParsedReference {
  id: string;
  authors: string[];
  title: string;
  journal: string;
  year: number;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
}

export async function extractReferences(manuscript: string): Promise<ParsedReference[]> {
  const raw = await callLLM({
    messages: [
      {
        role: "system",
        content: `Extract all bibliography/reference entries from this manuscript.
For each reference, parse: authors, title, journal, year, volume, issue, pages, doi.
Return JSON array:
[
  {
    "id": "ref-001",
    "authors": ["Last F", ...],
    "title": "<title>",
    "journal": "<journal>",
    "year": <year>,
    "volume": "<vol or empty string>",
    "issue": "<issue or empty string>",
    "pages": "<pages or empty string>",
    "doi": "<doi or empty string>"
  }
]
Return [] if no references found.`,
      },
      { role: "user", content: manuscript },
    ],
    responseFormat: "json",
    temperature: 0.05,
    maxTokens: 4096,
  });

  const refs = parseJsonResponse<ParsedReference[]>(raw);
  if (!refs || !Array.isArray(refs)) return [];
  return refs;
}

export function refsToRIS(refs: ParsedReference[]): string {
  return refs
    .map((ref) => {
      const lines: string[] = [];
      lines.push("TY  - JOUR");
      ref.authors.forEach((a) => lines.push(`AU  - ${a}`));
      lines.push(`TI  - ${ref.title}`);
      if (ref.journal) lines.push(`JO  - ${ref.journal}`);
      if (ref.year) lines.push(`PY  - ${ref.year}`);
      if (ref.volume) lines.push(`VL  - ${ref.volume}`);
      if (ref.issue) lines.push(`IS  - ${ref.issue}`);
      if (ref.pages) {
        const [sp, ep] = ref.pages.split("-");
        if (sp) lines.push(`SP  - ${sp.trim()}`);
        if (ep) lines.push(`EP  - ${ep.trim()}`);
      }
      if (ref.doi) lines.push(`DO  - ${ref.doi}`);
      lines.push("ER  - ");
      return lines.join("\n");
    })
    .join("\n\n");
}
