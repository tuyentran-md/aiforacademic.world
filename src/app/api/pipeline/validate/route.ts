import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return withQuota(request, "validate_idea", async () => {
    try {
      const body = await request.json();
      const { idea, field, journal } = body as {
        idea: string;
        field?: string;
        journal?: string;
      };

      if (!idea || idea.trim().length < 20) {
        return NextResponse.json({ error: "Idea too short" }, { status: 400 });
      }

      const systemPrompt = `You are a senior academic editor and research methodologist. 
Critique research ideas for Vietnamese clinical researchers.
Return ONLY valid JSON with the following exact structure:
{
  "novelty": { "score": <1-10>, "comment": "<1-2 sentences>" },
  "feasibility": { "score": <1-10>, "comment": "<1-2 sentences>" },
  "publishability": { "score": <1-10>, "comment": "<1-2 sentences>" },
  "redFlags": ["<flag1>", ...],
  "recommendation": "<2-3 sentence actionable recommendation>",
  "suggestedStudyType": "<RCT|cohort|MA|SR|case_report|narrative|letter>"
}
Be constructive but honest. Identify real risks.`;

      const userContent = [
        `Research idea: ${idea.trim()}`,
        field ? `Field: ${field}` : null,
        journal ? `Target journal: ${journal}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const raw = await callLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        responseFormat: "json",
        temperature: 0.2,
        maxTokens: 2048,
      });

      const parsed = parseJsonResponse<{
        novelty: { score: number; comment: string };
        feasibility: { score: number; comment: string };
        publishability: { score: number; comment: string };
        redFlags: string[];
        recommendation: string;
        suggestedStudyType: string;
      }>(raw);

      if (!parsed) {
        console.error("[api/pipeline/validate] parse failed. Raw:", raw?.slice(0, 500));
        return NextResponse.json({ error: "Failed to parse LLM response", raw: raw?.slice(0, 500) }, { status: 500 });
      }

      return NextResponse.json(parsed);
    } catch (error) {
      console.error("[api/pipeline/validate]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Validation failed" },
        { status: 500 }
      );
    }
  });
}
