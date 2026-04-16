---
title: "My Zotero + AI Workflow"
date: "2026-03-27T07:26:57"
excerpt: "Extract metadata via Zotero plugins, and feed that structured data into Claude."
category: "AI Tools"
slug: "zotero-workflow-zotero-workflow-with-ai-automating"
---

Feeding papers to an AI and asking it to “synthesize the literature” isn’t a research workflow. It’s outsourcing the thinking. The problem isn’t the AI—it’s the input.

Most researchers provide AI with disorganized raw material: PDFs, copy-pasted abstracts, browser tabs of unread papers. The output mirrors the input. Vague summaries. Missed contradictions. Synthesis that reads like a paraphrase of whichever three papers happened to be most recent. Fixing the output requires re-doing the work anyway.

What changed my workflow wasn’t switching AI tools. It was treating Zotero as a structured database rather than a folder—and feeding that structure, not raw content, to Claude. The Zotero workflow shifts the intellectual work to where it belongs: the researcher classifies and annotates; AI reasons across what’s been classified.

## Setting Up a Zotero Workflow That AI Can Actually Use

The standard use of Zotero is storage: save PDF, cite when needed. That’s one layer of what it does.

The more useful layer is metadata. Every Zotero item carries structured fields: authors, year, journal, DOI, abstract, your annotations, your tags. When you export this metadata—not the raw papers, but the organized record—you give AI a substrate it can reason across rather than summarize in isolation.

Two plugins make this workflow functional:

**Better BibTeX** exports your library with full metadata and annotations in a format that travels cleanly into a prompt. For systematic reviews, it’s the standard. For most research writing, a plain CSV export from Zotero works fine and is easier to paste directly.

**Zotero PDF Reader (built-in since v6)** lets you highlight and annotate directly inside Zotero. Those annotations sync to the item record. When you export, they export with it—meaning your notes on each paper become part of the structured input you give AI.

No other setup is required. The workflow doesn’t depend on complex plugins. It depends on how you use the annotation fields.

## What to Capture Per Paper

Before AI enters the process, the Zotero record needs enough structure to be useful. That means going beyond saving the PDF.

For each paper, I add:

*   **A tag indicating its role in the manuscript**: `background`, `key_method`, `contradicts`, `supports_main`, `methodology_concern`, `limitation`
*   **A short annotation** (2–4 sentences): what the paper claims, what the sample is, and any concern about its validity
*   **Collection placement** that maps to the manuscript section it primarily informs

This takes roughly two to three minutes per paper. The payoff is that when I export a collection, the tags and annotations travel with the metadata. I’m not handing AI a pile of papers. I’m giving it a pre-organized map of the literature, built from my own judgments about what each paper means.

That distinction matters. AI is not doing the critical reading here. You are. AI is doing the pattern recognition across what you’ve already read and classified.

## The Export and Prompt Strategy

From Zotero, I export a collection as CSV. The output includes title, year, journal, abstract, my tags, and my annotations. I paste this directly into a Claude conversation.

The prompt I use varies by task, but the structure is consistent:

> “Here is a structured export from my reference manager. Each entry includes: title, year, journal, tags I assigned, and my annotation. Based on this, identify: (1) which papers are methodologically most similar to each other, (2) where the ‘contradicts’ papers disagree with the ‘supports\_main’ group and what might explain the difference, and (3) what the tag set suggests is missing or underrepresented.”

That prompt generates categorically different output compared to asking Claude to “summarize the literature.” You’re asking it to reason about relationships, not produce prose. The output is a structured map—not finished writing, but a scaffold that’s faster to edit than to generate from scratch.

[Where AI Actually Fits in My Research Workflow](/blog/how-ai-actually-fits-in-research) covers the broader logic: AI performs best when it augments structured thinking rather than replacing it. Zotero is where that structure gets built.

## What Claude Handles Well With This Input

With clean metadata and annotations, several tasks become genuinely useful:

