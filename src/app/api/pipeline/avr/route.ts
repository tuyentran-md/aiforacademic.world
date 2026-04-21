import { NextResponse } from "next/server";
import { avrModule } from "@/lib/pipeline/avr";
import { createSSEStream, sseResponse } from "@/lib/pipeline/sse";
import {
  type ArticleType,
  type AVRRequest,
  type Reference,
} from "@/lib/pipeline/types";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";

const ARTICLE_TYPES: ArticleType[] = [
  "case_report",
  "narrative_review",
  "systematic_review",
  "original_research",
  "letter_to_editor",
  "editorial",
  "brief_communication",
];

function isLanguage(value: unknown): value is "EN" | "VI" {
  return value === "EN" || value === "VI";
}

function isArticleType(value: unknown): value is ArticleType {
  return typeof value === "string" && ARTICLE_TYPES.includes(value as ArticleType);
}

function isReferenceArray(value: unknown): value is Reference[] {
  return Array.isArray(value);
}

export async function POST(request: Request) {
  return withQuota(request, "draft_manuscript", async () => {
    let body: Partial<AVRRequest>;

    try {
      body = (await request.json()) as Partial<AVRRequest>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    if (!isReferenceArray(body.references) || body.references.length === 0) {
      return NextResponse.json({ error: "references are required" }, { status: 400 });
    }

    const payload: AVRRequest = {
      query: body.query.trim(),
      references: body.references,
      language: isLanguage(body.language) ? body.language : "EN",
      articleType: isArticleType(body.articleType) ? body.articleType : undefined,
    };

    const { stream, emit, close } = createSSEStream();

    queueMicrotask(async () => {
      try {
        await avrModule.run(payload, emit);
      } catch (error) {
        emit({
          type: "error",
          data: {
            code: "AVR_FAILED",
            message: error instanceof Error ? error.message : "AVR failed",
          },
        });
      } finally {
        close();
      }
    });

    return sseResponse(stream);
  });
}
