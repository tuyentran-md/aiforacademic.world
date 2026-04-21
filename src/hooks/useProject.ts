"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth";
import {
  getUserProjects,
  createProject,
  deleteProject,
  type ProjectData,
} from "@/lib/firebase/projects";

/**
 * useProject — manages project list + active project for the current user.
 * Guest users get an ephemeral "unsaved" project.
 */
export function useProject() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load on mount / user change
  useEffect(() => {
    if (!user) { setProjects([]); return; }
    setLoading(true);
    getUserProjects(user.uid)
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  async function newProject(title?: string, description?: string): Promise<string | null> {
    if (!user) return null;
    const id = await createProject({
      userId: user.uid,
      title: title ?? `Project ${new Date().toLocaleDateString("vi-VN")}`,
      description,
    });
    if (id) {
      const newP: ProjectData = { id, userId: user.uid, title: title ?? `Project ${new Date().toLocaleDateString("vi-VN")}` };
      setProjects((prev) => [newP, ...prev]);
      setActiveProjectId(id);
    }
    return id;
  }

  async function removeProject(projectId: string) {
    await deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) setActiveProjectId(null);
  }

  return { projects, activeProjectId, setActiveProjectId, newProject, removeProject, loading };
}
