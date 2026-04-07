// Design Ref: §3.1 — 인터뷰 채팅 페이지
// Plan SC: LLM 적응형 AI 인터뷰 (FR-01)
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/interview/ChatInterface";
import { useInterviewStore } from "@/stores/interviewStore";

interface PageProps {
  params: Promise<{ projectId: string; era: string }>;
}

export default function InterviewPage({ params }: PageProps) {
  const { projectId, era } = use(params);
  const router = useRouter();
  const { isComplete, reset } = useInterviewStore();

  const eraLabel = decodeURIComponent(era);

  function handleBack() {
    reset();
    router.push(`/projects/${projectId}`);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← 돌아가기
          </Button>
          <h1 className="text-lg font-semibold">{eraLabel} 인터뷰</h1>
        </div>
        {isComplete && (
          <Button size="sm" onClick={handleBack}>
            완료
          </Button>
        )}
      </div>

      <ChatInterface projectId={projectId} era={eraLabel} />
    </div>
  );
}
