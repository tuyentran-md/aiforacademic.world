import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";
import { withQuota } from "@/lib/quota-wrapper";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Workspace chat endpoint — proxies Gemini call server-side to protect API key.
 * Streams text back as plain text chunks.
 */
export async function POST(request: NextRequest) {
  return withQuota(request, "workspace_messages", async () => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    try {
      const body = await request.json();
      const { history, systemPrompt, outputLanguage } = body as {
        history: Content[];
        systemPrompt: string;
        outputLanguage?: "VI" | "EN";
      };

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `${systemPrompt}\n\nOutput language: ${outputLanguage === "EN" ? "English" : "Vietnamese"}`,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      const result = await model.generateContentStream({ contents: history });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      console.error("[api/workspace/chat]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Chat failed" },
        { status: 500 }
      );
    }
  });
}
