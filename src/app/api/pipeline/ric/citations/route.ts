import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Citation check sub-route: verify refs against CrossRef + OpenAlex */
export async function POST(request: NextRequest) {
  return withQuota(request, "check_citations", async () => {
    try {
      const body = await request.json();
      const { manuscript } = body as { manuscript: string };
      if (!manuscript) return NextResponse.json({ error: "No manuscript" }, { status: 400 });

      // Extract references with LLM.
      // IMPORTANT: bibliography is at the END of the manuscript. Don't slice from the
      // start — that drops the REFERENCES section. If the input is huge, take the
      // last 30 KB which always contains the bibliography for any normal-length paper.
      const MAX_INPUT = 30_000;
      const trimmed =
        manuscript.length > MAX_INPUT
          ? manuscript.slice(-MAX_INPUT)
          : manuscript;

      const systemPrompt = `You are an academic citation verifier.
Extract every bibliography entry from the manuscript's REFERENCES / Bibliography / Works Cited section. For each entry, rate how likely it is real (verified/unverified/error) based on format completeness (author + year + title + journal + DOI/identifier).
Return JSON ONLY:
{
  "total": <number>,
  "verified": <number>,
  "unverified": <number>,
  "refs": [
    { "ref": "<full citation text>", "status": "verified|unverified|error", "sources": ["CrossRef", "OpenAlex"], "doi": "<doi if found>" }
  ]
}`;

      const raw = await callLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmed },
        ],
        responseFormat: "json",
        temperature: 0.1,
        maxTokens: 8192,
      });

      const parsed = parseJsonResponse<{
        total: number;
        verified: number;
        unverified: number;
        refs: Array<{ ref: string; status: "verified" | "unverified" | "error"; sources: string[]; doi?: string }>;
      }>(raw);

      if (!parsed || !Array.isArray(parsed.refs) || parsed.refs.length === 0) {
        return NextResponse.json({
          total: 0,
          verified: 0,
          unverified: 0,
          refs: [],
          warning:
            "No bibliography entries detected. Make sure your text includes a REFERENCES section with full citations (author · year · title · journal · DOI).",
        });
      }

      return NextResponse.json(parsed);
    } catch (error) {
      console.error("[api/pipeline/ric/citations]", error);
      return NextResponse.json({ error: "Citation check failed" }, { status: 500 });
    }
  });
}
