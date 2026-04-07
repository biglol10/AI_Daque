"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DownloadButtonProps {
  projectId: string;
  videoUrl?: string;
}

export function DownloadButton({ projectId, videoUrl }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);

    try {
      let url = videoUrl;

      // videoUrl이 없으면 API에서 다운로드 URL 가져오기
      if (!url) {
        const res = await fetch("/api/documentary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "download",
            project_id: projectId,
          }),
        });

        if (!res.ok) {
          throw new Error("다운로드 URL을 가져올 수 없습니다.");
        }

        const data = await res.json();
        url = data.video_url;
      }

      if (!url) {
        throw new Error("비디오 URL이 없습니다.");
      }

      // fetch+blob 방식으로 다운로드 트리거
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("비디오 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `documentary_${projectId}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);

      toast.success("다운로드가 시작되었습니다.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "다운로드에 실패했습니다.";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  }, [projectId, videoUrl]);

  return (
    <Button
      onClick={handleDownload}
      disabled={downloading}
      variant="outline"
      size="lg"
      className="w-full"
    >
      {downloading ? (
        <Loader2 className="size-5 mr-2 animate-spin" />
      ) : (
        <Download className="size-5 mr-2" />
      )}
      {downloading ? "다운로드 중..." : "영상 다운로드"}
    </Button>
  );
}
