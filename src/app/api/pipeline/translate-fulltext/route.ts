import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 120;

const CHUNK_SIZE = 2000; // chars
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(request: NextRequest) {
  return withQuota(request, "translate_fulltext", async () => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const targetLanguage = (formData.get("targetLanguage") as string) ?? "VI";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let text = "";
      const filename = file.name.toLowerCase();

      if (filename.endsWith(".docx")) {
        text = await extractTextFromDocx(buffer);
      } else if (filename.endsWith(".pdf")) {
        text = await extractTextFromPdf(buffer);
      } else {
        return NextResponse.json({ error: "Only PDF and DOCX supported" }, { status: 400 });
      }

      if (!text.trim()) {
        return NextResponse.json({ error: "Could not extract text from document" }, { status: 400 });
      }

      // Chunk and translate
      const chunks = chunkText(text);
      const translated: string[] = [];

      const langName = targetLanguage === "VI" ? "Vietnamese" : targetLanguage === "EN" ? "English" : targetLanguage;

      for (const chunk of chunks) {
        const result = await callLLM({
          messages: [
            {
              role: "system",
              content: `You are a professional medical translator. Translate the following academic biomedical text to ${langName}.
Rules:
- Preserve all citation markers verbatim: [1], [2,3], (Smith, 2023), etc.
- Preserve all numbers, statistics, p-values, percentages exactly
- Preserve headings structure (##, ###, etc.)
- Preserve figure/table references (Fig. 1, Table 2, etc.)
- Use precise medical terminology in ${langName}
- Output ONLY the translation, no explanations`,
            },
            { role: "user", content: chunk },
          ],
          temperature: 0.1,
          maxTokens: 4096,
        });
        translated.push(result.trim());
      }

      const translatedText = translated.join("\n\n");

      // Return as plain text (client can download as .txt or we could build a DOCX)
      // For now: return text, client downloads as .docx via content-disposition
      return new NextResponse(translatedText, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="translated_${file.name.replace(/\.(pdf|docx)$/i, "")}.txt"`,
          "X-Original-Filename": file.name,
          "X-Chunk-Count": String(chunks.length),
        },
      });
    } catch (error) {
      console.error("[api/pipeline/translate-fulltext]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Translation failed" },
        { status: 500 }
      );
    }
  });
}
