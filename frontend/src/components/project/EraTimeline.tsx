"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EraCard, type EraInfo } from "./EraCard";

interface EraTimelineProps {
  projectId: string;
  birthYear: number;
}

function calculateEras(birthYear: number): { label: string; yearRange: string }[] {
  const currentYear = new Date().getFullYear();
  const eras: { label: string; yearRange: string }[] = [];

  // Eras start from 10대 (age 10-19)
  let decade = 10;
  while (true) {
    const startYear = birthYear + decade;
    const endYear = birthYear + decade + 9;

    // Only include eras the person has at least started living
    if (startYear > currentYear) break;

    eras.push({
      label: `${decade}대`,
      yearRange: `${startYear}-${Math.min(endYear, currentYear)}`,
    });

    decade += 10;
  }

  return eras;
}

export function EraTimeline({ projectId, birthYear }: EraTimelineProps) {
  const [eraInfos, setEraInfos] = useState<EraInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEraStatuses() {
      const baseEras = calculateEras(birthYear);

      // Fetch interviews for this project
      const { data: interviews } = await supabase
        .from("interviews")
        .select("era, status")
        .eq("project_id", projectId);

      // Fetch stories (template-based) for this project
      const { data: stories } = await supabase
        .from("stories")
        .select("era, source")
        .eq("project_id", projectId);

      const interviewMap = new Map<string, string>();
      (interviews ?? []).forEach((i) => {
        interviewMap.set(i.era, i.status);
      });

      const templateEras = new Set<string>();
      (stories ?? []).forEach((s) => {
        if (s.source === "template") {
          templateEras.add(s.era);
        }
      });

      const infos: EraInfo[] = baseEras.map((base) => {
        const interviewStatus = interviewMap.get(base.label);
        const hasInterview = interviewStatus === "completed";
        const hasTemplate = templateEras.has(base.label);

        let status: EraInfo["status"] = "not_started";
        if (hasInterview || hasTemplate) {
          status = "completed";
        } else if (interviewStatus === "in_progress") {
          status = "in_progress";
        }

        return {
          ...base,
          status,
          hasInterview,
          hasTemplate,
        };
      });

      setEraInfos(infos);
      setIsLoading(false);
    }

    loadEraStatuses();
  }, [projectId, birthYear]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[200px] h-[120px] rounded-xl bg-muted animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (eraInfos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        시대 정보를 불러올 수 없습니다. 프로필에서 출생연도를 설정해주세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">시대별 이야기</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {eraInfos.map((era) => (
          <EraCard key={era.label} era={era} projectId={projectId} />
        ))}
      </div>
    </div>
  );
}
