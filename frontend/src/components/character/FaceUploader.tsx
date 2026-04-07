// Design Ref: §3.2 — FaceUploader (얼굴 사진 업로드 컴포넌트)
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
import { Upload, X, ImageIcon } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface FaceUploaderProps {
  userId: string;
  projectId: string;
  onUploadComplete: (url: string) => void;
  initialUrl?: string;
}

export function FaceUploader({
  userId,
  projectId,
  onUploadComplete,
  initialUrl,
}: FaceUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "JPG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기는 5MB 이하여야 합니다.";
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      setUploading(true);
      setProgress(10);

      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${projectId}/face.${ext}`;

        setProgress(30);

        const { error: uploadError } = await supabase.storage
          .from("faces")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        setProgress(80);

        const {
          data: { publicUrl },
        } = supabase.storage.from("faces").getPublicUrl(path);

        setProgress(100);
        setPreview(publicUrl);
        onUploadComplete(publicUrl);
        toast.success("얼굴 사진이 업로드되었습니다.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "업로드에 실패했습니다."
        );
        setPreview(null);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [userId, projectId, onUploadComplete, validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
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
    setPreview(null);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>얼굴 사진 업로드</CardTitle>
        <CardDescription>
          캐릭터 생성에 사용할 정면 얼굴 사진을 업로드해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {preview ? (
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={preview}
                alt="업로드된 얼굴 사진"
                className="w-48 h-48 object-cover rounded-xl border"
              />
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              사진이 업로드되었습니다.
            </p>
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
            {uploading ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <Upload className="size-8 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  업로드 중...
                </p>
                <div className="w-full max-w-48">
                  <Progress value={progress} />
                </div>
              </div>
            ) : (
              <>
                <ImageIcon className="size-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    클릭하거나 파일을 드래그하세요
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP / 최대 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview && !uploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full"
          >
            <Upload className="size-4 mr-2" />
            다른 사진 선택
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
