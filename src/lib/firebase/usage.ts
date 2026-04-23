import { adminDb } from "./admin";
import { FieldValue } from "firebase-admin/firestore";
import { TrackedFunction } from "@/lib/quota-matrix";
import "server-only";

export interface UsageDoc {
  counts: Partial<Record<TrackedFunction, number>>;
  updatedAt: FirebaseFirestore.Timestamp;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Returns the usage doc reference for authenticated users or anonymous IPs.
 */
function getUsageRef(uid: string | null, ipHash: string, today: string) {
  if (!adminDb) throw new Error("Firebase Admin DB not initialized"); // guarded by callers
  
  if (uid) {
    return adminDb.collection("users").doc(uid).collection("usage").doc(today);
  } else {
    // We use a root collection for anon_usage so it can be cleaned up easily over time
    return adminDb.collection("anon_usage").doc(`${ipHash}_${today}`);
  }
}

const EMPTY_USAGE: UsageDoc = {
  counts: {},
  updatedAt: null as unknown as FirebaseFirestore.Timestamp,
};

/**
 * Gets today's usage doc, auto-initializing to zero if missing.
 * Returns empty usage (zero counts) when admin SDK is unavailable — degrades gracefully.
 */
export async function getTodayUsage(uid: string | null, ipHash: string): Promise<UsageDoc> {
  if (!adminDb) return EMPTY_USAGE;
  const today = getTodayDateString();
  const ref = getUsageRef(uid, ipHash, today);

  const snap = await ref.get();
  if (snap.exists) {
    return snap.data() as UsageDoc;
  }

  const initialDoc: UsageDoc = {
    counts: {},
    updatedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
  };

  await ref.set(initialDoc, { merge: true });
  return initialDoc;
}

/**
 * Increment the counter for a specific function atomically.
 * No-op when admin SDK is unavailable.
 */
export async function incrementUsage(uid: string | null, ipHash: string, functionName: TrackedFunction): Promise<void> {
  if (!adminDb) return;
  const today = getTodayDateString();
  const ref = getUsageRef(uid, ipHash, today);

  await ref.set({
    [`counts.${functionName}`]: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
