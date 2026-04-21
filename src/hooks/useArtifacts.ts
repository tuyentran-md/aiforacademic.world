"use client";

import { useState, useCallback } from "react";
import {
  saveArtifact,
  getProjectArtifacts,
  pinArtifact,
  type ArtifactType,
} from "@/lib/firebase/projects";

export interface LocalArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  payload: unknown;
  createdAt: number;
  pinned?: boolean;
}

/**
 * useArtifacts — manages the artifact panel state + Firebase persistence.
 */
export function useArtifacts(projectId: string | null, userId: string | null | undefined) {
  const [artifacts, setArtifacts] = useState<LocalArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) ?? artifacts[artifacts.length - 1] ?? null;

  async function loadFromProject(pid: string) {
    const remote = await getProjectArtifacts(pid);
    const local: LocalArtifact[] = remote.map((a) => ({
      id: a.id ?? String(Date.now()),
      type: a.type,
      title: a.title,
      payload: a.payload,
      createdAt: Date.now(),
      pinned: a.pinned,
    }));
    setArtifacts(local);
    if (local.length > 0) setActiveArtifactId(local[0].id);
  }

  const addArtifact = useCallback(async (artifact: Omit<LocalArtifact, "id" | "createdAt">) => {
    const localId = `artifact-${Date.now()}`;
    const localArtifact: LocalArtifact = { ...artifact, id: localId, createdAt: Date.now() };
    setArtifacts((prev) => [...prev, localArtifact]);
    setActiveArtifactId(localId);

    if (projectId && userId) {
      const remoteId = await saveArtifact({
        projectId,
        userId,
        type: artifact.type,
        title: artifact.title,
        payload: artifact.payload,
        pinned: artifact.pinned,
      });
      if (remoteId) {
        setArtifacts((prev) => prev.map((a) => a.id === localId ? { ...a, id: remoteId } : a));
        setActiveArtifactId(remoteId);
      }
    }

    return localId;
  }, [projectId, userId]);

  async function togglePin(artifactId: string) {
    const art = artifacts.find((a) => a.id === artifactId);
    if (!art) return;
    const pinned = !art.pinned;
    setArtifacts((prev) => prev.map((a) => a.id === artifactId ? { ...a, pinned } : a));
    await pinArtifact(artifactId, pinned).catch(() => {});
  }

  function clear() {
    setArtifacts([]);
    setActiveArtifactId(null);
  }

  return { artifacts, activeArtifact, activeArtifactId, setActiveArtifactId, addArtifact, loadFromProject, togglePin, clear };
}
