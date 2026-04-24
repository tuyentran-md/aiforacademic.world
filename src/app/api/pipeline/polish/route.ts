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

      // Polish output is ~as long as input. Output must fit in maxTokens (~16K
      // tokens ≈ 50K chars). Cap input at 12K chars (~3K tokens) so polished
      // output (also ~3K tokens) plus the JSON wrapper has room. Larger papers
      // need to be polished section-by-section.
      const MAX_INPUT = 12_000;
      const truncated = manuscript.length > MAX_INPUT;
      const trimmed = truncated ? manuscript.slice(0, MAX_INPUT) : manuscript;

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
          { role: "user", content: trimmed.trim() },
        ],
        responseFormat: "json",
        temperature: 0.15,
        maxTokens: 16384,
      });

      const parsed = parseJsonResponse<{ original: string; polished: string }>(raw);
      // If parse failed OR the LLM returned the JSON wrapper as a string, the
      // output was truncated. Return a useful 422 instead of dumping malformed
      // JSON into the `polished` field.
      if (!parsed || !parsed.polished || parsed.polished.trim().startsWith("{")) {
        return NextResponse.json(
          {
            error:
              "Polish output was truncated. Try polishing one section at a time (Abstract, Introduction, Methods, etc. separately) instead of the whole paper.",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        original: parsed.original ?? trimmed.trim(),
        polished: parsed.polished,
        diff: "",
        ...(truncated && {
          warning: `Manuscript was truncated to ${MAX_INPUT} characters before polishing. For a full paper, polish each section separately.`,
        }),
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
