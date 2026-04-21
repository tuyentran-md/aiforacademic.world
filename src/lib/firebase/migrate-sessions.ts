import { doc, collection, getDocs, setDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

export async function migrateLegacySessions(uid: string): Promise<{migrated: number, skipped: number}> {
  if (!db || !uid) return { migrated: 0, skipped: 0 };
  
  try {
    const sessionsRef = collection(db, "sessions");
    // Find sessions owned by this user
    const q = query(sessionsRef, where("ownerUid", "==", uid));
    const snap = await getDocs(q);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const sessionDoc of snap.docs) {
      const session = sessionDoc.data();
      
      // Idempotency check: Skip if already migrated
      if (session.migratedAt) {
        skipped++;
        continue;
      }
      
      const newProjectId = `proj-${sessionDoc.id}`;
      
      // 1. Create a Project
      const projectRef = doc(collection(db, "projects"), newProjectId);
      await setDoc(projectRef, {
        userId: uid,
        title: session.title || "Imported session",
        description: "Migrated from legacy workspace",
        manuscript_stage: "draft",
        createdAt: session.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // 2. Create Artifact snapshot if canvas existed
      if (session.canvas) {
        const artifactId = `art-${sessionDoc.id}`;
        const fragmentRef = doc(collection(db, "projects", newProjectId, "artifacts"), artifactId);
        await setDoc(fragmentRef, {
          title: "Legacy Canvas Snapshot",
          type: "manuscript",
          content: session.canvas,
          createdAt: serverTimestamp(),
        });
      }
      
      // 3. Mark session as migrated
      await setDoc(sessionDoc.ref, { migratedAt: serverTimestamp() }, { merge: true });
      migrated++;
    }
    
    return { migrated, skipped };
  } catch (error) {
    console.error("[migrate-sessions] Failed to migrate sessions:", error);
    return { migrated: 0, skipped: 0 };
  }
}
