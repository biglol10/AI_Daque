// Design Ref: §3.3 — projectStore (Zustand)
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Project {
  id: string;
  title: string;
  status: string;
  current_era: string | null;
  created_at: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  createProject: (title: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>(
  (set) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    fetchProjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, status, current_era, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        set({ projects: (data as Project[]) ?? [] });
      } catch (err) {
        const message = err instanceof Error ? err.message : "프로젝트 목록을 불러올 수 없습니다";
        set({ error: message });
      } finally {
        set({ isLoading: false });
      }
    },

    createProject: async (title: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("로그인이 필요합니다.");

      const { data, error } = await supabase
        .from("projects")
        .insert({ title, user_id: user.id, status: "draft" })
        .select("id, title, status, current_era, created_at")
        .single();

      if (error) throw error;
      if (!data) throw new Error("프로젝트 생성에 실패했습니다.");

      const project = data as Project;
      set((s) => ({ projects: [project, ...s.projects] }));
      return project;
    },

    deleteProject: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        currentProject:
          s.currentProject?.id === id ? null : s.currentProject,
      }));
    },

    setCurrentProject: (project) => set({ currentProject: project }),
    clearError: () => set({ error: null }),
  })
);
