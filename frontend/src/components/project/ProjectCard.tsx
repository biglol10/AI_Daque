"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useProjectStore } from "@/stores/projectStore";
import type { Project } from "@/stores/projectStore";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "초안",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  interviewing: {
    label: "인터뷰 중",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  generating: {
    label: "생성 중",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  completed: {
    label: "완료",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  failed: {
    label: "실패",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusConfig = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success("프로젝트가 삭제되었습니다.");
      setDialogOpen(false);
    } catch {
      toast.error("프로젝트 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{project.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatDate(project.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {project.current_era
              ? `현재: ${project.current_era}`
              : "아직 시작하지 않음"}
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>프로젝트 삭제</DialogTitle>
                <DialogDescription>
                  &quot;{project.title}&quot; 프로젝트를 삭제하시겠습니까?
                  이 작업은 되돌릴 수 없습니다.
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
      </CardContent>
    </Card>
  );
}
