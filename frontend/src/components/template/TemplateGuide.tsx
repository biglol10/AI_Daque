// Design Ref: §3.2 — TemplateGuide (작성 가이드)
"use client";

import { Card } from "@/components/ui/card";

const ERA_GUIDES: Record<string, string[]> = {
  "10대": [
    "학교 생활은 어땠나요? 기억에 남는 선생님이나 친구가 있었나요?",
    "그 시절 유행했던 것들은 무엇이었나요? (음악, 드라마, 놀이 등)",
    "가장 기억에 남는 사건이나 경험이 있다면?",
    "그때의 꿈이나 장래희망은 무엇이었나요?",
  ],
  "20대": [
    "대학 생활이나 첫 직장은 어땠나요?",
    "연애나 우정에서 기억에 남는 에피소드가 있나요?",
    "그 시절 가장 힘들었던 일과 극복한 과정은?",
    "20대의 나에게 해주고 싶은 말이 있다면?",
  ],
  "30대": [
    "결혼이나 가정을 꾸리게 된 이야기가 있나요?",
    "커리어에서 중요한 전환점이 있었나요?",
    "부모가 되면서 느낀 감정이나 변화는?",
    "30대에 가장 자랑스러운 성취는 무엇인가요?",
  ],
  "40대": [
    "인생의 중반에서 느끼는 감정은 어떤가요?",
    "자녀 양육에서 기억에 남는 순간은?",
    "직장이나 사업에서의 성취와 도전은?",
    "이 시기에 깨달은 삶의 교훈이 있다면?",
  ],
  "50대": [
    "자녀의 독립을 지켜보며 느낀 감정은?",
    "은퇴를 준비하며 생각하는 것들은?",
    "건강이나 삶의 방식에서 달라진 점은?",
    "50대의 삶에서 가장 감사한 것은 무엇인가요?",
  ],
};

interface TemplateGuideProps {
  era: string;
}

export function TemplateGuide({ era }: TemplateGuideProps) {
  const guides = ERA_GUIDES[era] || ERA_GUIDES["10대"];

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
        작성 가이드
      </h3>
      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
        아래 질문들을 참고하여 자유롭게 작성해주세요.
      </p>
      <ul className="space-y-2">
        {guides.map((guide, i) => (
          <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex gap-2">
            <span className="text-blue-400">{i + 1}.</span>
            {guide}
          </li>
        ))}
      </ul>
    </Card>
  );
}
