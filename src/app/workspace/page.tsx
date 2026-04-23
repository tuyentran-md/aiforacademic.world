"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createParser } from "eventsource-parser";
import { Icons } from "@/components/Icons";
import { useAuth } from "@/lib/firebase/auth";
import { apiFetch } from "@/lib/api-client";
import {
  createProject,
  getUserProjects,
  saveArtifact,
  saveMessage,
  getProjectArtifacts,
  getProjectMessages,
  type ProjectData,
} from "@/lib/firebase/projects";

// ── Types ──────────────────────────────────────────────────────────────────

type ArtifactType =
  | "paper_cards" | "manuscript" | "citation_report" | "ai_detect_score"
  | "plagiarism_scan" | "peer_review" | "feasibility" | "outline" | "translation";

interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  payload: unknown;
  createdAt: number;
  pinned?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  artifactId?: string;
  isStreaming?: boolean;
}

// ── 11 workspace functions ─────────────────────────────────────────────────
const WORKSPACE_FUNCTIONS: { name: string; desc: string; phase: number; icon: React.ReactNode; requiresFile?: boolean }[] = [
  { name: "search_papers",   desc: "Search PubMed + OpenAlex",                   phase: 1, icon: <Icons.Search className="w-3.5 h-3.5" /> },
  { name: "fetch_fulltext",  desc: "Fetch open-access full-text PDFs for DOIs",  phase: 1, icon: <Icons.FileText className="w-3.5 h-3.5" /> },
  { name: "translate_doc",   desc: "Translate a PDF/DOCX to Vietnamese",          phase: 1, icon: <Icons.Globe className="w-3.5 h-3.5" />, requiresFile: true },
  { name: "validate_idea",   desc: "Critique idea (novelty, feasibility)",        phase: 2, icon: <Icons.Lightbulb className="w-3.5 h-3.5" /> },
  { name: "generate_outline",desc: "Generate PICO + protocol outline",            phase: 2, icon: <Icons.ClipboardList className="w-3.5 h-3.5" /> },
  { name: "draft_manuscript",desc: "Draft manuscript from refs + outline",        phase: 2, icon: <Icons.Edit className="w-3.5 h-3.5" /> },
  { name: "check_citations", desc: "Verify citations vs CrossRef + OpenAlex",    phase: 3, icon: <Icons.BookOpen className="w-3.5 h-3.5" /> },
  { name: "detect_ai_writing",desc:"Detect AI-generated writing (score 0–100)",  phase: 3, icon: <Icons.Cpu className="w-3.5 h-3.5" /> },
  { name: "scan_plagiarism", desc: "Plagiarism scan (citation-aware)",            phase: 3, icon: <Icons.Scan className="w-3.5 h-3.5" /> },
  { name: "peer_review",     desc: "Editor-style peer review simulation",         phase: 3, icon: <Icons.ClipboardList className="w-3.5 h-3.5" /> },
  { name: "polish_prose",    desc: "Polish prose (preserve citations + stats)",   phase: 3, icon: <Icons.Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
];

// ── Artifact Renderer ──────────────────────────────────────────────────────
function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  const p = artifact.payload as Record<string, unknown>;
  switch (artifact.type) {
    case "paper_cards": {
      const refs = (p.refs as unknown[]) ?? [];
      return (
        <div className="space-y-3">
          {refs.map((ref: unknown, i) => {
            const r = ref as Record<string, unknown>;
            return (
              <div key={i} className="rounded-lg border border-black/[0.07] bg-white/60 p-4">
                <a href={r.url as string} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-stone-900 hover:text-[#C4634E] line-clamp-2">{r.title as string}</a>
                <p className="text-xs text-stone-400 mt-1">
                  {(r.authors as string[])?.slice(0, 2).join(", ")} · {r.journal as string} · {r.year as number}
                </p>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{r.abstract as string}</p>
              </div>
            );
          })}
        </div>
      );
    }
    case "manuscript":
    case "outline":
      return <pre className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed font-sans">{(p.text ?? p.outline) as string ?? ""}</pre>;
    case "feasibility": {
      const scores = [
        { label: "Novelty", d: p.novelty as Record<string, unknown> },
        { label: "Feasibility", d: p.feasibility as Record<string, unknown> },
        { label: "Publishability", d: p.publishability as Record<string, unknown> },
      ];
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {scores.map((s) => (
              <div key={s.label} className="rounded-lg border border-black/[0.07] bg-white/60 p-3 text-center">
                <p className="text-xl font-bold text-stone-900">{s.d?.score as number}/10</p>
                <p className="text-xs font-semibold text-stone-500">{s.label}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{s.d?.comment as string}</p>
              </div>
            ))}
          </div>
          {Array.isArray(p.redFlags) && (p.redFlags as string[]).length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Red flags</p>
              {(p.redFlags as string[]).map((f, i) => <p key={i} className="text-sm text-amber-700">• {f}</p>)}
            </div>
          )}
          <div className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
            <p className="text-sm text-stone-700">{p.recommendation as string}</p>
          </div>
        </div>
      );
    }
    case "citation_report":
      return (
        <div className="flex gap-6 text-center">
          <div><p className="text-2xl font-bold text-stone-900">{p.total as number}</p><p className="text-xs text-stone-500">Total</p></div>
          <div><p className="text-2xl font-bold text-green-600">{p.verified as number}</p><p className="text-xs text-stone-500">Verified</p></div>
          <div><p className="text-2xl font-bold text-red-600">{p.unverified as number}</p><p className="text-xs text-stone-500">Unverified</p></div>
        </div>
      );
    case "ai_detect_score":
      return (
        <div className="text-center">
          <p className="text-5xl font-bold text-stone-900">{p.score as number}</p>
          <p className="text-sm text-stone-400 mb-2">AI score (0=human · 100=AI)</p>
          <p className={`text-xl font-bold ${p.verdict === "Human" ? "text-green-600" : p.verdict === "AI" ? "text-red-600" : "text-amber-600"}`}>{p.verdict as string}</p>
          <p className="text-sm text-stone-600 mt-2">{p.summary as string}</p>
        </div>
      );
    case "peer_review": {
      const sections = (p.sections as Array<{ heading: string; comments: string[] }>) ?? [];
      return (
        <div className="space-y-3">
          <p className="text-sm text-stone-700">{p.summary as string}</p>
          {sections.map((s, i) => (
            <div key={i} className="rounded-lg border border-black/[0.07] bg-white/60 p-3">
              <p className="text-xs font-semibold text-stone-500 mb-1">{s.heading}</p>
              {s.comments.map((c, j) => <p key={j} className="text-sm text-stone-700">• {c}</p>)}
            </div>
          ))}
          <p className="text-sm font-semibold text-stone-900">Recommendation: {p.recommendation as string}</p>
        </div>
      );
    }
    default:
      return <pre className="text-xs text-stone-500 overflow-auto">{JSON.stringify(p, null, 2)}</pre>;
  }
}

