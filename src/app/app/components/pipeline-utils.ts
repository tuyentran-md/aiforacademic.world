import { parseManuscriptSections as parseSharedSections } from "@/lib/pipeline/manuscript";
import type { IntegrityFlag } from "@/lib/pipeline/types";

export interface ManuscriptSectionView {
  heading: string;
  paragraphs: string[];
}

export function parseManuscriptSections(markdown: string): ManuscriptSectionView[] {
  return parseSharedSections(markdown).map((section) => ({
    heading: section.heading,
    paragraphs: section.paragraphs,
  }));
}

export function linkifyReferenceCitations(markdown: string): string {
  return markdown.replace(/\[(ref-\d{3})\]/gi, "[$1](#$1)");
}

export function severityRank(severity: IntegrityFlag["severity"]): number {
  if (severity === "error") {
    return 3;
  }
  if (severity === "warning") {
    return 2;
  }
  return 1;
}

export function getParagraphSeverity(flags: IntegrityFlag[]): IntegrityFlag["severity"] | null {
  if (flags.length === 0) {
    return null;
  }

  return [...flags].sort((left, right) => severityRank(right.severity) - severityRank(left.severity))[0]
    .severity;
}
