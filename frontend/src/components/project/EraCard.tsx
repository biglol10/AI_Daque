"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, PenLine, Check } from "lucide-react";

export interface EraInfo {
  label: string;
  yearRange: string;
  status: "not_started" | "in_progress" | "completed";
  hasInterview: boolean;
  hasTemplate: boolean;
}

interface EraCardProps {
  era: EraInfo;
  projectId: string;
}

const STATUS_LABEL: Record<EraInfo["status"], string> = {
  not_started: "시작 전",
  in_progress: "진행 중",
  completed: "완료",
};

const STATUS_CLASS: Record<EraInfo["status"], string> = {
  not_started: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-blue-100 text-blue-600 border-blue-200",
  completed: "bg-green-100 text-green-600 border-green-200",
};

export function EraCard({ era, projectId }: EraCardProps) {
  const router = useRouter();

  return (
    <Card className="min-w-[200px] flex-shrink-0">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">{era.label}</h3>
            <p className="text-xs text-muted-foreground">{era.yearRange}</p>
          </div>
          <Badge className={STATUS_CLASS[era.status]}>
            {STATUS_LABEL[era.status]}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() =>
              router.push(
                `/projects/${projectId}/interview/${encodeURIComponent(era.label)}`
              )
            }
          >
            {era.hasInterview ? (
              <Check className="size-3.5 text-green-600" />
            ) : (
              <MessageSquare className="size-3.5" />
            )}
            인터뷰
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() =>
              router.push(
                `/projects/${projectId}/template/${encodeURIComponent(era.label)}`
              )
            }
          >
            {era.hasTemplate ? (
              <Check className="size-3.5 text-green-600" />
            ) : (
              <PenLine className="size-3.5" />
            )}
            직접 작성
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
