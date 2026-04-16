---
title: "Where AI Actually Fits in My Research Workflow"
date: "2026-03-09T15:04:16"
excerpt: "A practical map of where AI tools actually help in academic research — from literature exploration to revision — and where they should never replace scientific thinking."
category: "AI Tools"
slug: "how-ai-actually-fits-in-research"
---

There is a common pattern in how researchers first adopt AI. This note will show how AI actually fits in research through my own experiences.





Someone discovers ChatGPT, uses it for everything for two weeks, becomes frustrated by hallucinated references, and then either abandons it entirely or keeps using it uncritically.





Neither outcome is useful.





The more productive approach is less exciting. It means identifying exactly where AI tools help, where they introduce risk, and where they add no value at all. That requires understanding your own workflow well enough to locate the bottlenecks—and then testing whether a tool actually solves that bottleneck without creating new problems.





This article is not a tool review.
It is a map of where different tools fit in the research workflow I actually use, why they are there, and what I tried that did not work.










# The Workflow Before AI





Research writing is not a single activity.
It is a sequence of distinct cognitive tasks, each with different demands:





Exploring the landscape
Understanding what has been done, what is debated, and where the gaps are.





Forming an argument
Deciding what your study actually claims and why it matters.





Analyzing data
Running statistics, generating outputs, and checking assumptions.





Drafting
Translating your thinking into structured prose.





Understanding how AI actually fits in research is crucial for improving efficiency and enhancing outcomes.





Revising
Improving clarity, tightening logic, removing what does not support the argument.





Finalizing
Formatting, reference management, journal compliance, and submission.





Each stage has its own failure modes.
The mistake many researchers make with AI is applying the same tool to every stage—or using a tool where it actively harms the work.










# Stage 1: Exploring the Landscape





This is where I use Perplexity most heavily.





The traditional approach to literature exploration cycles between PubMed, Google Scholar, and reference lists. It works, but it is slow and tends to favor depth over breadth—you mostly find what you already know to look for.





Perplexity is useful because it produces synthesized overviews with cited sources. When I begin exploring a new topic, I use it to generate an initial map: who is publishing in this space, what methodologies dominate, and what questions remain unresolved.





What Perplexity does not do well is evaluate source quality. It presents information with equal confidence whether the underlying paper is a large randomized trial or a case report.





That filtering remains the researcher&#8217;s responsibility.





I treat Perplexity outputs as a starting bibliography, not a literature review. Every source must still be verified independently before entering a manuscript.










# Stage 1.5: Reading and Understanding Papers





After identifying key papers, I often use SciSpace to help read them—especially when the statistical methods are complex.





SciSpace allows you to upload a PDF and ask questions about it directly. When I encounter unfamiliar analytical techniques or dense results sections, it helps me build a working understanding faster than reading the paper linearly.





The constraint is important:





SciSpace is a reading aid, not a reading replacement.





I use it only after I have already decided a paper is relevant. Determining relevance requires enough manual reading to judge the study&#8217;s scope and quality—something I cannot delegate.





In practice, the workflow looks like this:






Screen titles and abstracts manually



Retrieve full texts of candidate papers



Use SciSpace for technically dense sections



Read the rest conventionally




The tool accelerates comprehension without removing the researcher from the evaluation process.










# Stage 2: Forming an Argument





This is where Claude becomes most useful—and also where the risk is highest.





The hardest part of academic writing is not producing text.
It is deciding what the paper is actually arguing.





This means evaluating competing interpretations of your findings, deciding which claim is defensible, and understanding how your results fit into the existing literature.





I use Claude as a thinking partner, not a generator.





A typical interaction looks like this:






I describe my findings and my interpretation.



I ask Claude to identify the three strongest counterarguments.



I then test whether my data actually addresses those objections.




This process is useful because it simulates the peer review process. Reviewers are trained to locate the weakest point in an argument. If that weakness appears before submission, it can be fixed before it becomes a revision request.





What I do not do is ask the model to generate the argument itself.





If you ask an LLM to “write a discussion section based on these results,” the result will usually sound coherent but lack intellectual commitment. The claims are generic, the interpretation cautious, and the discussion indistinguishable from dozens of others in the field.





That is not what gets papers accepted.





What gets papers accepted is a specific, defensible interpretation that the author clearly owns.










# Claude vs ChatGPT for Analytical Work





I have used both.





For sustained analytical dialogue—reasoning through study design, methodological trade-offs, or competing interpretations—Claude tends to maintain context more coherently across longer conversations.





ChatGPT works well for shorter, transactional queries.





The difference becomes noticeable when the conversation builds across multiple steps. For argument development, I prefer Claude. For quick questions, either works.










# Stage 3: Analyzing Data





This is where AI has the smallest role in my workflow.





All statistical analysis is performed in R, using scripted and version-controlled pipelines. This is essential for reproducibility. When results are questioned—and they eventually will be—you must be able to rerun the entire analysis and justify every decision.





I occasionally use Claude to troubleshoot R code. It is particularly helpful for unfamiliar error messages or edge cases in functions I have not used before.





