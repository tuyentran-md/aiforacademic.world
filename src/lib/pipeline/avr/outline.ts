/**
 * src/lib/pipeline/avr/outline.ts
 *
 * Generates a PICO + protocol outline for a research topic.
 * Mirrors the /api/pipeline/outline route but as a reusable lib function.
 */
import { callLLM } from "@/lib/llm";

export type StudyType = "RCT" | "cohort" | "MA" | "SR" | "case_report" | "narrative" | "letter";

export interface OutlineOptions {
  topic: string;
  studyType: StudyType;
}

const STUDY_TYPE_TEMPLATES: Record<StudyType, string> = {
  RCT: "Randomized Controlled Trial — PICO with allocation, randomisation, blinding, primary/secondary outcomes, sample size, analysis plan.",
  cohort: "Cohort Study — exposure-outcome, follow-up duration, loss to follow-up, confounders, Cox/logistic regression plan.",
  MA: "Meta-Analysis — PICO, databases, PRISMA, heterogeneity (I²), publication bias, subgroup analysis.",
  SR: "Systematic Review — PICO, databases, PRISMA, inclusion/exclusion, quality assessment (GRADE/RoB), narrative synthesis.",
  case_report: "Case Report — patient info, timeline, investigation, treatment, outcome, learning points, consent statement.",
  narrative: "Narrative Review — scope, search strategy, section structure, key themes, limitations.",
  letter: "Letter to Editor — context (which article), specific critique/addition, supporting data, call to action.",
};

export async function generateOutline(opts: OutlineOptions): Promise<string> {
  const template = STUDY_TYPE_TEMPLATES[opts.studyType];

  const systemPrompt = `You are an expert academic research methodologist helping Vietnamese clinicians plan research protocols.
Generate a detailed research outline in Markdown format for the given topic and study type.

Study type context: ${template}

Your outline MUST include:
1. **Background** — 2-3 bullet points on the problem and knowledge gap
2. **Research Question / Objective**
3. **PICO** — Population, Intervention, Comparator, Outcome
4. **Study Design** — specific design choice with justification
5. **Inclusion / Exclusion Criteria** — at least 3 each
6. **Sample Size Estimate** — with reasoning
7. **Data Collection** — key variables
8. **Statistical Analysis Plan** — specific tests appropriate for design
9. **Ethical Considerations**
10. **Expected Limitations**

Write in clear academic English. Be specific, not generic.`;

  const outline = await callLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Topic: ${opts.topic.trim()}\nStudy type: ${opts.studyType}` },
    ],
    temperature: 0.3,
    maxTokens: 2048,
  });

  return outline.trim();
}
