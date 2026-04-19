import {
  type Content,
  type FunctionDeclaration,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import {
  type LLMCallOptions,
  LLMConfigurationError,
  type LLMMessage,
  type LLMStreamOptions,
  type LLMToolDef,
  getDefaultModel,
} from "./index";

function getGoogleApiKey(): string {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new LLMConfigurationError("GOOGLE_AI_API_KEY is not set");
  }

  return apiKey;
}

function toGeminiMessages(messages: LLMMessage[]): {
  contents: Content[];
  systemInstruction?: string;
} {
  const systemParts: string[] = [];
  const contents: Content[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
      continue;
    }

    if (message.role === "tool") {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: message.toolCallId || "tool",
              response: { content: message.content },
            },
          },
        ],
      });
      continue;
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    });
  }

  return {
    contents,
    systemInstruction: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
  };
}

function toFunctionDeclarations(tools: LLMToolDef[] | undefined): FunctionDeclaration[] | undefined {
  if (!tools || tools.length === 0) {
    return undefined;
  }

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as unknown as FunctionDeclaration["parameters"],
  }));
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Unknown LLM error");
}

export async function callGoogleLLM(opts: LLMCallOptions): Promise<string> {
  const genAI = new GoogleGenerativeAI(getGoogleApiKey());
  const model = genAI.getGenerativeModel({
    model: opts.model || getDefaultModel(),
    systemInstruction: toGeminiMessages(opts.messages).systemInstruction,
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxTokens ?? 4096,
      responseMimeType: opts.responseFormat === "json" ? "application/json" : "text/plain",
    },
  });

  const request = toGeminiMessages(opts.messages);
  const result = await model.generateContent({
    contents: request.contents,
    systemInstruction: request.systemInstruction,
  });

  return result.response.text();
}

export async function streamGoogleLLM(opts: LLMStreamOptions): Promise<void> {
  try {
    const genAI = new GoogleGenerativeAI(getGoogleApiKey());
    const request = toGeminiMessages(opts.messages);
    const model = genAI.getGenerativeModel({
      model: opts.model || getDefaultModel(),
      systemInstruction: request.systemInstruction,
      generationConfig: {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxTokens ?? 4096,
      },
      tools: toFunctionDeclarations(opts.tools)
        ? [{ functionDeclarations: toFunctionDeclarations(opts.tools) }]
        : undefined,
    });

    const result = await model.generateContentStream({
      contents: request.contents,
      systemInstruction: request.systemInstruction,
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        opts.callbacks.onText(text);
      }

      const functionCalls = chunk.functionCalls();
      if (functionCalls?.length) {
        for (const functionCall of functionCalls) {
          await opts.callbacks.onToolCall(
            functionCall.name,
            (functionCall.args ?? {}) as Record<string, unknown>,
          );
        }
      }
    }

    opts.callbacks.onDone();
  } catch (error) {
    opts.callbacks.onError(toError(error));
  }
}
