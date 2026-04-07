// Design Ref: §3.2 — TemplateForm (시기별 서사 입력 폼)
// Plan SC: FR-02 인생 스토리 템플릿 작성
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { TemplateGuide } from "./TemplateGuide";
import { toast } from "sonner";

interface TemplateFormProps {
  projectId: string;
  era: string;
  birthYear: number;
  onComplete: (storyData: { structured: Record<string, unknown>; script: string }) => void;
}

export function TemplateForm({ projectId, era, birthYear, onComplete }: TemplateFormProps) {
  const [text, setText] = useState("");
  const [isStructuring, setIsStructuring] = useState(false);
  const [isScripting, setIsScripting] = useState(false);
  const [structured, setStructured] = useState<Record<string, unknown> | null>(null);

  async function handleStructure() {
    if (!text.trim() || text.trim().length < 50) {
      toast.error("최소 50자 이상 작성해주세요");
      return;
    }
    setIsStructuring(true);
    try {
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "structure", era, raw_text: text, birth_year: birthYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "구조화 실패");
      setStructured(data.structured_narrative);
      toast.success("서사 구조화가 완료되었습니다");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "구조화에 실패했습니다");
    } finally {
      setIsStructuring(false);
    }
  }

  async function handleGenerateScript() {
    if (!structured) return;
    setIsScripting(true);
    try {
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "script", era, structured_narrative: structured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "스크립트 생성 실패");
      onComplete({ structured, script: data.narration_script });
      toast.success("나레이션 스크립트가 생성되었습니다");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "스크립트 생성에 실패했습니다");
    } finally {
      setIsScripting(false);
    }
  }

  const scenes = (structured as { scenes?: Array<{ scene_id: string; title: string; description: string; emotion: string }> })?.scenes;

  return (
    <div className="space-y-4">
      <TemplateGuide era={era} />

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">{era} 이야기를 작성해주세요</h3>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${era} 시절의 이야기를 자유롭게 작성해주세요.\n기억에 남는 사건, 사람, 장소, 감정 등을 떠올려보세요...`}
          className="min-h-[200px] resize-y"
          disabled={isStructuring}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-muted-foreground">{text.length}자</span>
          <Button onClick={handleStructure} disabled={text.trim().length < 50 || isStructuring}>
            {isStructuring ? "구조화 중..." : "서사 구조화"}
          </Button>
        </div>
      </Card>

      {scenes && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">장면 구성</h3>
          <div className="space-y-3">
            {scenes.map((scene, i) => (
              <div key={scene.scene_id} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">장면 {i + 1}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{scene.emotion}</span>
                </div>
                <p className="text-sm font-medium">{scene.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{scene.description}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleGenerateScript} disabled={isScripting} className="w-full mt-4">
            {isScripting ? "스크립트 생성 중..." : "나레이션 스크립트 생성"}
          </Button>
        </Card>
      )}
    </div>
  );
}
