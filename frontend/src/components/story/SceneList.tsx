// Design Ref: §3.2 — SceneList (장면 목록)
"use client";

interface Scene {
  scene_id: string;
  title: string;
  description: string;
  duration_sec: number;
  emotion: string;
}

interface SceneListProps {
  scenes: Scene[];
}

export function SceneList({ scenes }: SceneListProps) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration_sec, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">장면 구성 ({scenes.length}개)</h3>
        <span className="text-xs text-muted-foreground">총 {totalDuration}초</span>
      </div>
      {scenes.map((scene, i) => (
        <div key={scene.scene_id} className="flex gap-3 p-3 border rounded-lg">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{scene.title}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted flex-shrink-0">{scene.emotion}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{scene.description}</p>
            <span className="text-[10px] text-muted-foreground">{scene.duration_sec}초</span>
          </div>
        </div>
      ))}
    </div>
  );
}
