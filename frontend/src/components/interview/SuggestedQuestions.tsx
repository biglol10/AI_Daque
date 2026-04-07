// Design Ref: §3.2 — SuggestedQuestions (AI 추천 질문 칩)
"use client";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled: boolean;
}

export function SuggestedQuestions({
  questions,
  onSelect,
  disabled,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="px-4 py-2 border-t">
      <p className="text-xs text-muted-foreground mb-2">추천 질문</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {questions.map((question, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(question)}
            disabled={disabled}
            className="flex-shrink-0 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
