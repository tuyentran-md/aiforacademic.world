import { callLLM, hasLLMConfiguration, streamLLM } from "@/lib/llm";
import { parseJsonResponse } from "@/lib/pipeline/json";
import {
  type AVRRequest,
  type Blueprint,
  type BlueprintSection,
  type Reference,
} from "@/lib/pipeline/types";
import { type AVRModule } from "./interface";

function distributeReferenceIds(references: Reference[], bucketCount: number, bucketIndex: number): string[] {
  const selected = references
    .filter((_, index) => index % bucketCount === bucketIndex)
    .map((reference) => reference.id);

  return selected.length > 0 ? selected : references.slice(0, 3).map((reference) => reference.id);
}

function inferArticleType(request: AVRRequest): Blueprint["articleType"] {
  if (request.articleType) {
    return request.articleType;
  }

  const query = request.query.toLowerCase();
  if (query.includes("systematic review") || query.includes("meta-analysis")) {
    return "systematic_review";
  }
  if (query.includes("case report")) {
    return "case_report";
  }
  if (query.includes("trial") || query.includes("cohort") || query.includes("outcome")) {
    return "original_research";
  }

  return "narrative_review";
}

function buildFallbackSections(request: AVRRequest): BlueprintSection[] {
  const references = request.references;
  return [
    {
      heading: "Abstract",
      instructions: "Summarize the question, evidence base, and key conclusion in a compact abstract.",
      referenceIds: references.slice(0, 4).map((reference) => reference.id),
    },
    {
      heading: "Introduction",
      instructions: "Introduce the problem, why it matters, and the scope of the evidence base.",
      referenceIds: distributeReferenceIds(references, 4, 0),
    },
    {
      heading: "Evidence Landscape",
      instructions: "Synthesize the main findings from the included references and identify recurring themes.",
      referenceIds: distributeReferenceIds(references, 4, 1),
    },
    {
      heading: "Discussion",
      instructions: "Interpret the evidence, note limitations, and explain the clinical or research implications.",
      referenceIds: distributeReferenceIds(references, 4, 2),
    },
    {
      heading: "Conclusion",
      instructions: "State the cautious take-away and indicate where stronger evidence is still needed.",
      referenceIds: distributeReferenceIds(references, 4, 3),
    },
  ];
}

function buildFallbackBlueprint(request: AVRRequest): Blueprint {
  const articleType = inferArticleType(request);
  const titleLead = request.query.replace(/[?.!]+$/, "").trim();

  return {
    articleType,
    title: titleLead
      ? `${titleLead.charAt(0).toUpperCase()}${titleLead.slice(1)}`
      : "Draft academic manuscript",
    sections: buildFallbackSections(request),
  };
}

async function generateBlueprint(request: AVRRequest): Promise<Blueprint> {
  if (!hasLLMConfiguration()) {
    return buildFallbackBlueprint(request);
  }

  try {
    const response = await callLLM({
      messages: [
        {
          role: "system",
          content:
            'You are an academic research blueprint generator. Output only valid JSON with keys: articleType, title, sections[]. Each section needs heading, instructions, referenceIds.',
        },
        {
          role: "user",
          content: JSON.stringify({
            query: request.query,
            language: request.language,
            preferredType: request.articleType || "auto",
            references: request.references.map((reference) => ({
              id: reference.id,
              title: reference.title,
              abstract: reference.abstractTranslated || reference.abstract,
              year: reference.year,
            })),
          }),
        },
      ],
      responseFormat: "json",
      temperature: 0.2,
      maxTokens: 2048,
    });

    const parsed = parseJsonResponse<Blueprint>(response);
    if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return buildFallbackBlueprint(request);
    }

    return {
      articleType: parsed.articleType || inferArticleType(request),
      title: parsed.title || buildFallbackBlueprint(request).title,
      sections: parsed.sections.map((section) => ({
        heading: section.heading,
        instructions: section.instructions,
        referenceIds: section.referenceIds?.length ? section.referenceIds : request.references.slice(0, 3).map((reference) => reference.id),
      })),
    };
  } catch {
    return buildFallbackBlueprint(request);
  }
}

