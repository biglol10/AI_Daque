"use client";

import { useAuthStore } from "@/stores/authStore";
import { ProjectCreateForm } from "@/components/project/ProjectCreateForm";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  const { profile } = useAuthStore();
  const hasBirthYear = !!profile?.birth_year;

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>새 프로젝트</CardTitle>
          <CardDescription>
            나만의 다큐멘터리 프로젝트를 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasBirthYear && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <AlertTriangle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">
                  프로필을 먼저 설정해주세요
                </p>
                <p className="text-xs text-yellow-700">
                  시대별 인터뷰를 위해 출생연도가 필요합니다.
                </p>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="mt-1">
                    프로필 설정
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <ProjectCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
