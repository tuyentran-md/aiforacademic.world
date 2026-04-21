/**
 * src/lib/pipeline/avr/validate.ts
 *
 * Validates a research idea for novelty, feasibility, and publishability.
 * Returns structured critique. Mirrors the /api/pipeline/validate route logic
 * but as a reusable lib function.
 */
import { callLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";

export interface ValidationResult {
  novelty: { score: number; comment: string };
  feasibility: { score: number; comment: string };
  publishability: { score: number; comment: string };
  redFlags: string[];
  recommendation: string;
  suggestedStudyType: "RCT" | "cohort" | "MA" | "SR" | "case_report" | "narrative" | "letter";
}

export interface ValidateOptions {
  idea: string;
  field?: string;
  journal?: string;
}

export async function validateIdea(opts: ValidateOptions): Promise<ValidationResult> {
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
    `Research idea: ${opts.idea.trim()}`,
    opts.field ? `Field: ${opts.field}` : null,
    opts.journal ? `Target journal: ${opts.journal}` : null,
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
    maxTokens: 1024,
  });

  const parsed = parseJsonResponse<ValidationResult>(raw);
  if (!parsed) {
    throw new Error("Failed to parse validation response from LLM");
  }
  return parsed;
}
