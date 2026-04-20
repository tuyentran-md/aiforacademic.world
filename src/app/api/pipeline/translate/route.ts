import { NextResponse } from "next/server";
import { translateAbstracts } from "@/lib/pipeline/search/translate";
import { type Reference } from "@/lib/pipeline/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { id: string; abstract: string; targetLanguage?: "EN" | "VI" };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.id || !body.abstract?.trim()) {
    return NextResponse.json({ error: "id and abstract are required" }, { status: 400 });
  }

  // Create minimal mock reference struct to satisfy type
  const refMock: Reference = {
    id: body.id,
    abstract: body.abstract,
    title: "",
    authors: [],
    journal: "",
    year: 0,
    source: "pubmed",
    url: "",
  };

  try {
    const targetLang = body.targetLanguage || "VI";
    const translatedArray = await translateAbstracts([refMock], targetLang);
    
    if (translatedArray.length === 0 || !translatedArray[0].abstractTranslated) {
      return NextResponse.json({ error: "Translation failed to return text" }, { status: 500 });
    }

    return NextResponse.json({
      id: body.id,
      abstractTranslated: translatedArray[0].abstractTranslated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Translation failed" },
      { status: 500 }
    );
  }
}
