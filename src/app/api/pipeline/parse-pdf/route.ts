import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/pipeline/parse-pdf
 * Accepts multipart FormData with a "file" field (PDF or DOCX or TXT)
 * Returns { text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 30 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.toLowerCase();
    let text = "";

    if (filename.endsWith(".pdf")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (filename.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (filename.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file — it may be scanned/image-only." }, { status: 400 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error("[api/pipeline/parse-pdf]", error);
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}
