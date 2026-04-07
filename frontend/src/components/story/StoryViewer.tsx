// Design Ref: §3.2 — StoryViewer (구조화된 서사 뷰어)
"use client";

import { Card } from "@/components/ui/card";
import { SceneList } from "./SceneList";

interface StoryViewerProps {
  narrative: {
    title: string;
    synopsis: string;
    scenes: Array<{
      scene_id: string;
      title: string;
      description: string;
      duration_sec: number;
      emotion: string;
    }>;
  };
  narrationScript: string;
}

export function StoryViewer({ narrative, narrationScript }: StoryViewerProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-bold">{narrative.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{narrative.synopsis}</p>
      </Card>

      <Card className="p-4">
        <SceneList scenes={narrative.scenes} />
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">나레이션 스크립트</h3>
        <div className="bg-muted rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {narrationScript}
        </div>
      </Card>
    </div>
  );
}
