import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return withQuota(request, "extract_refs", async () => {
    try {
      const body = await request.json();
      const { manuscript } = body as { manuscript: string };
      if (!manuscript) return NextResponse.json({ error: "No manuscript" }, { status: 400 });

      // Bibliography always sits at the end of a manuscript. If the input is huge,
      // take the last 30 KB so we don't waste tokens on body content.
      const MAX_INPUT = 30_000;
      const trimmed =
        manuscript.length > MAX_INPUT ? manuscript.slice(-MAX_INPUT) : manuscript;

      const raw = await callLLM({
        messages: [
          {
            role: "system",
            content: `You are a reference extraction tool. Extract ALL references/citations from the REFERENCES / Bibliography section of the provided text and output ONLY valid JSON.
Format the output exactly like this:
{
  "references": [
    {
      "type": "JOURNAL",
      "authors": ["Last, F.M.", "Last2, F.M."],
      "year": "2023",
      "title": "Article title",
      "journal": "Journal Name",
      "volume": "10",
      "issue": "2",
      "pages": "100-110",
      "doi": "10.xxx/xxx"
    }
  ]
}
If a field is missing, omit it. Extract every entry — do not stop early. DO NOT output markdown blocks or any text other than the JSON.`,
          },
          { role: "user", content: trimmed },
        ],
        responseFormat: "json",
        temperature: 0.1,
        maxTokens: 8192,
      });

      const parsed = parseJsonResponse<{
        references: Array<{
          type?: string;
          authors?: string[];
          year?: string;
          title?: string;
          journal?: string;
          volume?: string;
          issue?: string;
          pages?: string;
          doi?: string;
        }>;
      }>(raw);

      if (!parsed || !Array.isArray(parsed.references) || parsed.references.length === 0) {
        return NextResponse.json(
          {
            error:
              "No references found. Make sure your text includes a REFERENCES section with full citations (author · year · title · journal · DOI).",
          },
          { status: 422 }
        );
      }

      // Format as RIS
      const risLines: string[] = [];
      parsed.references.forEach((ref) => {
        risLines.push("TY  - " + (ref.type === "BOOK" ? "BOOK" : "JOUR"));
        if (Array.isArray(ref.authors)) {
          ref.authors.forEach((a) => risLines.push(`AU  - ${a}`));
        } else if (typeof ref.authors === "string") {
          risLines.push(`AU  - ${ref.authors}`);
        }
        if (ref.year) risLines.push(`PY  - ${ref.year}`);
        if (ref.title) risLines.push(`TI  - ${ref.title}`);
        if (ref.journal) risLines.push(`T2  - ${ref.journal}`);
        if (ref.volume) risLines.push(`VL  - ${ref.volume}`);
        if (ref.issue) risLines.push(`IS  - ${ref.issue}`);
        
        if (ref.pages) {
          const parts = String(ref.pages).split("-");
          if (parts[0]) risLines.push(`SP  - ${parts[0].trim()}`);
          if (parts[1]) risLines.push(`EP  - ${parts[1].trim()}`);
        }
        if (ref.doi) risLines.push(`DO  - ${ref.doi}`);
        risLines.push("ER  - \n");
      });

      const risContent = risLines.join("\n");

      return NextResponse.json({ 
        json: parsed.references,
        ris: risContent
      });
    } catch (error) {
      console.error("[api/pipeline/extract-refs]", error);
      return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
    }
  });
}
