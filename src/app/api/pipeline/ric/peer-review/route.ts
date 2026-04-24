import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Peer review simulator — editor-style structured feedback */
export async function POST(request: NextRequest) {
  return withQuota(request, "peer_review", async () => {
    try {
      const body = await request.json();
      const { manuscript } = body as { manuscript: string };
      if (!manuscript) return NextResponse.json({ error: "No manuscript" }, { status: 400 });

      // Peer review needs the FULL paper to comment on structure / methods / results /
      // discussion. Send up to 60 KB — covers any normal-length paper whole. Old
      // slice(0, 8000) only saw intro and produced shallow feedback.
      const MAX_INPUT = 60_000;
      const trimmed = manuscript.length > MAX_INPUT ? manuscript.slice(0, MAX_INPUT) : manuscript;

      const raw = await callLLM({
        messages: [
          {
            role: "system",
            content: `You are an experienced academic peer reviewer for a Q1 medical journal.
Provide structured, constructive editorial feedback on the manuscript.
Return JSON ONLY:
{
  "summary": "<2-3 sentence overall assessment>",
  "sections": [
    {
      "heading": "<section name e.g. Abstract|Introduction|Methods|Results|Discussion|Conclusion>",
      "comments": ["<specific comment 1>", "<specific comment 2>"]
    }
  ],
  "recommendation": "<Accept|Major Revision|Minor Revision|Reject>"
}
Be specific, actionable, and constructive. Identify genuine methodological or reporting issues.`,
          },
          { role: "user", content: trimmed },
        ],
        responseFormat: "json",
        temperature: 0.2,
        maxTokens: 8192,
      });

      const parsed = parseJsonResponse<{
        summary: string;
        sections: Array<{ heading: string; comments: string[] }>;
        recommendation: string;
      }>(raw);

      if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        return NextResponse.json(
          {
            error:
              "Peer review couldn't parse the manuscript into sections. Try pasting more of the paper (Abstract through Discussion).",
          },
          { status: 422 }
        );
      }

      return NextResponse.json(parsed);
    } catch (error) {
      console.error("[api/pipeline/ric/peer-review]", error);
      return NextResponse.json({ error: "Peer review failed" }, { status: 500 });
    }
  });
}
