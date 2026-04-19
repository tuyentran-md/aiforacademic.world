import { createSSEStream, sseResponse } from "@/lib/pipeline/sse";

export const runtime = "nodejs";

export async function POST() {
  const { stream, emit, close } = createSSEStream();

  queueMicrotask(async () => {
    try {
      emit({
        type: "status",
        data: {
          status: "idle",
          message: "Smoke test started",
        },
      });

      emit({
        type: "log",
        data: {
          tool: "System",
          message: "hello from SSE",
          timestamp: new Date().toISOString(),
        },
      });

      emit({ type: "done", data: { step: 1 } });
    } finally {
      close();
    }
  });

  return sseResponse(stream);
}
