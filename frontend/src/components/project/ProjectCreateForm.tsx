"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectStore } from "@/stores/projectStore";
import { toast } from "sonner";

export function ProjectCreateForm() {
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const [title, setTitle] = useState("나의 다큐멘터리");
  const [isCreating, setIsCreating] = useState(false);

  const titleError =
    title.trim().length === 0
      ? "프로젝트 제목을 입력해주세요."
      : title.length > 50
        ? "제목은 50자 이내로 입력해주세요."
        : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleError || isCreating) return;

    setIsCreating(true);
    try {
      const project = await createProject(title.trim());
      toast.success("프로젝트가 생성되었습니다.");
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error("프로젝트 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-title">프로젝트 제목</Label>
        <Input
          id="project-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="나의 다큐멘터리"
          maxLength={50}
          autoFocus
        />
        {titleError && (
          <p className="text-xs text-destructive">{titleError}</p>
        )}
        <p className="text-xs text-muted-foreground text-right">
          {title.length}/50
        </p>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={!!titleError || isCreating}
      >
        {isCreating ? "생성 중..." : "프로젝트 생성"}
      </Button>
    </form>
  );
}
