// Design Ref: §5.2 — 다큐멘터리 생성 페이지
"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GenerationProgress } from "@/components/generation/GenerationProgress";
import { toast } from "sonner";
import {
  Film,
  ArrowRight,
  ImageIcon,
  Music,
  Clapperboard,
  AlertCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

interface SceneData {
  scene_id: string;
  character_image_url: string;
  background_image_url: string;
  description: string;
  duration_sec: number;
}

export default function GeneratePage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 장면 데이터와 나레이션 URL
  // 실제 구현에서는 이전 단계의 데이터를 가져옴 (module-7에서 통합)
  // 현재는 API에서 에셋 목록을 조회하여 구성
  const [scenes] = useState<SceneData[]>([]);
  const [narrationAudioUrl] = useState<string>("");

  const fetchSceneData = useCallback(async (): Promise<{
    scenes: SceneData[];
    narrationUrl: string;
  }> => {
    // 에셋 목록 조회
    const assetsRes = await fetch("/api/generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assets", project_id: projectId }),
    });

    if (!assetsRes.ok) {
      throw new Error("에셋 정보를 가져올 수 없습니다.");
    }

    const assetsData = await assetsRes.json();
    const assets = assetsData.assets || [];

    // 에셋이 없으면 에러
    if (assets.length === 0) {
      throw new Error(
        "생성된 에셋이 없습니다. 먼저 캐릭터와 배경 이미지를 생성해주세요."
      );
    }

    // 에셋을 장면 구조로 변환
    // 시대(era)별로 캐릭터와 배경을 매칭
    const charactersByEra: Record<string, string> = {};
    const backgroundsByEra: Record<string, { url: string; name: string }[]> = {};

    for (const asset of assets) {
      if (asset.asset_type === "character") {
        charactersByEra[asset.era] = asset.url;
      } else if (asset.asset_type === "background") {
        if (!backgroundsByEra[asset.era]) {
          backgroundsByEra[asset.era] = [];
        }
        backgroundsByEra[asset.era].push({ url: asset.url, name: asset.name });
      }
    }

    const generatedScenes: SceneData[] = [];
    let sceneIndex = 1;

    const eraLabels: Record<string, string> = {
      "10대": "청소년 시절의 이야기",
      "20대": "청춘의 이야기",
      "30대": "성장의 이야기",
      "40대": "성숙의 이야기",
      "50대": "원숙의 이야기",
      "60대 이상": "지혜의 이야기",
    };

    for (const era of Object.keys(charactersByEra)) {
      const charUrl = charactersByEra[era];
      const bgs = backgroundsByEra[era] || [];

      if (bgs.length === 0) {
        // 배경이 없으면 캐릭터 이미지만으로 장면 생성
        generatedScenes.push({
          scene_id: `scene_${sceneIndex}`,
          character_image_url: charUrl,
          background_image_url: charUrl, // 폴백
          description: eraLabels[era] || `${era}의 이야기`,
          duration_sec: 15,
        });
        sceneIndex++;
      } else {
        for (const bg of bgs) {
          generatedScenes.push({
            scene_id: `scene_${sceneIndex}`,
            character_image_url: charUrl,
            background_image_url: bg.url,
            description: eraLabels[era] || `${era}의 이야기`,
            duration_sec: 15,
          });
          sceneIndex++;
        }
      }
    }

    if (generatedScenes.length === 0) {
      throw new Error(
        "장면을 구성할 수 없습니다. 캐릭터와 배경 이미지를 확인해주세요."
      );
    }

    // 나레이션 오디오 URL 조회 (voice TTS 결과)
    // 나레이션이 없는 경우 빈 문자열 — 실제 통합 시 module-7에서 처리
    let narrationUrl = "";

    // Supabase Storage에서 나레이션 파일 확인 시도
    try {
      const voiceRes = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "samples",
        }),
      });
      // 나레이션 URL은 이전 단계에서 생성된 TTS 결과를 사용
      // 여기서는 간단히 빈 문자열로 처리
      if (voiceRes.ok) {
        narrationUrl = "";
      }
    } catch {
      // 나레이션이 없어도 진행 가능
    }

    return { scenes: generatedScenes, narrationUrl };
  }, [projectId]);

  const handleStartGeneration = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      // 장면 데이터 구성
      let sceneData: SceneData[];
      let narrationUrl: string;

      if (scenes.length > 0 && narrationAudioUrl) {
        sceneData = scenes;
        narrationUrl = narrationAudioUrl;
      } else {
        const fetched = await fetchSceneData();
        sceneData = fetched.scenes;
        narrationUrl = fetched.narrationUrl;
      }

      if (sceneData.length === 0) {
        setError(
          "생성할 장면이 없습니다. 이전 단계에서 에셋을 생성해주세요."
        );
        return;
      }

      if (!narrationUrl) {
        setError(
          "나레이션 오디오가 없습니다. 보이스 설정에서 TTS를 생성해주세요."
        );
        return;
      }

      // 합성 시작
      const res = await fetch("/api/documentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "compose",
          project_id: projectId,
          scenes: sceneData,
          narration_audio_url: narrationUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({
          error: "합성 시작에 실패했습니다.",
        }));
        throw new Error(errData.detail || errData.error || "합성 시작 실패");
      }

      const data = await res.json();
      setTaskId(data.task_id);
      toast.success("다큐멘터리 생성이 시작되었습니다.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  }, [projectId, scenes, narrationAudioUrl, fetchSceneData]);

  const handleComplete = useCallback(
    (videoUrl: string) => {
      toast.success("다큐멘터리가 완료되었습니다.");
      router.push(
        `/projects/${projectId}/preview?videoUrl=${encodeURIComponent(videoUrl)}`
      );
    },
    [projectId, router]
  );

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setTaskId(null);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">다큐멘터리 생성</h1>
          <p className="text-sm text-muted-foreground mt-1">
            모든 에셋을 결합하여 영상을 만듭니다.
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

      <div className="space-y-6">
        {/* Generation in progress */}
        {taskId ? (
          <GenerationProgress
            taskId={taskId}
            onComplete={handleComplete}
            onError={handleError}
          />
        ) : (
          <>
            {/* Summary card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="size-5" />
                  생성 개요
                </CardTitle>
                <CardDescription>
                  아래 에셋을 결합하여 다큐멘터리를 생성합니다.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <ImageIcon className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">캐릭터 & 배경</p>
                      <p className="text-xs text-muted-foreground">
                        이미지 에셋
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Music className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">나레이션</p>
                      <p className="text-xs text-muted-foreground">
                        TTS 음성
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clapperboard className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">출력</p>
                      <p className="text-xs text-muted-foreground">
                        1080p MP4
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  <p>
                    생성 과정: 에셋 수집 → 장면 합성 → 오디오 합성 → 최종
                    렌더링. 장면 수에 따라 수 분이 소요될 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    오류가 발생했습니다
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Start button */}
            <Button
              onClick={handleStartGeneration}
              disabled={isStarting}
              size="lg"
              className="w-full"
            >
              {isStarting ? (
                <>
                  <span className="size-5 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  준비 중...
                </>
              ) : (
                <>
                  <Film className="size-5 mr-2" />
                  다큐멘터리 생성
                  <ArrowRight className="size-5 ml-2" />
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
