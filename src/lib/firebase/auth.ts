"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./client";

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        try {
          const { migrateLegacySessions } = await import("./migrate-sessions");
          const { migrated } = await migrateLegacySessions(firebaseUser.uid);
          if (migrated > 0) {
            console.log(`[auth/migration] Automatically migrated ${migrated} legacy sessions to projects.`);
          }
        } catch (e) {
          console.error("Migration check failed:", e);
        }
      }
    });

    return unsubscribe;
  }, []);

  async function signIn() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
  }

  return { user, loading, signIn, signOut };
}
