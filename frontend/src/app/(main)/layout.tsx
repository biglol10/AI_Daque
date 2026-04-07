"use client";

// Design Ref: §6 — AuthGuard middleware
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitialized, profile } = useAuthStore();

  useEffect(() => {
    // Double-check: proxy handles this, but guard client-side navigation too
    if (isInitialized && !user) {
      router.replace("/login");
    }
  }, [user, isInitialized, router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("로그아웃에 실패했습니다.");
      return;
    }
    router.replace("/login");
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b bg-card">
        <div className="flex h-14 items-center justify-between px-4 max-w-5xl mx-auto w-full">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            AI 자서전
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {profile.display_name}
              </Link>
            )}
            <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="sr-only">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