**Grouping by methodology.** If you’ve tagged papers by design—`RCT`, `cohort`, `meta-analysis`, `cross-sectional`—Claude can cluster them and identify which claims depend on which study type. This becomes relevant when a reviewer asks whether your conclusions hold across designs.

**Surfacing contradictions.** The `contradicts` tag is a prompt signal. Ask Claude to compare the annotated abstracts from conflicting papers and explain the possible sources of disagreement—whether they’re sample differences, outcome definitions, follow-up periods, or analytical choices. This work normally happens in your head over several sessions. With structured input, it takes one prompt.

**Drafting a literature scaffold.** Not a finished literature review, but a structured summary of where the field agrees, where it diverges, and what appears to be missing. This feeds the framing of your Introduction or Discussion. Editing a scaffold is faster than generating one from memory at the start of a drafting session.

On the question of which AI to use for this: [Claude vs ChatGPT for Research Thinking](/blog/claude-vs-chatgpt-for-research-claude-35-vs-chatgpt-for) outlines the differences in more detail. For structured input tasks requiring consistent logic across many records, the behavioral differences become apparent when you run the same export through both.

## Where the Workflow Breaks

The limitation isn’t AI. It’s what wasn’t structured in Zotero to begin with.

The most common failure mode is using AI to generate search strings for a systematic review or meta-analysis. This sounds efficient. In practice, AI does not know your inclusion/exclusion criteria, your database-specific syntax requirements, or the conceptual distinctions that matter for your particular question. It generates plausible-looking strings with correct-looking Boolean operators—and frequently misses critical term variants or uses operators that specific databases do not support as expected.

This has caused real problems. In one meta-analysis, an AI-generated search string missed a MeSH heading variant that captured a distinct cluster of studies. The string looked complete. The results were incomplete. The gap only surfaced during peer review.

The principle I follow now: AI helps you reason about the logic of a search strategy, but a human constructs the final string, runs it in each database, and verifies the operator behavior against that database’s documentation. This is not optional if precision matters.

The same principle applies to automated tagging. AI can suggest tags based on abstracts, but it cannot replace your judgment about which papers are actually relevant to your argument.

## Iterating Across the Research Timeline

The workflow isn’t static. It evolves as the project develops, and the Zotero library evolves with it.

At the literature search stage, the export is large and loosely tagged. AI helps identify which clusters deserve closer reading and which appear methodologically redundant. This narrows the reading list before you invest time in full-text review.

At the manuscript drafting stage, the export is smaller and tightly annotated. AI helps map what you’ve read onto the sections you need to write. This is when the Discussion framing benefits most—you can ask Claude to identify which of your tagged papers speak to a specific interpretive claim you want to make, rather than rereading everything.

At the revision stage, after peer review, the Zotero library becomes an audit tool. If a reviewer asks whether you’ve accounted for a particular methodological concern, you can query the library for papers tagged `methodology_concern`, check your annotations, and determine whether the concern was already addressed or requires additional papers.

Each stage uses the same library, the same tags, the same structured export. The investment in annotation early in the project pays dividends multiple times.

## The Division of Labor That Makes This Work

The Zotero + AI workflow is not a shortcut. It’s a reallocation.

You do the critical reading: you decide which papers matter, why they’re tagged the way they are, and what concerns you have about each one. AI handles the synthesis of what you’ve already decided.

Researchers who get the most from this workflow are the ones who maintain Zotero as a research activity rather than administrative overhead. The annotations and tags added during reading become the structured prompts used weeks later during drafting. The quality of that input determines the quality of the output.

If the goal is to skip the reading, this workflow will not help. If the goal is to reason more systematically across a literature you’ve already engaged with, it changes how fast and how clearly you can draft.



#### 🛠 Tools mentioned in this article

_Note: We only recommend tools we actively use in real research workflows._

*   [Zotero](https://www.zotero.org)
*   [Claude](https://claude.ai)

**Checklist: Idea to Submission**

Stage-by-stage checklist from research idea to journal submission.

 $5
