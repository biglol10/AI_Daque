// Design Ref: §3.1 — 캐릭터 생성 페이지 (얼굴 업로드 → 캐릭터 생성 → 미리보기)
"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FaceUploader } from "@/components/character/FaceUploader";
import { CharacterPreview } from "@/components/character/CharacterPreview";
import { CharacterStyleSelector } from "@/components/character/CharacterStyleSelector";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function CharacterPage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [characterUrl, setCharacterUrl] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [characterStyle, setCharacterStyle] = useState("cartoon");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const birthYear = profile?.birth_year ?? 1990;
  const era = "10대"; // Default era — this can be made dynamic via query params

  const handleFaceUploaded = useCallback((url: string) => {
    setFaceUrl(url);
    setStep(2);
  }, []);

  const generateCharacter = useCallback(async () => {
    if (!faceUrl) {
      toast.error("먼저 얼굴 사진을 업로드해주세요.");
      return;
    }

    setIsGenerating(true);
    setStep(3);

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "character",
          project_id: projectId,
          era,
          face_image_url: faceUrl,
          birth_year: birthYear,
          style: characterStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || "캐릭터 생성 실패");
      }

      setCharacterUrl(data.character_image_url);
      setPromptUsed(data.prompt_used);
      toast.success("캐릭터가 생성되었습니다!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "캐릭터 생성에 실패했습니다."
      );
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  }, [faceUrl, projectId, era, birthYear, characterStyle]);

  const handleRegenerate = useCallback(() => {
    setCharacterUrl(null);
    setPromptUsed("");
    generateCharacter();
  }, [generateCharacter]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">캐릭터 생성</h1>
          <p className="text-sm text-muted-foreground mt-1">
            얼굴 사진을 기반으로 나만의 캐릭터를 만들어보세요.
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

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { num: 1, label: "사진 업로드" },
          { num: 2, label: "캐릭터 생성" },
          { num: 3, label: "결과 확인" },
        ].map(({ num, label }) => (
          <div key={num} className="flex items-center gap-2">
            <div
              className={`
                flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium
                ${
                  step >= num
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}
            >
              {num}
            </div>
            <span
              className={`text-sm ${
                step >= num
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {num < 3 && (
              <div className="w-8 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Face Upload */}
      <div className="space-y-6">
        <FaceUploader
          userId={user?.id ?? "anonymous"}
          projectId={projectId}
          onUploadComplete={handleFaceUploaded}
          initialUrl={faceUrl ?? undefined}
        />

        {/* Style Selector */}
        {faceUrl && !characterUrl && !isGenerating && (
          <CharacterStyleSelector
            selected={characterStyle}
            onSelect={setCharacterStyle}
          />
        )}

        {/* Step 2: Generate Button */}
        {faceUrl && !characterUrl && !isGenerating && (
          <Button
            onClick={generateCharacter}
            size="lg"
            className="w-full"
          >
            <Sparkles className="size-5 mr-2" />
            캐릭터 생성하기
          </Button>
        )}

        {/* Step 3: Character Preview */}
        {(isGenerating || characterUrl) && (
          <CharacterPreview
            imageUrl={characterUrl ?? ""}
            promptUsed={promptUsed}
            isLoading={isGenerating}
            onRegenerate={handleRegenerate}
          />
        )}

        {/* Next Step */}
        {characterUrl && !isGenerating && (
          <Button
            onClick={() =>
              router.push(`/projects/${projectId}`)
            }
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
