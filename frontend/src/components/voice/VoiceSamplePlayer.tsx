// Design Ref: §5.2 — VoiceSamplePlayer (샘플 보이스 목록 + 미리듣기 + 선택)
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Check } from "lucide-react";

interface SampleVoice {
  id: string;
  name: string;
  gender: string;
  preview_url: string | null;
}

interface VoiceSamplePlayerProps {
  onSelect: (voiceId: string) => void;
  selectedVoiceId?: string | null;
}

export function VoiceSamplePlayer({
  onSelect,
  selectedVoiceId,
}: VoiceSamplePlayerProps) {
  const [voices, setVoices] = useState<SampleVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "samples" }),
        });
        if (res.ok) {
          const data = await res.json();
          setVoices(data);
        }
      } catch {
        // Fallback to static voices if API is unreachable
        setVoices([
          { id: "21m00Tcm4TlvDq8ikWAM", name: "남성 - 따뜻한 아버지", gender: "male", preview_url: null },
          { id: "EXAVITQu4vr4xnSDxMaL", name: "여성 - 부드러운 어머니", gender: "female", preview_url: null },
          { id: "MF3mGyEYCl7XYWbV9V6O", name: "남성 - 청년 내레이터", gender: "male", preview_url: null },
          { id: "jBpfAFnaylnKdtnKV0nZ", name: "여성 - 밝은 내레이터", gender: "female", preview_url: null },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchVoices();
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playPreview = useCallback(
    async (voiceId: string) => {
      // If already playing this voice, stop it
      if (playingId === voiceId) {
        stopAudio();
        return;
      }

      // Stop any currently playing audio
      stopAudio();
      setPreviewLoading(voiceId);

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "preview",
            text: "안녕하세요. 저는 여러분의 이야기를 들려줄 내레이터입니다.",
            voice_id: voiceId,
          }),
        });

        if (!res.ok) {
          throw new Error("미리듣기 실패");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          setPlayingId(null);
          URL.revokeObjectURL(url);
        };

        audioRef.current = audio;
        setPlayingId(voiceId);
        await audio.play();
      } catch {
        setPlayingId(null);
      } finally {
        setPreviewLoading(null);
      }
    },
    [playingId, stopAudio]
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">
            보이스 목록을 불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>샘플 보이스</CardTitle>
        <CardDescription>
          내레이션에 사용할 보이스를 선택해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {voices.map((voice) => {
            const isSelected = selectedVoiceId === voice.id;
            const isPlaying = playingId === voice.id;
            const isLoadingPreview = previewLoading === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => onSelect(voice.id)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {isSelected && (
                    <div className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{voice.name}</p>
                  </div>
                  <Badge
                    variant={voice.gender === "male" ? "default" : "secondary"}
                  >
                    {voice.gender === "male" ? "남성" : "여성"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    playPreview(voice.id);
                  }}
                  disabled={isLoadingPreview}
                  className="shrink-0"
                >
                  {isLoadingPreview ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isPlaying ? (
                    <Square className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  <span className="ml-1 text-xs">
                    {isLoadingPreview
                      ? "로딩"
                      : isPlaying
                        ? "정지"
                        : "듣기"}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
