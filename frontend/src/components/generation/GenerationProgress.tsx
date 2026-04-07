"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface GenerationProgressProps {
  taskId: string;
  onComplete: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

interface StatusData {
  task_id: string;
  status: "generating" | "completed" | "failed";
  progress: number;
  step: string;
  video_url?: string;
  duration_sec?: number;
  file_size_mb?: number;
  error?: string;
}

const STEP_CONFIG = [
  { key: "preparing", label: "준비 중..." },
  { key: "downloading", label: "에셋 수집 중..." },
  { key: "composing", label: "장면 합성 중..." },
  { key: "merging_audio", label: "오디오 합성 중..." },
  { key: "uploading", label: "업로드 중..." },
  { key: "completed", label: "완료" },
] as const;

type StepKey = (typeof STEP_CONFIG)[number]["key"];

function getStepIndex(step: string): number {
  const idx = STEP_CONFIG.findIndex((s) => s.key === step);
  return idx >= 0 ? idx : 0;
}

export function GenerationProgress({
  taskId,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (completedRef.current) return;

    try {
      const res = await fetch("/api/documentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", task_id: taskId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "상태 조회 실패" }));
        setPollError(err.error || "상태 조회 실패");
        return;
      }

      const data: StatusData = await res.json();
      setStatus(data);
      setPollError(null);

      if (data.status === "completed" && data.video_url) {
        completedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete(data.video_url);
      }

      if (data.status === "failed") {
        completedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onError?.(data.error || "알 수 없는 오류가 발생했습니다.");
      }
    } catch {
      setPollError("서버에 연결할 수 없습니다.");
    }
  }, [taskId, onComplete, onError]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchStatus]);

  const currentStep = status?.step || "preparing";
  const currentStepIndex = getStepIndex(currentStep);
  const progress = status?.progress ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>다큐멘터리 생성 중</CardTitle>
        <CardDescription>
          영상을 생성하고 있습니다. 잠시만 기다려주세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress bar */}
        <Progress value={progress} max={100}>
          <ProgressLabel>진행률</ProgressLabel>
          <ProgressValue>
            {(formattedValue, value) =>
              value != null ? `${Math.round(value)}%` : "0%"
            }
          </ProgressValue>
        </Progress>

        {/* Step list */}
        <div className="space-y-3">
          {STEP_CONFIG.map((step, idx) => {
            const isComplete = idx < currentStepIndex;
            const isActive =
              idx === currentStepIndex && status?.status === "generating";
            const isPending = idx > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-3">
                {isComplete ? (
                  <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="size-5 text-primary animate-spin shrink-0" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={
                    isComplete
                      ? "text-sm text-muted-foreground line-through"
                      : isActive
                        ? "text-sm font-medium"
                        : isPending
                          ? "text-sm text-muted-foreground/60"
                          : "text-sm"
                  }
                >
                  {step.label}
                  {isActive &&
                    currentStep === "composing" &&
                    progress > 20 &&
                    progress < 70 &&
                    ` (${progress}%)`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {(status?.status === "failed" || pollError) && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {status?.error || pollError}
            </p>
          </div>
        )}

        {/* Completion info */}
        {status?.status === "completed" && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
            <p className="text-sm text-green-600">
              생성이 완료되었습니다.
              {status.duration_sec &&
                ` (${Math.round(status.duration_sec)}초, ${status.file_size_mb}MB)`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
