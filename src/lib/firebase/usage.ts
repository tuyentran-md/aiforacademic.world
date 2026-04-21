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
  if (!adminDb) throw new Error("Firebase Admin DB not initialized");
  
  if (uid) {
    return adminDb.collection("users").doc(uid).collection("usage").doc(today);
  } else {
    // We use a root collection for anon_usage so it can be cleaned up easily over time
    return adminDb.collection("anon_usage").doc(`${ipHash}_${today}`);
  }
}

/**
 * Gets today's usage doc, auto-initializing to zero if missing.
 */
export async function getTodayUsage(uid: string | null, ipHash: string): Promise<UsageDoc> {
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
  
  // Create it passively (no await needed for fast returns, but we wait to ensure consistency)
  await ref.set(initialDoc, { merge: true });
  return initialDoc;
}

/**
 * Increment the counter for a specific function atomically.
 */
export async function incrementUsage(uid: string | null, ipHash: string, functionName: TrackedFunction): Promise<void> {
  const today = getTodayDateString();
  const ref = getUsageRef(uid, ipHash, today);
  
  await ref.set({
    [`counts.${functionName}`]: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
