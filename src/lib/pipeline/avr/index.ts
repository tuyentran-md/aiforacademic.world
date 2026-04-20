import { type AVRModule } from "./interface";
// NOTE: "mock" is a legacy filename — the module is a full LLM-backed
// implementation (callLLM + streamLLM, blueprint generation, section streaming).
import { avrMock as avrImplementation } from "./mock";

export const avrModule: AVRModule = avrImplementation;
