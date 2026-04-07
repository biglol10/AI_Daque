"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Plus, Film } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { projects, isLoading, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {profile?.display_name
                ? `${profile.display_name}님, 안녕하세요`
                : "안녕하세요"}
            </h1>
            <p className="text-muted-foreground mt-1">
              나만의 자서전을 만들어보세요
            </p>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="size-4" />
              새 프로젝트 만들기
            </Button>
          </Link>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Project list */}
        {!isLoading && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>내 프로젝트</CardTitle>
              <CardDescription>
                생성한 자서전 프로젝트 목록입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Film className="size-12 text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="font-medium">아직 프로젝트가 없습니다</p>
                  <p className="text-sm text-muted-foreground">
                    새 프로젝트를 만들어 나만의 다큐멘터리를 시작해보세요.
                  </p>
                </div>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="size-4" />
                    새 프로젝트 만들기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
