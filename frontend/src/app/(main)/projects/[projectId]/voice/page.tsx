// Design Ref: §5.2 — 보이스 설정 페이지
"use client";

import { use, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VoiceSelector } from "@/components/voice/VoiceSelector";
import { toast } from "sonner";
import { ArrowRight, Play, Square, Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function VoicePage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"sample" | "cloned">(
    "sample"
  );
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoiceSelected = useCallback(
    (voiceId: string, type: "sample" | "cloned") => {
      setSelectedVoiceId(voiceId);
      setSelectedType(type);
      setSaved(false);
    },
    []
  );

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPreviewPlaying(false);
  }, []);

  const playPreview = useCallback(async () => {
    if (!selectedVoiceId) {
      toast.error("먼저 보이스를 선택해주세요.");
      return;
    }

    if (previewPlaying) {
      stopPreview();
      return;
    }

    setPreviewLoading(true);

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          text: "안녕하세요. 저는 당신의 인생 이야기를 들려줄 내레이터입니다. 함께 아름다운 여정을 시작해볼까요?",
          voice_id: selectedVoiceId,
        }),
      });

      if (!res.ok) {
        throw new Error("미리듣기 생성 실패");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setPreviewPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setPreviewPlaying(false);
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      setPreviewPlaying(true);
      await audio.play();
    } catch {
      toast.error("미리듣기 생성에 실패했습니다.");
      setPreviewPlaying(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedVoiceId, previewPlaying, stopPreview]);

  const handleSave = useCallback(() => {
    if (!selectedVoiceId) {
      toast.error("보이스를 선택해주세요.");
      return;
    }

    // In a full implementation, this would persist the voice selection
    // to the project record in Supabase. For now, we mark it as saved
    // and allow navigation.
    setSaved(true);
    toast.success("보이스 설정이 저장되었습니다.");
  }, [selectedVoiceId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">보이스 설정</h1>
          <p className="text-sm text-muted-foreground mt-1">
            나레이션에 사용할 보이스를 선택하거나 내 목소리를 클로닝하세요.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          ← 돌아가기
        </Button>
      </div>

      {/* Voice Selector */}
      <div className="space-y-6">
        <VoiceSelector
          projectId={projectId}
          onVoiceSelected={handleVoiceSelected}
        />

        {/* Preview & Save Controls */}
        {selectedVoiceId && (
          <div className="flex flex-col gap-3">
            {/* Preview Button */}
            <Button
              variant="outline"
              onClick={playPreview}
              disabled={previewLoading}
              className="w-full"
            >
              {previewLoading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : previewPlaying ? (
                <Square className="size-4 mr-2" />
              ) : (
                <Play className="size-4 mr-2" />
              )}
              {previewLoading
                ? "미리듣기 생성 중..."
                : previewPlaying
                  ? "정지"
                  : "TTS 미리듣기"}
            </Button>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full">
              {saved ? "저장 완료" : "저장"}
            </Button>
          </div>
        )}

        {/* Next Step Navigation */}
        {saved && (
          <Button
            onClick={() => router.push(`/projects/${projectId}`)}
            size="lg"
            className="w-full"
          >
            다음 단계로
            <ArrowRight className="size-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
