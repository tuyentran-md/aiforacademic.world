/**
 * User profile — stores display prefs, pro status, quotas.
 */
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./client";

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  plan: "free" | "pro";
  outputLanguage: "VI" | "EN";
  createdAt?: unknown;
  updatedAt?: unknown;
  lemonsqueezy_customer_id?: string | number;
  lemonsqueezy_subscription_id?: string;
  subscription_expires_at?: string | null;
  subscription_status?: string;
}

export async function getOrCreateProfile(
  uid: string,
  email?: string,
  displayName?: string
): Promise<UserProfile | null> {
  if (!db || !uid) return null;
  try {
    const ref = doc(db, "profile", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    const newProfile: UserProfile = {
      uid,
      email,
      displayName,
      plan: "free",
      outputLanguage: "VI",
    };
    await setDoc(ref, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newProfile;
  } catch (err) {
    console.error("[firebase/profile] getOrCreateProfile error:", err);
    return null;
  }
}

export async function updateProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "uid">>
): Promise<void> {
  if (!db || !uid) return;
  try {
    await setDoc(
      doc(db, "profile", uid),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("[firebase/profile] updateProfile error:", err);
  }
}
