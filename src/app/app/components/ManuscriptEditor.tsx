"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Blueprint, Reference } from "@/lib/pipeline/types";
import { linkifyReferenceCitations } from "./pipeline-utils";

interface ManuscriptEditorProps {
  manuscript: string;
  blueprint: Blueprint | null;
  references: Reference[];
  isStreaming: boolean;
  onChange: (value: string) => void;
  onContinue: () => Promise<void>;
}

export function ManuscriptEditor({
  manuscript,
  blueprint,
  references,
  isStreaming,
  onChange,
  onContinue,
}: ManuscriptEditorProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [activeReferenceId, setActiveReferenceId] = useState<string | null>(null);

  useEffect(() => {
    if (isStreaming) {
      setMode("preview");
    }
  }, [isStreaming]);

  const referenceMap = new Map(references.map((reference) => [reference.id, reference]));
  const activeReference = activeReferenceId ? referenceMap.get(activeReferenceId) || null : null;
  const previewMarkdown = linkifyReferenceCitations(manuscript);

  return (
    <div className="rounded-[32px] border border-black/8 bg-white/88 p-5 shadow-[0_18px_40px_rgba(17,17,16,0.05)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            Step 2 workspace
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-stone-900">
            Build the first draft {blueprint ? `· ${blueprint.articleType.replaceAll("_", " ")}` : ""}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            This is where the selected studies become a manuscript scaffold. You can preview the
            generated text, switch to edit mode, and then send the draft to the integrity audit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {blueprint?.sections.map((section) => (
              <span
                key={section.heading}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
              >
                {section.heading}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isStreaming ? (
            <div className="inline-flex rounded-full border border-black/10 bg-stone-100 p-1 text-xs font-medium text-stone-600">
              {(["preview", "edit"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={`rounded-full px-3 py-1 transition ${
                    mode === option ? "bg-white text-stone-900 shadow-sm" : "opacity-70"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void onContinue()}
            disabled={isStreaming || !manuscript.trim()}
            className="inline-flex items-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Audit this draft
          </button>
        </div>
      </div>

      {activeReference ? (
        <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
                {activeReference.id}
              </p>
              <h3 className="mt-1 font-semibold">{activeReference.title}</h3>
              <p className="mt-2 text-violet-800/80">
                {(activeReference.abstractTranslated || activeReference.abstract || "").slice(0, 260)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveReferenceId(null)}
              className="rounded-full border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {isStreaming || mode === "preview" ? (
        <div className="prose prose-stone max-w-none rounded-[28px] bg-stone-50 px-5 py-6 prose-headings:font-serif prose-headings:text-stone-900 prose-p:text-stone-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith("#ref-")) {
                  const referenceId = href.slice(1);
                  return (
                    <button
                      type="button"
                      onClick={() => setActiveReferenceId(referenceId)}
                      className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800"
                    >
                      {children}
                    </button>
                  );
                }

                return (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {previewMarkdown ||
              "Your manuscript scaffold will appear here once Step 2 starts. After that, you can edit it or send it straight to the audit step."}
          </ReactMarkdown>
          {isStreaming ? <div className="mt-4 h-6 w-1 animate-pulse rounded-full bg-violet-500" /> : null}
        </div>
      ) : (
        <textarea
          value={manuscript}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[560px] w-full resize-y rounded-[28px] border border-black/10 bg-stone-50 px-5 py-6 font-mono text-sm leading-7 text-stone-800 outline-none transition focus:border-stone-300"
        />
      )}
    </div>
  );
}
