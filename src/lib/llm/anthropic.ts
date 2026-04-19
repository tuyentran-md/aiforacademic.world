import {
  type LLMCallOptions,
  LLMConfigurationError,
  type LLMStreamOptions,
} from "./index";

function unsupported(): never {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new LLMConfigurationError("ANTHROPIC_API_KEY is not set");
  }

  throw new Error("Anthropic provider is not implemented yet");
}

export async function callAnthropicLLM(options: LLMCallOptions): Promise<string> {
  void options;
  unsupported();
}

export async function streamAnthropicLLM(options: LLMStreamOptions): Promise<void> {
  void options;
  unsupported();
}
