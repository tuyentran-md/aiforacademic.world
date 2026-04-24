import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Plagiarism scan — LLM-based semantic similarity + citation-aware */
export async function POST(request: NextRequest) {
  return withQuota(request, "plagiarism", async () => {
    try {
      const body = await request.json();
      const { manuscript } = body as { manuscript: string };
      if (!manuscript) return NextResponse.json({ error: "No manuscript" }, { status: 400 });

      const raw = await callLLM({
        messages: [
          {
            role: "system",
            content: `You are a plagiarism detection system for academic biomedical manuscripts.
Analyze the text for:
1. Passages that closely match known published literature (verbatim or near-verbatim)
2. Passages that are appropriately cited (citation-aware — these are NOT plagiarism)
3. Uncited passages closely resembling existing literature

Return JSON:
{
  "similarity": <0-100 percent overall similarity>,
  "sources": [
    { "url": "<doi or URL>", "title": "<paper title>", "similarity": <0-100> }
  ],
  "summary": "<2-3 sentence assessment>"
}
Note: cited passages reduce, not increase, the plagiarism score.`,
          },
          { role: "user", content: manuscript.slice(0, 6000) },
        ],
        responseFormat: "json",
        temperature: 0.1,
        maxTokens: 2048,
      });

      const parsed = parseJsonResponse<{
        similarity: number;
        sources: Array<{ url: string; title: string; similarity: number }>;
        summary: string;
      }>(raw);

      return NextResponse.json(
        parsed ?? { similarity: 0, sources: [], summary: "Analysis inconclusive." }
      );
    } catch (error) {
      console.error("[api/pipeline/ric/plagiarism]", error);
      return NextResponse.json({ error: "Plagiarism scan failed" }, { status: 500 });
    }
  });
}