// ── Tool executor ─────────────────────────────────────────────────────────
async function executeToolCall(name: string, args: Record<string, unknown>): Promise<{ artifact: Artifact; summary: string }> {
  const id = `artifact-${Date.now()}`;
  switch (name) {
    case "search_papers": {
      const results: unknown[] = [];
      const res = await apiFetch("/api/pipeline/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: args.q ?? args.query, language: "EN", maxResults: 10 }),
      });
      if (res.ok && res.body) {
        const parser = createParser({ onEvent(ev) {
          if (!ev.data) return;
          const e = JSON.parse(ev.data);
          if (e.type === "reference") results.push(e.data);
        }});
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }
      }
      return { artifact: { id, type: "paper_cards", title: `Search: ${args.q ?? args.query}`, payload: { refs: results }, createdAt: Date.now() }, summary: `Found ${results.length} papers.` };
    }
    case "validate_idea": {
      const res = await apiFetch("/api/pipeline/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
      const data = await res.json();
      return { artifact: { id, type: "feasibility", title: "Idea Validation", payload: data, createdAt: Date.now() }, summary: `Novelty ${data.novelty?.score}/10 · Feasibility ${data.feasibility?.score}/10` };
    }
    case "generate_outline": {
      const res = await apiFetch("/api/pipeline/outline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
      const data = await res.json();
      return { artifact: { id, type: "outline", title: `Outline: ${args.topic}`, payload: data, createdAt: Date.now() }, summary: "Outline generated." };
    }
    case "check_citations": {
      const res = await apiFetch("/api/pipeline/ric/citations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manuscript: args.ms ?? args.manuscript }) });
      const data = await res.json();
      return { artifact: { id, type: "citation_report", title: "Citation Check", payload: data, createdAt: Date.now() }, summary: `${data.verified}/${data.total} refs verified.` };
    }
    case "detect_ai_writing": {
      const res = await apiFetch("/api/pipeline/ric/ai-detect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manuscript: args.ms ?? args.manuscript }) });
      const data = await res.json();
      return { artifact: { id, type: "ai_detect_score", title: "AI Writing Score", payload: data, createdAt: Date.now() }, summary: `Score: ${data.score}/100 (${data.verdict})` };
    }
    case "peer_review": {
      const res = await apiFetch("/api/pipeline/ric/peer-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manuscript: args.ms ?? args.manuscript }) });
      const data = await res.json();
      return { artifact: { id, type: "peer_review", title: "Peer Review", payload: data, createdAt: Date.now() }, summary: `Recommendation: ${data.recommendation}` };
    }
    default:
      return { artifact: { id, type: "manuscript", title: `${name} result`, payload: { text: `Tool ${name}: ${JSON.stringify(args)}` }, createdAt: Date.now() }, summary: `${name} completed.` };
  }
}

function parseToolCall(text: string): { name: string; args: Record<string, unknown> } | null {
  const match = text.match(/\[CALL:([a-z_]+):(\{[^}]*\})\]/);
  if (!match) return null;
  try { return { name: match[1], args: JSON.parse(match[2]) }; }
  catch { return { name: match[1], args: {} }; }
}

// ── System prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AFA — an AI research mentor built on Google Gemini, powering the AI for Academic platform. You help Vietnamese clinical researchers (doctors, surgeons) with their manuscripts.

You have 11 research tools. Call them with [CALL:tool_name:{"param":"value"}].
ALWAYS explain what you're doing before calling a tool. ASK before heavy operations.

Tools: ${WORKSPACE_FUNCTIONS.map((f) => `${f.name}: ${f.desc}`).join(" | ")}

Rules:
1. ASK before draft_manuscript (article type? word count? target journal?)
2. ASK before translate_doc (language? document name?)
3. Never chain 2+ heavy tools without confirmation
4. Reference past artifacts as [📄 name]
5. Respond in Vietnamese by default unless user writes English
6. After each tool: summarize results + suggest next step concisely`;

// ── Project Sidebar ────────────────────────────────────────────────────────
interface ProjectSidebarProps {
  projects: ProjectData[];
  activeProjectId: string | null;
  onSelect: (projectId: string) => void;
  onNew: () => void;
  isLoading: boolean;
}

function ProjectSidebar({ projects, activeProjectId, onSelect, onNew, isLoading }: ProjectSidebarProps) {
  return (
    <div className="flex flex-col h-full no-grid" style={{ backgroundColor: "#F0EDE8" }}>
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-black/[0.06]">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Projects</p>
        <button
          onClick={onNew}
          className="text-xs font-semibold text-[#C4634E] hover:opacity-70 transition-opacity"
          id="ws-new-project-btn"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-3 text-xs text-stone-400 animate-pulse">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-4 text-xs text-stone-400 leading-relaxed">
            No projects yet. Start a conversation and your work will be saved here.
          </div>
        ) : (
          <div className="py-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id!)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  activeProjectId === p.id
                    ? "bg-white/70 text-stone-900"
                    : "text-stone-600 hover:bg-white/50"
                }`}
                id={`ws-project-${p.id}`}
              >
                <p className="text-xs font-medium truncate">{p.title}</p>
                <p className="text-[10px] text-stone-400 truncate">{p.description ?? ""}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { user, loading: authLoading, signIn } = useAuth();

  // Project state
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Language toggle — must be declared before language-aware strings below
  const [outputLanguage, setOutputLanguage] = useState<"VI" | "EN">("VI");

  // Language-aware strings
  const t = {
    welcomeVI: "Chào mừng đến AFA Workspace.\n\nTôi có thể giúp bạn:\n**Phase 1** · Tìm tài liệu, dịch bài\n**Phase 2** · Validate idea, tạo outline, viết bản thảo\n**Phase 3** · Check citations, AI detect, peer review",
    welcomeEN: "Welcome to AFA Workspace.\n\nI can help you with:\n**Phase 1** · Find literature, translate documents\n**Phase 2** · Validate ideas, generate outlines, draft manuscripts\n**Phase 3** · Check citations, detect AI writing, peer review",
    suggestions: outputLanguage === "EN"
      ? ["Find papers on laparoscopic appendectomy", "Check my paper for AI writing", "Validate my research idea"]
      : ["Tìm tài liệu về viêm ruột thừa ở trẻ em", "Check bài của tôi", "Validate ý tưởng nghiên cứu"],
    placeholder: outputLanguage === "EN" ? "Ask a research question… (Enter to send)" : "Nhập câu hỏi nghiên cứu… (Enter gửi)",
    footerHint: outputLanguage === "EN" ? "⚙ browse tools · Shift+Enter for new line" : "⚙ duyệt tools · Shift+Enter xuống dòng",
    quickCards: outputLanguage === "EN"
      ? [
          { label: "Search papers", msg: "Find papers on laparoscopic appendectomy" },
          { label: "Validate idea", msg: "Validate my research idea" },
          { label: "Check paper", msg: "Check my paper for AI writing" },
        ]
      : [
          { label: "Tìm tài liệu", msg: "Tìm tài liệu về viêm ruột thừa ở trẻ em" },
          { label: "Validate idea", msg: "Validate ý tưởng nghiên cứu" },
          { label: "Check bài", msg: "Check bài của tôi" },
        ],
  };

  const getWelcomeMsg = (lang: "VI" | "EN") =>
    lang === "EN" ? t.welcomeEN : t.welcomeVI;

  // Chat + artifact state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: getWelcomeMsg("VI"),
    },
  ]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "artifacts">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [{ ...prev[0], text: getWelcomeMsg(outputLanguage) }];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputLanguage]);

  // Load projects when user signs in
  useEffect(() => {
    if (!user) { setProjects([]); return; }
    setProjectsLoading(true);
    getUserProjects(user.uid)
      .then((ps) => setProjects(ps))
      .catch(console.error)
      .finally(() => setProjectsLoading(false));
  }, [user]);

  // Load project history when switching projects
  async function loadProject(projectId: string) {
    setActiveProjectId(projectId);
    if (!user) return;
    const [msgs, arts] = await Promise.all([
      getProjectMessages(projectId),
      getProjectArtifacts(projectId),
    ]);
    if (msgs.length > 0) {
      setMessages(msgs.map((m) => ({ id: m.id ?? String(Date.now()), role: m.role, text: m.text, artifactId: m.artifactId })));
    }
    if (arts.length > 0) {
      setArtifacts(arts.map((a) => ({
        id: a.id ?? String(Date.now()),
        type: a.type,
        title: a.title,
        payload: a.payload,
        createdAt: Date.now(),
        pinned: a.pinned,
      })));
    }
  }

  async function createNewProject() {
    if (!user) { await signIn(); return; }
    const id = await createProject({
      userId: user.uid,
      title: `Project ${new Date().toLocaleDateString("vi-VN")}`,
      description: "New research project",
    });
    if (id) {
      const newP: ProjectData = { id, userId: user.uid, title: `Project ${new Date().toLocaleDateString("vi-VN")}` };
      setProjects((prev) => [newP, ...prev]);
      setActiveProjectId(id);
      setMessages([{
        id: "welcome",
        role: "assistant",
        text: getWelcomeMsg(outputLanguage),
      }]);
      setArtifacts([]);
      setActiveArtifactId(null);
    }
  }

  function createId() { return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) ?? artifacts[artifacts.length - 1] ?? null;

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    setInput("");
    setShowToolMenu(false);

    // Check if a file-required tool is mentioned but no file attached
    const mentionedTool = WORKSPACE_FUNCTIONS.find(f => f.requiresFile && content.includes("@" + f.name));
    if (mentionedTool && !uploadedFile) {
      setMessages(prev => [...prev, {
        id: createId(), role: "assistant",
        text: `Tool **@${mentionedTool.name}** cần file đính kèm. Vui lòng bấm 📎 để upload file trước khi gửi.`,
      }]);
      return;
    }

    const userMsgId = createId();
    const assistantId = createId();
    const userMsg: Message = { id: userMsgId, role: "user", text: content + (uploadedFile ? ` [📎 ${uploadedFile.name}]` : "") };
    const assistantMsg: Message = { id: assistantId, role: "assistant", text: "", isStreaming: true };
    setUploadedFile(null);

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    // Save to Firebase
    if (user && activeProjectId) {
      saveMessage({ projectId: activeProjectId, userId: user.uid, role: "user", text: content }).catch(() => {});
    }

    const history = [...messages.slice(-10), userMsg].map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.text }],
    }));

    try {
      const res = await apiFetch("/api/workspace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, systemPrompt: SYSTEM_PROMPT, outputLanguage }),
      });

      if (!res.ok || !res.body) throw new Error("Chat failed");

      let fullText = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: fullText } : m));
      }

      const toolCall = parseToolCall(fullText);
      if (toolCall) {
        const { artifact, summary } = await executeToolCall(toolCall.name, toolCall.args);
        setArtifacts((prev) => [...prev, artifact]);
        setActiveArtifactId(artifact.id);
        setMobilePanel("artifacts");

        const cleanText = fullText.replace(/\[CALL:[^\]]+\]/g, "").trim() + `\n\n📄 **${artifact.title}**: ${summary}`;
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: cleanText, isStreaming: false, artifactId: artifact.id } : m));

        if (user && activeProjectId) {
          saveArtifact({ projectId: activeProjectId, userId: user.uid, type: artifact.type, title: artifact.title, payload: artifact.payload }).catch(() => {});
          saveMessage({ projectId: activeProjectId, userId: user.uid, role: "assistant", text: cleanText, artifactId: artifact.id }).catch(() => {});
        }
      } else {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));
        if (user && activeProjectId) {
          saveMessage({ projectId: activeProjectId, userId: user.uid, role: "assistant", text: fullText }).catch(() => {});
        }
      }
    } catch (error) {
      const errText = `Lỗi: ${error instanceof Error ? error.message : "Unknown error"}`;
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: errText, isStreaming: false } : m));
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  }

  function insertFunction(name: string) {
    setInput((prev) => `${prev}@${name} `);
    setShowToolMenu(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-dvh md:h-[calc(100dvh-3.5rem)] w-full overflow-hidden" style={{ backgroundColor: "#FAF9F6" }}>

      {/* ── Project sidebar (desktop) ──────────────────────────────── */}
      <div className={`hidden md:flex flex-col border-r border-black/[0.06] transition-all duration-200 ${showSidebar ? "w-56" : "w-0 overflow-hidden"}`}>
        {showSidebar && (
          <ProjectSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={loadProject}
            onNew={createNewProject}
            isLoading={projectsLoading}
          />
        )}
      </div>

      {/* ── Mobile tab bar ─────────────────────────────────────────── */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex border-b border-black/[0.07] no-grid" style={{ backgroundColor: "#F5F1EA" }}>
        {(["chat", "artifacts"] as const).map((tab) => (
          <button key={tab} onClick={() => setMobilePanel(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mobilePanel === tab ? "text-stone-900 border-b-2 border-[#C4634E]" : "text-stone-400"}`}>
            {tab === "chat" ? "💬 Chat" : `🗂 Artifacts${artifacts.length > 0 ? ` (${artifacts.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── Chat panel ────────────────────────────────────────────── */}
      <div className={`flex flex-col bg-white border-r border-black/[0.07] w-full md:w-[42%] md:max-w-[480px] md:flex-shrink-0 ${mobilePanel === "chat" ? "flex pt-10 md:pt-0" : "hidden md:flex"}`}>

        {/* Chat header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-black/[0.06] flex items-center gap-3">
          {/* Sidebar toggle */}
          <button onClick={() => setShowSidebar(!showSidebar)} className="hidden md:flex flex-shrink-0 text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors" title="Toggle projects">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: "#C4634E" }}>A</div>
            <div className="min-w-0">
              <p className="font-semibold text-stone-900 text-sm truncate">AFA Workspace</p>
              <p className="text-[10px] text-stone-400">11 tools active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Auth */}
            {!authLoading && !user && (
              <button onClick={signIn} className="text-xs font-medium text-[#C4634E] hover:opacity-70 transition-opacity" id="ws-signin-btn">Sign in</button>
            )}
            {user && (
              <button onClick={createNewProject} className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors border border-black/10 rounded-full px-2.5 py-1" id="ws-new-btn">+ Project</button>
            )}
            {user && (
              <a href="/account/billing" className="text-xs font-semibold text-white rounded-full px-2.5 py-1 transition-opacity hover:opacity-90" style={{ backgroundColor: "#C4634E" }}>Upgrade</a>
            )}
            {/* Language */}
            <div className="inline-flex rounded-full border border-black/10 bg-stone-100 p-0.5 text-[11px] font-medium">
              {(["VI", "EN"] as const).map((lang) => (
                <button key={lang} onClick={() => setOutputLanguage(lang)}
                  className={`rounded-full px-2.5 py-1 transition-all ${outputLanguage === lang ? "bg-stone-900 text-white shadow-sm" : "text-stone-500"}`}>
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-800"
              }`}>
                {msg.text.split("\n").map((line, i) => {
                  // Render **bold** inline
                  const parts = line.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <span key={i}>
                      {parts.map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : <span key={j}>{part}</span>
                      )}
                      {i < msg.text.split("\n").length - 1 && <br />}
                    </span>
                  );
                })}
                {msg.isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-stone-400 animate-pulse rounded-sm" />}
                {msg.artifactId && (
                  <button onClick={() => { setActiveArtifactId(msg.artifactId!); setMobilePanel("artifacts"); }}
                    className="mt-2 block text-xs font-medium text-[#C4634E] hover:underline">
                    → View artifact
                  </button>
                )}
              </div>
            </div>

          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 flex flex-wrap gap-2">
            {t.suggestions.map((s) => (
              <button key={s} onClick={() => void sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors">{s}</button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-black/[0.06]">
          <div className="relative flex items-end gap-2">
            <div className="relative">
              <button onClick={() => setShowToolMenu(!showToolMenu)}
                className="flex-shrink-0 rounded-lg px-2.5 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                id="workspace-tools-btn" title="Browse tools">⚙</button>
              {showToolMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-black/[0.08] bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-black/[0.06]">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">11 Tools</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[1, 2, 3].map((phase) => (
                      <div key={phase}>
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 bg-stone-50">Phase {phase}</p>
                        {WORKSPACE_FUNCTIONS.filter((f) => f.phase === phase).map((f) => (
                          <button key={f.name} onClick={() => insertFunction(f.name)}
                            className="w-full text-left px-3 py-2 hover:bg-stone-50 transition-colors flex items-start gap-2"
                            id={`tool-menu-${f.name}`}>
                            <span>{f.icon}</span>
                            <div>
                              <p className="text-xs font-medium text-stone-800">{f.name}</p>
                              <p className="text-[11px] text-stone-400 leading-tight">{f.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* File upload button — shown when translate_doc tool detected */}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
              onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileInputRef.current?.click()}
              className={`flex-shrink-0 rounded-lg px-2.5 py-2 transition-colors ${uploadedFile ? "text-[#C4634E] bg-red-50" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"}`}
              title={uploadedFile ? `File: ${uploadedFile.name}` : "Upload file"}>
              {uploadedFile ? "📎" : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>}
            </button>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t.placeholder} rows={1}
              className="flex-1 resize-none rounded-xl border border-black/10 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              style={{ maxHeight: "120px" }} id="workspace-input" />

            <button onClick={() => void sendMessage()} disabled={isLoading || !input.trim()}
              className="flex-shrink-0 rounded-xl px-3.5 py-2.5 text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C4634E" }} id="workspace-send-btn">
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-stone-400 text-center">{t.footerHint}</p>
        </div>
      </div>

      {/* ── Artifact panel ────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobilePanel === "artifacts" ? "flex pt-10 md:pt-0" : "hidden md:flex"}`}>

        {/* Artifact tabs */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-black/[0.06] no-grid" style={{ backgroundColor: "#FAF9F6" }}>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex-shrink-0">
              Artifacts {artifacts.length > 0 ? `(${artifacts.length})` : ""}
            </p>
            <div className="flex gap-1 flex-shrink-0">
              {artifacts.slice(-6).map((a) => (
                <button key={a.id} onClick={() => setActiveArtifactId(a.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                    activeArtifact?.id === a.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}>
                  {a.title.length > 18 ? a.title.slice(0, 18) + "…" : a.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Artifact content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeArtifact ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-serif font-bold text-stone-900">{activeArtifact.title}</p>
                  <p className="text-xs text-stone-400">{new Date(activeArtifact.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(JSON.stringify(activeArtifact.payload, null, 2)).catch(() => {})}
                    className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 rounded border border-black/10 transition-colors">Copy</button>
                  {activeArtifact.type === "peer_review" && (
                    <button onClick={() => { sessionStorage.setItem("afa_polish_peer_review", JSON.stringify(activeArtifact.payload)); window.location.href = "/tools/polish"; }}
                      className="text-xs font-semibold text-white px-3 py-1 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: "#8B5CF6" }}>
                      Polish →
                    </button>
                  )}
                  {activeArtifact.type === "citation_report" && (
                    <Link href="/tools/paper-checker?tab=citations"
                      className="text-xs font-semibold text-stone-600 px-3 py-1 rounded-full border border-black/10 hover:border-stone-300 transition-colors">
                      Full report →
                    </Link>
                  )}
                </div>
              </div>
              <ArtifactRenderer artifact={activeArtifact} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 text-stone-300">
                <Icons.FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-stone-900 mb-1">No artifacts yet</p>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                Ask AFA to search papers, validate your idea, or check citations — results appear here.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                {t.quickCards.map((item) => (
                  <button key={item.label} onClick={() => { setInput(item.msg); setMobilePanel("chat"); setTimeout(() => inputRef.current?.focus(), 100); }}
                    className="rounded-xl border border-black/[0.07] bg-white p-3 text-center hover:border-stone-300 transition-colors"
                    id={`quick-${item.label.replace(/\s/g, "-")}`}>
                    <p className="text-[11px] text-stone-600 font-medium">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
