export type PlanLevel = "anon" | "free" | "pro";

// All functions tracked in usage docs
export type TrackedFunction =
  | "search_papers"
  | "translate_abstracts"
  | "validate_idea"
  | "generate_outline"
  | "draft_manuscript"
  | "check_citations"
  | "ai_detect"
  | "plagiarism"
  | "peer_review"
  | "extract_refs"
  | "translate_fulltext"
  | "polish_prose"
  | "workspace_messages";

export const QUOTA_MATRIX: Record<PlanLevel, Record<TrackedFunction, number>> = {
  anon: {
    // Very tight — 2-3 trial uses
    search_papers: 5,
    translate_abstracts: 5,
    validate_idea: 1,
    generate_outline: 1,
    draft_manuscript: 1,
    check_citations: 2,
    ai_detect: 2,
    plagiarism: 2,
    peer_review: 2,
    extract_refs: 2,
    translate_fulltext: 1,
    polish_prose: 1,
    workspace_messages: 5,
  },
  free: {
    search_papers: 20,
    translate_abstracts: 20,
    validate_idea: 5,
    generate_outline: 5,
    draft_manuscript: 3,
    check_citations: 5,
    ai_detect: 5,
    plagiarism: 5,
    peer_review: 5,
    extract_refs: 10,
    translate_fulltext: 3,
    polish_prose: 3,
    workspace_messages: 20,
  },
  pro: {
    // Effectively unlimited — high ceiling to prevent extreme abuse
    search_papers: 9999,
    translate_abstracts: 9999,
    validate_idea: 9999,
    generate_outline: 9999,
    draft_manuscript: 9999,
    check_citations: 9999,
    ai_detect: 9999,
    plagiarism: 9999,
    peer_review: 9999,
    extract_refs: 9999,
    translate_fulltext: 9999,
    polish_prose: 9999,
    workspace_messages: 9999,
  }
};
