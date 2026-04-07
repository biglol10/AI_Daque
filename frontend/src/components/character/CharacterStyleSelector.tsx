// Design Ref: §3.1 — CharacterStyleSelector (캐릭터 스타일 선택기)
"use client";

import { Card, CardContent } from "@/components/ui/card";

interface CharacterStyleSelectorProps {
  selected: string;
  onSelect: (style: string) => void;
}

const STYLE_OPTIONS = [
  {
    id: "cartoon",
    label: "귀여운 카툰",
    description: "둥글둥글한 라인과 밝은 색감의 귀여운 카툰 스타일",
  },
  {
    id: "watercolor",
    label: "수채화",
    description: "부드러운 색 번짐과 따뜻한 감성의 수채화 스타일",
  },
  {
    id: "anime",
    label: "애니메이션",
    description: "선명한 라인과 큰 눈이 특징인 애니메이션 스타일",
  },
  {
    id: "minimal",
    label: "미니멀",
    description: "단순한 형태와 절제된 색상의 미니멀 스타일",
  },
] as const;

export function CharacterStyleSelector({
  selected,
  onSelect,
}: CharacterStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">캐릭터 스타일 선택</h3>
      <div className="grid grid-cols-2 gap-3">
        {STYLE_OPTIONS.map((style) => {
          const isSelected = selected === style.id;
          return (
            <Card
              key={style.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "hover:shadow-md"
              }`}
              onClick={() => onSelect(style.id)}
            >
              <CardContent className="py-3">
                <p
                  className={`text-sm font-medium ${
                    isSelected ? "text-primary" : ""
                  }`}
                >
                  {style.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {style.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
