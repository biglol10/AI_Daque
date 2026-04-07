// Design Ref: §3.3 — authStore (Zustand)
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string;
  birth_year: number | null;
  gender: "male" | "female" | "other" | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  logout: () =>
    set({
      user: null,
      profile: null,
      isLoading: false,
    }),

  initialize: () =>
    set({
      isLoading: false,
      isInitialized: true,
    }),
}));
