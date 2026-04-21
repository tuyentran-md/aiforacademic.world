import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Polish a manuscript with style guide + anti-hallucination rules */
export async function POST(request: NextRequest) {
  return withQuota(request, "polish_prose", async () => {
    try {
      const body = await request.json();
      const { manuscript, journalStyle, context, peerReview } = body as {
        manuscript: string;
        journalStyle?: "nature" | "bmj" | "jama" | "generic";
        context?: string;
        peerReview?: unknown;
      };

      if (!manuscript || manuscript.trim().length < 50) {
        return NextResponse.json({ error: "Manuscript too short" }, { status: 400 });
      }

      const styleGuides: Record<string, string> = {
        nature: "Nature family style: active voice, concise, 200-word abstract, IMRaD structure, Vancouver references.",
        bmj: "BMJ style: structured abstract, UK English, box summaries, patient perspective section.",
        jama: "JAMA style: structured abstract (Importance/Objective/Design/Results/Conclusions), US English, AMA references.",
        generic: "Standard academic style: clear, logical, formal English. Appropriate for a peer-reviewed journal.",
      };

      const style = styleGuides[journalStyle ?? "generic"] ?? styleGuides.generic;

      const systemPrompt = `You are a professional academic manuscript editor.
    
Style guide: ${style}

STRICT anti-hallucination rules — NEVER violate:
1. Preserve ALL citation markers verbatim: [1], [2,3], (Smith, 2023), [ref-001]
2. Preserve ALL numerical values: percentages, p-values, CIs, means, sample sizes
3. Do NOT add new facts or statistics not present in the original
4. Do NOT remove important medical information
${context ? `5. Ground truth provided by author — treat as authoritative:\n${context}` : ""}
${peerReview ? `6. Apply peer review suggestions:\n${JSON.stringify(peerReview, null, 2)}` : ""}

Return JSON: { "original": "<original text>", "polished": "<polished text>" }
The polished text should improve clarity, flow, grammar, and style while preserving all medical content.`;

      const raw = await callLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: manuscript.trim() },
        ],
        responseFormat: "json",
        temperature: 0.15,
        maxTokens: 8192,
      });

      const parsed = parseJsonResponse<{ original: string; polished: string }>(raw);
      if (!parsed) {
        return NextResponse.json({
          original: manuscript.trim(),
          polished: raw.trim(),
          diff: "",
        });
      }

      return NextResponse.json({
        original: parsed.original ?? manuscript.trim(),
        polished: parsed.polished,
        diff: "",
      });
    } catch (error) {
      console.error("[api/pipeline/polish]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Polish failed" },
        { status: 500 }
      );
    }
  });
}
