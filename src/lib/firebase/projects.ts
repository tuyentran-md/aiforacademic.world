/**
 * Firestore CRUD for projects, messages, and artifacts.
 * All functions are no-ops if db is not configured (guest mode).
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────

export type ArtifactType =
  | "paper_cards"
  | "manuscript"
  | "citation_report"
  | "ai_detect_score"
  | "plagiarism_scan"
  | "peer_review"
  | "feasibility"
  | "outline"
  | "translation"
  | "fetch_result"
  | "polish_diff";

export interface ProjectData {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  phase?: 1 | 2 | 3;
  tags?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ArtifactData {
  id?: string;
  projectId: string;
  userId: string;
  type: ArtifactType;
  title: string;
  payload: unknown;
  payloadRef?: string; // Firebase Storage path if payload > 800KB
  createdAt?: unknown;
  pinned?: boolean;
}

export interface MessageData {
  id?: string;
  projectId: string;
  userId: string;
  role: "user" | "assistant";
  text: string;
  artifactId?: string;
  createdAt?: unknown;
}

// ── Projects ──────────────────────────────────────────────────────────────

export async function createProject(
  project: Omit<ProjectData, "id" | "createdAt" | "updatedAt">
): Promise<string | null> {
  if (!db) return null;
  try {
    const ref = await addDoc(collection(db, "projects"), {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[firebase/projects] createProject error:", err);
    return null;
  }
}

export async function getUserProjects(userId: string): Promise<ProjectData[]> {
  if (!db || !userId) return [];
  try {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectData));
  } catch (err) {
    console.error("[firebase/projects] getUserProjects error:", err);
    return [];
  }
}

export async function updateProject(
  projectId: string,
  data: Partial<Omit<ProjectData, "id" | "userId" | "createdAt">>
): Promise<void> {
  if (!db || !projectId) return;
  try {
    await updateDoc(doc(db, "projects", projectId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[firebase/projects] updateProject error:", err);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!db || !projectId) return;
  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (err) {
    console.error("[firebase/projects] deleteProject error:", err);
  }
}

// ── Artifacts ─────────────────────────────────────────────────────────────

export async function saveArtifact(
  artifact: Omit<ArtifactData, "id" | "createdAt">
): Promise<string | null> {
  if (!db) return null;
  try {
    const payloadStr = JSON.stringify(artifact.payload);
    const isLarge = payloadStr.length > 800_000;

    const ref = await addDoc(collection(db, "artifacts"), {
      projectId: artifact.projectId,
      userId: artifact.userId,
      type: artifact.type,
      title: artifact.title,
      payload: isLarge ? null : artifact.payload,
      payloadRef: isLarge ? `artifacts/${artifact.projectId}/${Date.now()}.json` : null,
      pinned: artifact.pinned ?? false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[firebase/projects] saveArtifact error:", err);
    return null;
  }
}

export async function getProjectArtifacts(projectId: string): Promise<ArtifactData[]> {
  if (!db || !projectId) return [];
  try {
    const q = query(
      collection(db, "artifacts"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArtifactData));
  } catch (err) {
    console.error("[firebase/projects] getProjectArtifacts error:", err);
    return [];
  }
}

export async function pinArtifact(artifactId: string, pinned: boolean): Promise<void> {
  if (!db || !artifactId) return;
  try {
    await updateDoc(doc(db, "artifacts", artifactId), { pinned });
  } catch (err) {
    console.error("[firebase/projects] pinArtifact error:", err);
  }
}

// ── Messages ──────────────────────────────────────────────────────────────

export async function saveMessage(
  message: Omit<MessageData, "id" | "createdAt">
): Promise<string | null> {
  if (!db) return null;
  try {
    const ref = await addDoc(collection(db, "messages"), {
      ...message,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[firebase/projects] saveMessage error:", err);
    return null;
  }
}

export async function getProjectMessages(projectId: string): Promise<MessageData[]> {
  if (!db || !projectId) return [];
  try {
    const q = query(
      collection(db, "messages"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MessageData));
  } catch (err) {
    console.error("[firebase/projects] getProjectMessages error:", err);
    return [];
  }
}

export function subscribeToMessages(
  projectId: string,
  onUpdate: (messages: MessageData[]) => void
): Unsubscribe {
  if (!db) return () => {};
  const q = query(
    collection(db, "messages"),
    where("projectId", "==", projectId),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MessageData));
    onUpdate(messages);
  });
}
