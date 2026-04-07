// Design Ref: §3.2 — CharacterPreview (생성된 캐릭터 미리보기)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface CharacterPreviewProps {
  imageUrl: string;
  promptUsed: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

export function CharacterPreview({
  imageUrl,
  promptUsed,
  isLoading,
  onRegenerate,
}: CharacterPreviewProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>캐릭터 생성 중</CardTitle>
          <CardDescription>
            AI가 캐릭터를 만들고 있습니다. 잠시만 기다려주세요...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-xl bg-muted animate-pulse flex items-center justify-center">
              <RefreshCw className="size-8 text-muted-foreground animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              캐릭터를 그리고 있어요... (약 30초 소요)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>내 캐릭터</CardTitle>
        <CardDescription>
          AI가 생성한 캐릭터입니다. 마음에 들지 않으면 재생성할 수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <img
            src={imageUrl}
            alt="생성된 캐릭터"
            className="w-64 h-64 object-cover rounded-xl border shadow-sm"
          />

          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="size-4 mr-2" />
            재생성
          </Button>

          <div className="w-full">
            <button
              onClick={() => setShowPrompt((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              {showPrompt ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
              사용된 프롬프트 {showPrompt ? "접기" : "보기"}
            </button>
            {showPrompt && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                  {promptUsed}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
