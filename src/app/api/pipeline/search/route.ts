import { NextResponse } from "next/server";
import { createSSEStream, sseResponse } from "@/lib/pipeline/sse";
import { runSearch } from "@/lib/pipeline/search";
import { type SearchRequest } from "@/lib/pipeline/types";

export const runtime = "nodejs";

function isLanguage(value: unknown): value is "EN" | "VI" {
  return value === "EN" || value === "VI";
}

export async function POST(request: Request) {
  let body: Partial<SearchRequest>;

  try {
    body = (await request.json()) as Partial<SearchRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const payload: SearchRequest = {
    query: body.query.trim(),
    language: isLanguage(body.language) ? body.language : "EN",
    maxResults: Math.min(Math.max(body.maxResults || 10, 1), 20),
  };

  const { stream, emit, close } = createSSEStream();

  queueMicrotask(async () => {
    try {
      await runSearch(payload, emit);
    } catch (error) {
      emit({
        type: "error",
        data: {
          code: "SEARCH_FAILED",
          message: error instanceof Error ? error.message : "Search failed",
        },
      });
    } finally {
      close();
    }
  });

  return sseResponse(stream);
}
