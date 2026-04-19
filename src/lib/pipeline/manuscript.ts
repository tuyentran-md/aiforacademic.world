export interface ParsedManuscriptSection {
  heading: string;
  content: string;
  paragraphs: string[];
}

function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function stripDocumentTitle(markdown: string): string {
  return markdown.replace(/^\s*#\s+.*(?:\n+|$)/, "").trim();
}

export function parseManuscriptSections(markdown: string): ParsedManuscriptSection[] {
  const body = stripDocumentTitle(markdown);
  if (!body) {
    return [];
  }

  const chunks = body
    .split(/^##\s+/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return [
      {
        heading: "Manuscript",
        content: body,
        paragraphs: splitParagraphs(body),
      },
    ];
  }

  return chunks.map((chunk) => {
    const [heading, ...rest] = chunk.split("\n");
    const content = rest.join("\n").trim();

    return {
      heading: heading.trim(),
      content,
      paragraphs: splitParagraphs(content),
    };
  });
}
