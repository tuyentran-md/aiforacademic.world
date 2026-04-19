import { SSEEvent } from "./types";

export function createSSEStream(): {
  stream: ReadableStream;
  emit: (event: SSEEvent) => void;
  close: () => void;
} {
  const encoder = new TextEncoder();
  const transform = new TransformStream<Uint8Array, Uint8Array>();
  const writer = transform.writable.getWriter();
  let closed = false;
  let queue = Promise.resolve();

  const write = (payload: string) => {
    queue = queue
      .then(() => writer.write(encoder.encode(payload)))
      .catch(() => undefined);
  };

  const emit = (event: SSEEvent) => {
    if (closed) {
      return;
    }

    write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const close = () => {
    if (closed) {
      return;
    }

    closed = true;
    queue = queue.finally(() => writer.close().catch(() => undefined));
  };

  return { stream: transform.readable, emit, close };
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