function buildFallbackSectionContent(
  section: BlueprintSection,
  blueprint: Blueprint,
  request: AVRRequest,
  relevantReferences: Reference[],
): string {
  const evidence = relevantReferences
    .slice(0, 3)
    .map((reference) => {
      const citation = `[${reference.id}]`;
      const summarySource = (reference.abstractTranslated || reference.abstract || reference.title).trim();
      const summary = summarySource.length > 220 ? `${summarySource.slice(0, 217)}...` : summarySource;
      return `${reference.title} ${citation} suggests ${summary.toLowerCase()}`;
    })
    .join(" ");

  const defaultEvidence =
    request.language === "VI"
      ? "Nguon tai lieu hien co van con han che, vi vay nhung nhan dinh duoi day can duoc dien giai than trong [NEEDS_MORE_EVIDENCE]."
      : "The available reference set remains limited, so the synthesis below should be interpreted cautiously [NEEDS_MORE_EVIDENCE].";

  if (request.language === "VI") {
    return [
      `Phan ${section.heading.toLowerCase()} cua ban thao ${blueprint.articleType.replaceAll("_", " ")} nay tap trung vao cau hoi: ${request.query}.`,
      evidence || defaultEvidence,
      "Can bo sung du lieu goc va thong tin toan van truoc khi xem day la ban thao san sang nop tap chi.",
    ].join("\n\n");
  }

  return [
    `This ${section.heading.toLowerCase()} section addresses the question "${request.query}" within a ${blueprint.articleType.replaceAll("_", " ")} framing.`,
    evidence || defaultEvidence,
    "The current draft should be treated as a working manuscript scaffold until full-text review and source verification are completed.",
  ].join("\n\n");
}

async function writeSection(
  section: BlueprintSection,
  blueprint: Blueprint,
  request: AVRRequest,
  relevantReferences: Reference[],
  onChunk: (chunk: string) => void,
): Promise<void> {
  if (!hasLLMConfiguration()) {
    onChunk(buildFallbackSectionContent(section, blueprint, request, relevantReferences));
    return;
  }

  let errored = false;

  await streamLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an academic manuscript writer. Write the requested section in Markdown-ready prose. Cite references inline as [ref-XXX], never invent sources, and mark thin evidence with [NEEDS_MORE_EVIDENCE]. Output only the section body.",
      },
      {
        role: "user",
        content: JSON.stringify({
          query: request.query,
          language: request.language,
          articleType: blueprint.articleType,
          sectionHeading: section.heading,
          instructions: section.instructions,
          references: relevantReferences.map((reference) => ({
            id: reference.id,
            title: reference.title,
            abstract: reference.abstractTranslated || reference.abstract,
            year: reference.year,
          })),
        }),
      },
    ],
    temperature: 0.4,
    maxTokens: 2048,
    callbacks: {
      onText: onChunk,
      onToolCall: async () => "",
      onDone: () => undefined,
      onError: () => {
        errored = true;
      },
    },
  });

  if (errored) {
    onChunk(`\n${buildFallbackSectionContent(section, blueprint, request, relevantReferences)}`);
  }
}

export const avrMock: AVRModule = {
  async run(request, emit) {
    emit({
      type: "status",
      data: {
        status: "drafting",
        message: "Preparing manuscript structure...",
      },
    });

    const blueprint = await generateBlueprint(request);
    emit({ type: "blueprint", data: blueprint });

    let manuscript = `# ${blueprint.title}\n\n`;
    emit({ type: "manuscript_chunk", data: { content: manuscript } });

    for (const section of blueprint.sections) {
      emit({
        type: "log",
        data: {
          tool: "AVR",
          message: `Writing: ${section.heading}...`,
          timestamp: new Date().toISOString(),
        },
      });

      const relevantReferences = request.references.filter((reference) =>
        section.referenceIds.includes(reference.id),
      );
      const headingChunk = `## ${section.heading}\n\n`;
      manuscript += headingChunk;
      emit({ type: "manuscript_chunk", data: { content: headingChunk } });

      await writeSection(section, blueprint, request, relevantReferences, (chunk) => {
        manuscript += chunk;
        emit({ type: "manuscript_chunk", data: { content: chunk } });
      });

      manuscript += "\n\n";
      emit({ type: "manuscript_chunk", data: { content: "\n\n" } });
    }

    emit({
      type: "status",
      data: {
        status: "completed",
        message: "Manuscript draft complete",
      },
    });
    emit({ type: "done", data: { step: 2 } });

    return { manuscript, blueprint };
  },
};
