// Design Ref: §3.2 — 서사 확인 전용 페이지 (스토리 뷰어 + 편집)
"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StoryViewer } from "@/components/story/StoryViewer";
import { StoryEditor } from "@/components/story/StoryEditor";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Clapperboard } from "lucide-react";

interface PageProps {
  params: Promise<{ projectId: string; era: string }>;
}

interface Narrative {
  title: string;
  synopsis: string;
  scenes: Array<{
    scene_id: string;
    title: string;
    description: string;
    duration_sec: number;
    emotion: string;
  }>;
}

interface StoryData {
  id: string;
  narrative: Narrative;
  narration_script: string;
}

export default function StoryEraPage({ params }: PageProps) {
  const { projectId, era } = use(params);
  const router = useRouter();
  const eraLabel = decodeURIComponent(era);

  const [story, setStory] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function loadStory() {
      const { data, error } = await supabase
        .from("stories")
        .select("id, narrative, narration_script")
        .eq("project_id", projectId)
        .eq("era", eraLabel)
        .single();

      if (error || !data) {
        toast.error("서사 데이터를 불러올 수 없습니다.");
        router.push(`/projects/${projectId}`);
        return;
      }

      setStory(data as StoryData);
      setIsLoading(false);
    }

    loadStory();
  }, [projectId, eraLabel, router]);

  const handleSave = useCallback(
    async (updated: { narrative: Narrative; narrationScript: string }) => {
      if (!story) return;

      const { error } = await supabase
        .from("stories")
        .update({
          narrative: updated.narrative,
          narration_script: updated.narrationScript,
        })
        .eq("id", story.id);

      if (error) {
        toast.error("서사 저장에 실패했습니다.");
        return;
      }

      setStory({
        ...story,
        narrative: updated.narrative,
        narration_script: updated.narrationScript,
      });
      setIsEditing(false);
      toast.success("서사가 저장되었습니다.");
    },
    [story]
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-60 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="size-4 mr-1" />
            돌아가기
          </Button>
          <h1 className="text-xl font-bold">{eraLabel} 서사</h1>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-4 mr-1" />
              서사 수정
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/generate`)}
          >
            <Clapperboard className="size-4 mr-1" />
            다큐 생성으로
          </Button>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <StoryEditor
          narrative={story.narrative}
          narrationScript={story.narration_script}
          onSave={handleSave}
        />
      ) : (
        <StoryViewer
          narrative={story.narrative}
          narrationScript={story.narration_script}
        />
      )}
    </div>
  );
}
