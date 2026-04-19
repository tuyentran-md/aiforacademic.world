import { callAnthropicLLM, streamAnthropicLLM } from "./anthropic";
import { callGoogleLLM, streamGoogleLLM } from "./google";

export type LLMProvider = "google" | "anthropic";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
}

export interface LLMToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMStreamCallbacks {
  onText: (chunk: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<string>;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface LLMBaseOptions {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMStreamOptions extends LLMBaseOptions {
  tools?: LLMToolDef[];
  callbacks: LLMStreamCallbacks;
}

export interface LLMCallOptions extends LLMBaseOptions {
  responseFormat?: "text" | "json";
}

const llmRequestTimestamps: number[] = [];

export class LLMConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMConfigurationError";
  }
}

async function enforceRateLimit(): Promise<void> {
  const maxRequestsPerMinute = Number(process.env.LLM_MAX_RPM || 10);
  if (!Number.isFinite(maxRequestsPerMinute) || maxRequestsPerMinute <= 0) {
    return;
  }

  while (true) {
    const now = Date.now();
    while (
      llmRequestTimestamps.length > 0 &&
      now - llmRequestTimestamps[0] >= 60_000
    ) {
      llmRequestTimestamps.shift();
    }

    if (llmRequestTimestamps.length < maxRequestsPerMinute) {
      llmRequestTimestamps.push(now);
      return;
    }

    const waitMs = Math.max(25, 60_000 - (now - llmRequestTimestamps[0]));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

export function getLLMProvider(): LLMProvider {
  return process.env.LLM_PROVIDER === "anthropic" ? "anthropic" : "google";
}

export function getDefaultModel(): string {
  return process.env.LLM_MODEL || "gemini-2.5-flash";
}

export function hasLLMConfiguration(provider: LLMProvider = getLLMProvider()): boolean {
  if (provider === "anthropic") {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

export async function streamLLM(opts: LLMStreamOptions): Promise<void> {
  await enforceRateLimit();
  const provider = getLLMProvider();

  if (provider === "anthropic") {
    await streamAnthropicLLM(opts);
    return;
  }

  await streamGoogleLLM(opts);
}

export async function callLLM(opts: LLMCallOptions): Promise<string> {
  await enforceRateLimit();
  const provider = getLLMProvider();

  if (provider === "anthropic") {
    return callAnthropicLLM(opts);
  }

  return callGoogleLLM(opts);
}
