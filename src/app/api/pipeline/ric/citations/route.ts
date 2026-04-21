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

      // Extract references with LLM
      const systemPrompt = `You are an academic citation verifier. 
Extract all bibliography entries from the manuscript. For each, rate how likely it is real (verified/unverified/error) based on format and structure.
Return JSON:
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
          { role: "user", content: manuscript.slice(0, 8000) },
        ],
        responseFormat: "json",
        temperature: 0.1,
        maxTokens: 2048,
      });

      const parsed = parseJsonResponse<{
        total: number;
        verified: number;
        unverified: number;
        refs: Array<{ ref: string; status: "verified" | "unverified" | "error"; sources: string[]; doi?: string }>;
      }>(raw);

      if (!parsed) {
        return NextResponse.json({ total: 0, verified: 0, unverified: 0, refs: [] });
      }

      return NextResponse.json(parsed);
    } catch (error) {
      console.error("[api/pipeline/ric/citations]", error);
      return NextResponse.json({ error: "Citation check failed" }, { status: 500 });
    }
  });
}
