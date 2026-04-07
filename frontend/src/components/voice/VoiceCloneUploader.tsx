// Design Ref: §5.2 — VoiceCloneUploader (음성 파일 업로드 → 클로닝)
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Upload, Mic, X, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
  "audio/x-wav",
  "audio/flac",
];

interface VoiceCloneUploaderProps {
  userId: string;
  projectId: string;
  onCloneComplete: (voiceId: string) => void;
}

export function VoiceCloneUploader({
  userId,
  projectId,
  onCloneComplete,
}: VoiceCloneUploaderProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "WAV, MP3, MP4, OGG, WebM, FLAC 형식의 오디오 파일만 업로드할 수 있습니다.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기는 10MB 이하여야 합니다.";
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
    },
    [validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemove = useCallback(() => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioFile(null);
    setAudioPreviewUrl(null);
  }, [audioPreviewUrl]);

  const startCloning = useCallback(async () => {
    if (!audioFile) {
      toast.error("먼저 음성 파일을 업로드해주세요.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // 1. Upload to Supabase Storage
      const ext = audioFile.name.split(".").pop() || "wav";
      const storagePath = `${userId}/${projectId}/clone_source.${ext}`;

      setUploadProgress(20);

      const { error: uploadError } = await supabase.storage
        .from("voices")
        .upload(storagePath, audioFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(50);

      const {
        data: { publicUrl },
      } = supabase.storage.from("voices").getPublicUrl(storagePath);

      setUploading(false);
      setCloning(true);
      setUploadProgress(70);

      // 2. Call clone API
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clone",
          project_id: projectId,
          audio_file_url: publicUrl,
          voice_name: "내 목소리",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || data.error || "보이스 클로닝에 실패했습니다."
        );
      }

      setUploadProgress(100);
      toast.success("보이스 클로닝이 완료되었습니다!");
      onCloneComplete(data.cloned_voice_id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "보이스 클로닝에 실패했습니다."
      );
    } finally {
      setUploading(false);
      setCloning(false);
      setUploadProgress(0);
    }
  }, [audioFile, userId, projectId, onCloneComplete]);

  const isProcessing = uploading || cloning;

  return (
    <Card>
      <CardHeader>
        <CardTitle>내 목소리 클로닝</CardTitle>
        <CardDescription>
          30초 이상의 음성을 녹음해주세요. 깨끗한 음질일수록 좋은 결과를 얻을 수
          있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioFile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Mic className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {audioFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              {!isProcessing && (
                <button
                  onClick={handleRemove}
                  className="rounded-full p-1 hover:bg-destructive/10 transition-colors"
                  type="button"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {audioPreviewUrl && (
              <audio
                controls
                src={audioPreviewUrl}
                className="w-full h-10"
              />
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>
                    {uploading
                      ? "음성 파일 업로드 중..."
                      : "보이스 클로닝 진행 중... (1-2분 소요)"}
                  </span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {!isProcessing && (
              <Button onClick={startCloning} className="w-full">
                <Mic className="size-4 mr-2" />
                클로닝 시작
              </Button>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex flex-col items-center justify-center gap-3 p-8
              border-2 border-dashed rounded-xl cursor-pointer
              transition-colors duration-200
              ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <Upload className="size-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                클릭하거나 음성 파일을 드래그하세요
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                WAV, MP3, OGG, WebM, FLAC / 최대 10MB
              </p>
              <p className="text-xs text-primary mt-2">
                30초 이상의 깨끗한 음성 녹음을 권장합니다
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
