/**
 * Firebase Admin SDK — server-side only.
 * Used in API routes for privileged Firestore operations.
 */
import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getServiceAccount(): object | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as object;
  } catch {
    console.warn("[firebase/admin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
    return null;
  }
}

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

const serviceAccount = getServiceAccount();

if (serviceAccount && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  adminApp =
    getApps().find((a) => a.name === "admin") ??
    initializeApp(
      { credential: cert(serviceAccount as Parameters<typeof cert>[0]) },
      "admin",
    );
  adminDb = getFirestore(adminApp);
} else {
  if (!serviceAccount) {
    console.error(
      "[firebase/admin] FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid — admin SDK disabled. " +
      "All server-side auth (payment, quota, chat) will fail. Set this env var in Vercel."
    );
  }
}

export { adminApp, adminDb };
