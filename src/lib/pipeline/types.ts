// ─── Reference (output of Search & Translate) ────────────────────────

export interface Reference {
  id: string;                    // unique within session (e.g., "ref-001")
  source: "pubmed" | "openalex"; // which API found it
  pmid?: string;                 // PubMed ID if from PubMed
  openalexId?: string;           // OpenAlex ID if from OpenAlex
  doi?: string;
  title: string;
  authors: string[];             // ["Smith J", "Doe A"]
  journal: string;
  year: number;
  abstract: string;              // original language
  abstractTranslated?: string;   // Vietnamese translation (if user lang = VI)
  url: string;                   // link to full text or DOI resolver
  citationCount?: number;        // from OpenAlex
  relevanceScore?: number;       // 0-1, assigned by LLM after ranking
  meshTerms?: string[];          // MeSH terms from PubMed
  concepts?: string[];           // concepts from OpenAlex
}

// ─── Pipeline Session State ──────────────────────────────────────────

export interface PipelineSession {
  id: string;                    // UUID
  query: string;                 // original user query
  language: "EN" | "VI";         // user's preferred language
  status: PipelineStatus;
  currentStep: 1 | 2 | 3;
  references: Reference[];       // populated after step 1
  manuscript: string;            // populated after step 2 (markdown)
  blueprint: Blueprint | null;   // populated during step 2
  integrityReport: IntegrityReport | null; // populated after step 3
  createdAt: string;             // ISO timestamp
}

export type PipelineStatus =
  | "idle"
  | "searching"
  | "translating"
  | "drafting"
  | "auditing"
  | "completed"
  | "error";

// ─── AVR Blueprint ───────────────────────────────────────────────────

export interface Blueprint {
  articleType: ArticleType;
  title: string;
  sections: BlueprintSection[];
}

export type ArticleType =
  | "case_report"
  | "narrative_review"
  | "systematic_review"
  | "original_research"
  | "letter_to_editor"
  | "editorial"
  | "brief_communication";

export interface BlueprintSection {
  heading: string;               // e.g., "Introduction", "Methods"
  instructions: string;          // what this section should contain
  referenceIds: string[];        // which references to cite here
}

// ─── RIC Integrity Report ────────────────────────────────────────────

export interface IntegrityReport {
  overallScore: number;          // 0-100
  flags: IntegrityFlag[];
  summary: string;               // 2-3 sentence summary
}

export interface IntegrityFlag {
  id: string;
  severity: "error" | "warning" | "info";
  type: FlagType;
  location: {
    sectionHeading: string;      // which section
    paragraphIndex: number;      // which paragraph (0-indexed)
    textSnippet: string;         // the flagged text (≤200 chars)
  };
  message: string;               // explanation of the issue
  suggestion?: string;           // how to fix it
  relatedReferenceIds?: string[]; // which references are relevant
}

export type FlagType =
  | "unsupported_claim"          // claim not backed by any reference
  | "misquoted_statistic"        // number doesn't match source
  | "logical_inconsistency"      // contradicts earlier statement
  | "missing_citation"           // needs a citation but has none
  | "hallucinated_reference"     // cites a reference not in the context
  | "overclaiming"               // conclusion stronger than evidence
  | "methodology_concern"        // methodological issue flagged
  | "factual_error";             // verifiably wrong fact

// ─── SSE Event Types ─────────────────────────────────────────────────

export type SSEEvent =
  | { type: "status"; data: { status: PipelineStatus; message: string } }
  | { type: "log"; data: { tool: string; message: string; timestamp: string; status?: "running" | "done" | "error" } }
  | { type: "reference"; data: Reference }                    // streamed one by one
  | { type: "manuscript_chunk"; data: { content: string } }   // streamed text
  | { type: "blueprint"; data: Blueprint }                    // sent once
  | { type: "integrity_flag"; data: IntegrityFlag }           // streamed one by one
  | { type: "integrity_summary"; data: { score: number; summary: string } }
  | { type: "error"; data: { code: string; message: string } }
  | { type: "done"; data: { step: 1 | 2 | 3 } };

// ─── API Request/Response ────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  language: "EN" | "VI";
  maxResults?: number;           // default 10, max 20
}

export interface AVRRequest {
  query: string;
  references: Reference[];
  articleType?: ArticleType;     // if user specifies, otherwise LLM decides
  language: "EN" | "VI";
}

export interface RICRequest {
  manuscript: string;            // markdown
  references: Reference[];
  language: "EN" | "VI";
}

export interface LogEntry {
  id: string;
  tool: "System" | "Search" | "PubMed" | "OpenAlex" | "Translator" | "AVR" | "RIC";
  message: string;
  timestamp: string;
  status?: "running" | "done" | "error";
}
