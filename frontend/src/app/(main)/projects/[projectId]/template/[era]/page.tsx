// Design Ref: §3.1 — 템플릿 입력 페이지
// Plan SC: FR-02 인생 스토리 템플릿 작성
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "@/components/template/TemplateForm";
import { StoryViewer } from "@/components/story/StoryViewer";
import { useAuthStore } from "@/stores/authStore";

interface PageProps {
  params: Promise<{ projectId: string; era: string }>;
}

export default function TemplatePage({ params }: PageProps) {
  const { projectId, era } = use(params);
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const eraLabel = decodeURIComponent(era);

  const [storyData, setStoryData] = useState<{
    structured: Record<string, unknown>;
    script: string;
  } | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}`)}>
          ← 돌아가기
        </Button>
        <h1 className="text-lg font-semibold">{eraLabel} 이야기 작성</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {!storyData ? (
          <TemplateForm
            projectId={projectId}
            era={eraLabel}
            birthYear={profile?.birth_year ?? 1990}
            onComplete={setStoryData}
          />
        ) : (
          <div className="space-y-4">
            <StoryViewer
              narrative={storyData.structured as { title: string; synopsis: string; scenes: Array<{ scene_id: string; title: string; description: string; duration_sec: number; emotion: string }> }}
              narrationScript={storyData.script}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStoryData(null)}>
                다시 작성
              </Button>
              <Button onClick={() => router.push(`/projects/${projectId}`)}>
                완료
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
