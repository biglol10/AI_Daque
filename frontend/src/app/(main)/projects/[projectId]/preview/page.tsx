// Design Ref: §5.2 — 다큐멘터리 미리보기 페이지
"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/documentary/VideoPlayer";
import { DownloadButton } from "@/components/documentary/DownloadButton";
import { toast } from "sonner";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function PreviewPage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [videoUrl, setVideoUrl] = useState<string | null>(
    searchParams.get("videoUrl")
  );
  const [loading, setLoading] = useState(!videoUrl);

  const fetchVideoUrl = useCallback(async () => {
    if (videoUrl) return;

    setLoading(true);
    try {
      const res = await fetch("/api/documentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          project_id: projectId,
        }),
      });

      if (!res.ok) {
        throw new Error("영상을 찾을 수 없습니다.");
      }

      const data = await res.json();
      if (data.video_url) {
        setVideoUrl(data.video_url);
      } else {
        throw new Error("영상 URL이 없습니다.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "영상을 불러올 수 없습니다.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, videoUrl]);

  useEffect(() => {
    fetchVideoUrl();
  }, [fetchVideoUrl]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">다큐멘터리 미리보기</h1>
          <p className="text-sm text-muted-foreground mt-1">
            생성된 다큐멘터리를 확인하고 다운로드하세요.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              영상을 불러오는 중...
            </p>
          </div>
        )}

        {/* Video player */}
        {videoUrl && !loading && (
          <>
            <VideoPlayer videoUrl={videoUrl} title="내 인생 다큐멘터리" />

            {/* Actions */}
            <div className="space-y-3">
              <DownloadButton projectId={projectId} videoUrl={videoUrl} />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/dashboard")}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  대시보드로 돌아가기
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push(`/projects/${projectId}`)}
                >
                  <Plus className="size-4 mr-2" />
                  새 에피소드 만들기
                </Button>
              </div>
            </div>
          </>
        )}

        {/* No video state */}
        {!videoUrl && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-sm text-muted-foreground">
              아직 생성된 다큐멘터리가 없습니다.
            </p>
            <Button
              onClick={() => router.push(`/projects/${projectId}/generate`)}
            >
              다큐멘터리 생성하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
