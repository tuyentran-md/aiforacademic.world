import { NextResponse } from "next/server";
import { runRIC } from "@/lib/pipeline/ric";
import { createSSEStream, sseResponse } from "@/lib/pipeline/sse";
import { type RICRequest, type Reference } from "@/lib/pipeline/types";

export const runtime = "nodejs";

function isLanguage(value: unknown): value is "EN" | "VI" {
  return value === "EN" || value === "VI";
}

function isReferenceArray(value: unknown): value is Reference[] {
  return Array.isArray(value);
}

export async function POST(request: Request) {
  let body: Partial<RICRequest>;

  try {
    body = (await request.json()) as Partial<RICRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.manuscript?.trim()) {
    return NextResponse.json({ error: "manuscript is required" }, { status: 400 });
  }

  if (!isReferenceArray(body.references)) {
    return NextResponse.json({ error: "references must be an array" }, { status: 400 });
  }

  const payload: RICRequest = {
    manuscript: body.manuscript,
    references: body.references,
    language: isLanguage(body.language) ? body.language : "EN",
  };

  const { stream, emit, close } = createSSEStream();

  queueMicrotask(async () => {
    try {
      await runRIC(payload, emit);
    } catch (error) {
      emit({
        type: "error",
        data: {
          code: "RIC_FAILED",
          message: error instanceof Error ? error.message : "RIC failed",
        },
      });
    } finally {
      close();
    }
  });

  return sseResponse(stream);
}
