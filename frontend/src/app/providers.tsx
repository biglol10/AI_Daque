"use client";

// Design Ref: §3.3 — authStore (Zustand), React Query Provider
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { Profile } from "@/stores/authStore";
import { AppErrorBoundary } from "@/components/ErrorBoundary";

function AuthListener({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, logout, initialize } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      initialize();
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, logout, initialize]);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, birth_year, gender, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener>
        <AppErrorBoundary>{children}</AppErrorBoundary>
      </AuthListener>
    </QueryClientProvider>
  );
}
