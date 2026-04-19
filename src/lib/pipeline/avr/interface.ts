import { type AVRRequest, type Blueprint, type SSEEvent } from "@/lib/pipeline/types";

export interface AVRModule {
  run(
    request: AVRRequest,
    emit: (event: SSEEvent) => void,
  ): Promise<{ manuscript: string; blueprint: Blueprint }>;
}