What I do not do is ask AI tools to choose statistical methods or interpret results.





Deciding which test to run, which covariates to include, or how to handle missing data is a methodological judgment that belongs to the researcher.





A useful test is simple:





If a reviewer asks “Why did you use method X instead of method Y?” and your honest answer is “Because the AI suggested it,” then the analysis is not really yours.










# Stage 4: Drafting





Drafting remains almost entirely manual.





Many researchers hope AI can help most with writing because writing is slow. Language models can certainly produce fluent academic prose.





The problem is that drafting is not primarily a language task.





It is a thinking task.





Writing a paragraph forces you to confront whether you truly understand the relationship between your claim and the evidence supporting it. When a model writes that paragraph for you, that confrontation disappears.





I have reviewed manuscripts where entire sections were clearly AI-generated. They are recognizable not because of the language—often polished—but because of the reasoning.





The sentences connect. The argument does not.





The writing performs thinking rather than doing it.





For this reason, I write my own drafts. It is slower, but it ensures the paper actually says what I mean.










# Stage 5: Revising





Once a draft exists, AI becomes useful again.





I use Claude for several bounded revision tasks:





Identifying logical gaps





I paste a section and ask:
“What is the weakest logical step in this argument?”





Checking paragraph structure





I ask whether each paragraph has a clear topic sentence and whether the overall progression is coherent.





Simulating reviewer reactions





I ask Claude to review the section as if it were a reviewer for the target journal.





The specific comments are not always correct, but the pattern of concerns is often informative.





What I avoid is having the model rewrite the text. If a paragraph is weak, I need to understand why and revise it myself.










# Stage 6: Finalizing





This stage is mostly mechanical.





References are managed in Zotero, integrated with Word. Formatting follows the target journal’s guidelines. Figures and tables are prepared for submission.





I write the final manuscript in Word simply because that is what journals accept. I experimented with Markdown workflows, but the conversion overhead outweighed the benefits.





For the final pass, I run Grammarly to catch typos and inconsistencies. It does not improve the argument—it simply polishes the surface.










# What I Tried and Removed





Several AI workflows did not survive long-term use.





I experimented with AI-assisted abstract screening for systematic reviews. The accuracy was acceptable, but the problem was auditability. Journals increasingly require transparent documentation of screening decisions. Without that documentation, AI screening becomes difficult to justify.





I also tried AI-based reference formatting. Citation styles are inconsistent across journals, and models frequently introduce subtle errors. Zotero remains more reliable.





Several tools promise to “automatically find all relevant papers.” These are useful for scoping but do not meet PRISMA documentation requirements. For systematic searches, databases like PubMed and Embase remain necessary.










# The Cyborg Workflow





In practice, the pattern looks like this:





StageTaskToolRoleExploreTopic mappingPerplexitySynthesizes landscapeReadPaper comprehensionSciSpaceExplains complex methodsArgueStress-testing ideasClaudeFinds weaknessesAnalyzeCode troubleshootingClaudeDebugs R/PythonDraftWritingYouCore intellectual workReviseLogic checkingClaudeStructural feedbackFinalizeLanguage polishGrammarlySurface editingFinalizeReferencesZoteroCitation management



The pattern is consistent:





AI supports evaluation tasks.
Creation tasks remain with the researcher.





This is not a limitation—it is the design.










# The Real Question About AI in Research





The important question is not:





Which AI tool is best?





The real question is:





At which point in my workflow does this tool help me think better, and at which point does it replace my thinking?





If a tool improves your thinking, use it.





If it replaces your thinking, you will eventually encounter a reviewer whose question you cannot answer—because the reasoning was never yours.





Researchers who use AI effectively will not be the ones using the most tools.





They will be the ones who understand their own workflow well enough to know exactly where assistance ends and abdication begins.





And that distinction is worth revisiting every time a new AI tool appears.










## Tools mentioned in this workflow





Disclosure: Some links below are affiliate links. This means I may earn a small commission if you sign up or purchase — at no extra cost to you. I only recommend tools I actively use in my own research workflow.






Claude (Anthropic) — primary tool for argument development and revision feedback. No affiliate program available.
ChatGPT (OpenAI) — useful for shorter transactional queries. No affiliate program available.
[Grammarly affiliate link — add after registration] — final language polish. Free tier available; Premium adds style and clarity checks.
[SciSpace affiliate link — add after registration] — PDF reading and method clarification. Especially useful for dense statistics sections.
Zotero — free, open-source reference manager. No affiliate program; genuinely the best option.
[Trinka affiliate link — add after registration] — academic grammar checking built specifically for scientific writing.
Perplexity — initial literature landscape mapping. Check for affiliate program availability.




Note: I recommend only tools I actively use. Affiliate relationships do not influence which tools are included or how they are assessed.









    Checklist: Idea to Submission


    Stage-by-stage checklist from research idea to journal submission.


    
        Get the Checklist →
    
    $5



    Tool I use: SciSpace — AI-powered literature review and paper discovery.
