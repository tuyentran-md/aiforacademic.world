/**
 * src/lib/pipeline/avr/draft.ts
 *
 * Clean re-export of the full AVR draft implementation.
 * Previously the implementation lived in mock.ts (legacy name).
 * Both names work — downstream code should prefer draft.ts.
 */
export { avrMock as avrDraft } from "./mock";
