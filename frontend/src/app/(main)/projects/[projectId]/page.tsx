// Design Ref: §3.1 — 프로젝트 오버뷰 페이지
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { EraTimeline } from "@/components/project/EraTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  UserRound,
  Mic,
  Clapperboard,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import type { Project } from "@/stores/projectStore";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "초안", className: "bg-gray-100 text-gray-700 border-gray-200" },
  interviewing: { label: "인터뷰 중", className: "bg-blue-100 text-blue-700 border-blue-200" },
  generating: { label: "생성 중", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  completed: { label: "완료", className: "bg-green-100 text-green-700 border-green-200" },
  failed: { label: "실패", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function ProjectOverviewPage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { profile } = useAuthStore();
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const birthYear = profile?.birth_year ?? null;

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, current_era, created_at")
        .eq("id", projectId)
        .single();

      if (error || !data) {
        toast.error("프로젝트를 찾을 수 없습니다.");
        router.push("/dashboard");
        return;
      }

      setProject(data as Project);
      setIsLoading(false);
    }

    loadProject();
  }, [projectId, router]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success("프로젝트가 삭제되었습니다.");
      router.push("/dashboard");
    } catch {
      toast.error("프로젝트 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[120px] w-[200px] bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const statusConfig = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="size-4" />
              대시보드
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Trash2 className="size-4" />
              삭제
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>프로젝트 삭제</DialogTitle>
              <DialogDescription>
                &quot;{project.title}&quot; 프로젝트를 삭제하시겠습니까? 이
                작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Era Timeline */}
      {birthYear ? (
        <EraTimeline projectId={projectId} birthYear={birthYear} />
      ) : (
        <Card>
          <CardContent className="py-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              시대별 이야기를 구성하려면 프로필에서 출생연도를 설정해주세요.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/profile")}
            >
              프로필 설정
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">빠른 작업</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/projects/${projectId}/character`)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
                <UserRound className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">캐릭터 생성</p>
                <p className="text-xs text-muted-foreground">
                  나만의 캐릭터를 만들어보세요
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/projects/${projectId}/voice`)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                <Mic className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">보이스 설정</p>
                <p className="text-xs text-muted-foreground">
                  나레이션 목소리를 선택하세요
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`transition-shadow ${
              project.status === "draft"
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-md"
            }`}
            onClick={() => {
              if (project.status !== "draft") {
                router.push(`/projects/${projectId}/generate`);
              }
            }}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                <Clapperboard className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">다큐 생성</p>
                <p className="text-xs text-muted-foreground">
                  {project.status === "draft"
                    ? "이야기를 먼저 작성해주세요"
                    : "다큐멘터리를 생성하세요"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
