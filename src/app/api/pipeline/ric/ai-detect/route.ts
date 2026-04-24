import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

/** AI writing detector — score 0-100, verdict, patterns */
export async function POST(request: NextRequest) {
  return withQuota(request, "ai_detect", async () => {
    try {
      const body = await request.json();
      const { manuscript } = body as { manuscript: string };
      if (!manuscript) return NextResponse.json({ error: "No manuscript" }, { status: 400 });

      // AI-detection signal lives in the BODY prose (not bibliography). Send full text
      // up to 60 KB — that covers virtually any paper whole. The old slice(0, 6000)
      // analysed only the abstract/intro and produced unreliable verdicts.
      const MAX_INPUT = 60_000;
      const trimmed = manuscript.length > MAX_INPUT ? manuscript.slice(0, MAX_INPUT) : manuscript;

      const raw = await callLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert AI writing detector trained on human vs AI text patterns in academic biomedical writing.
Analyze the manuscript for AI writing signals: repetitive sentence structure, hedging overuse, missing specificity, overly uniform paragraph length, lack of first-person voice, absence of personal clinical experience, etc.
Return JSON ONLY:
{
  "score": <0-100, where 0=fully human, 100=fully AI>,
  "verdict": "Human|AI|Mixed",
  "patterns": ["<detected pattern 1>", ...],
  "summary": "<2-3 sentence explanation>"
}`,
          },
          { role: "user", content: trimmed },
        ],
        responseFormat: "json",
        temperature: 0.1,
        maxTokens: 4096,
      });

      const parsed = parseJsonResponse<{
        score: number;
        verdict: "Human" | "AI" | "Mixed";
        patterns: string[];
        summary: string;
      }>(raw);

      if (!parsed) {
        return NextResponse.json(
          {
            error:
              "AI detection failed to produce a result. Try a longer or cleaner sample of body text (intro/methods/discussion paragraphs).",
          },
          { status: 422 }
        );
      }

      return NextResponse.json(parsed);
    } catch (error) {
      console.error("[api/pipeline/ric/ai-detect]", error);
      return NextResponse.json({ error: "AI detection failed" }, { status: 500 });
    }
  });
}
