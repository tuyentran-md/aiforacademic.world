/**
 * Firestore session + usage + reference cache CRUD.
 * All functions are no-ops if Firestore is not configured (guest mode).
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./client";
import type { Reference } from "@/lib/pipeline/types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SessionData {
  query?: string;
  language?: "EN" | "VI";
  referenceIds?: string[];
  manuscript?: string;
  integrityScore?: number;
}

export type UsageAction = "search" | "translate" | "avr" | "ric";

// ── Session CRUD ─────────────────────────────────────────────────────────────

/**
 * Upsert a session document.
 * Returns the sessionId (new or updated).
 */
export async function saveSession(
  userId: string,
  data: SessionData,
  existingSessionId?: string,
): Promise<string | null> {
  if (!db || !userId) return null;

  try {
    const payload = {
      userId,
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (existingSessionId) {
      const ref = doc(db, "sessions", existingSessionId);
      await updateDoc(ref, payload);
      return existingSessionId;
    }

    const ref = await addDoc(collection(db, "sessions"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[firebase/sessions] saveSession error:", err);
    return null;
  }
}

/**
 * Get the last 10 sessions for a user.
 */
export async function getUserSessions(userId: string) {
  if (!db || !userId) return [];

  try {
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(10),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[firebase/sessions] getUserSessions error:", err);
    return [];
  }
}

// ── Usage tracking ────────────────────────────────────────────────────────────

export async function trackUsage(
  userId: string,
  action: UsageAction,
  tokensUsed?: number,
): Promise<void> {
  if (!db || !userId) return;

  try {
    await addDoc(collection(db, "usage"), {
      userId,
      action,
      tokensUsed: tokensUsed ?? null,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("[firebase/sessions] trackUsage error:", err);
  }
}

// ── Reference cache ───────────────────────────────────────────────────────────

/**
 * Cache a reference by DOI (deduplicated).
 * If no DOI, skip (ephemeral).
 */
export async function cacheReference(ref: Reference): Promise<void> {
  if (!db || !ref.doi) return;

  try {
    const docId = ref.doi.replace(/[\/\.]/g, "_");
    await setDoc(
      doc(db, "references", docId),
      { ...ref, cachedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.error("[firebase/sessions] cacheReference error:", err);
  }
}
