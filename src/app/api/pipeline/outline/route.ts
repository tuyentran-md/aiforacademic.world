import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

type StudyType = "RCT" | "cohort" | "MA" | "SR" | "case_report" | "narrative" | "letter";

const STUDY_TYPE_TEMPLATES: Record<StudyType, string> = {
  RCT: "Randomized Controlled Trial — PICO with allocation, randomisation, blinding, primary/secondary outcomes, sample size, analysis plan.",
  cohort: "Cohort Study — exposure-outcome, follow-up duration, loss to follow-up, confounders, Cox/logistic regression plan.",
  MA: "Meta-Analysis — PICO, databases, PRISMA, heterogeneity (I²), publication bias, subgroup analysis.",
  SR: "Systematic Review — PICO, databases, PRISMA, inclusion/exclusion, quality assessment (GRADE/RoB), narrative synthesis.",
  case_report: "Case Report — patient info, timeline, investigation, treatment, outcome, learning points, consent statement.",
  narrative: "Narrative Review — scope, search strategy, section structure, key themes, limitations.",
  letter: "Letter to Editor — context (which article), specific critique/addition, supporting data, call to action.",
};

export async function POST(request: NextRequest) {
  return withQuota(request, "generate_outline", async () => {
    try {
      const body = await request.json();
      const { topic, studyType } = body as { topic: string; studyType: StudyType };

      if (!topic || topic.trim().length < 10) {
        return NextResponse.json({ error: "Topic too short" }, { status: 400 });
      }

      const template = STUDY_TYPE_TEMPLATES[studyType] ?? STUDY_TYPE_TEMPLATES.narrative;

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
          { role: "user", content: `Topic: ${topic.trim()}\nStudy type: ${studyType}` },
        ],
        temperature: 0.3,
        maxTokens: 2048,
      });

      return NextResponse.json({ outline: outline.trim() });
    } catch (error) {
      console.error("[api/pipeline/outline]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Outline generation failed" },
        { status: 500 }
      );
    }
  });
}
