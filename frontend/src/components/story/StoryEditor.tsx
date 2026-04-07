// Design Ref: §3.2 — StoryEditor (서사 편집기)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Scene {
  scene_id: string;
  title: string;
  description: string;
  duration_sec: number;
  emotion: string;
}

interface Narrative {
  title: string;
  synopsis: string;
  scenes: Scene[];
}

interface StoryEditorProps {
  narrative: Narrative;
  narrationScript: string;
  onSave: (updated: { narrative: Narrative; narrationScript: string }) => void;
}

export function StoryEditor({
  narrative,
  narrationScript,
  onSave,
}: StoryEditorProps) {
  const [title, setTitle] = useState(narrative.title);
  const [synopsis, setSynopsis] = useState(narrative.synopsis);
  const [scenes, setScenes] = useState<Scene[]>(
    narrative.scenes.map((s) => ({ ...s }))
  );
  const [script, setScript] = useState(narrationScript);

  function updateScene(index: number, field: keyof Scene, value: string) {
    setScenes((prev) =>
      prev.map((scene, i) =>
        i === index ? { ...scene, [field]: value } : scene
      )
    );
  }

  function handleSave() {
    onSave({
      narrative: { title, synopsis, scenes },
      narrationScript: script,
    });
  }

  return (
    <div className="space-y-4">
      {/* Title & Synopsis */}
      <Card className="p-4 space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold">제목</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">시놉시스</label>
          <Textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows={3}
          />
        </div>
      </Card>

      {/* Scenes */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold">장면 구성 ({scenes.length}개)</h3>
        {scenes.map((scene, index) => (
          <div key={scene.scene_id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {index + 1}
              </div>
              <Input
                value={scene.title}
                onChange={(e) => updateScene(index, "title", e.target.value)}
                className="text-sm font-medium"
                placeholder="장면 제목"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">장면 설명</label>
              <Textarea
                value={scene.description}
                onChange={(e) =>
                  updateScene(index, "description", e.target.value)
                }
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="space-y-1 flex-1">
                <label className="text-xs text-muted-foreground">감정</label>
                <Input
                  value={scene.emotion}
                  onChange={(e) => updateScene(index, "emotion", e.target.value)}
                  className="text-sm"
                  placeholder="감정"
                />
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Narration Script */}
      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold">나레이션 스크립트</h3>
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={8}
          className="text-sm leading-relaxed"
          placeholder="나레이션 스크립트를 입력하세요..."
        />
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} size="lg" className="w-full">
        저장
      </Button>
    </div>
  );
}
