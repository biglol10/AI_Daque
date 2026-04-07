// Design Ref: §3.2 — ChatInterface (인터뷰 채팅 UI)
// Plan SC: LangGraph 인터뷰 엔진 동작, 세션 저장/이어하기
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChatBubble } from "./ChatBubble";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { useInterviewStore, type ChatMessage } from "@/stores/interviewStore";
import { toast } from "sonner";

interface ChatInterfaceProps {
  projectId: string;
  era: string;
}

export function ChatInterface({ projectId, era }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    interviewId,
    messages,
    isLoading,
    isComplete,
    questionCount,
    depthScore,
    summary,
    setInterview,
    addMessage,
    setLoading,
    setComplete,
    updateProgress,
  } = useInterviewStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!interviewId) {
      startInterview();
    }
  }, []);

  async function startInterview() {
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", project_id: projectId, era }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "인터뷰 시작 실패");

      setInterview(data.interview_id, era);

      if (data.ai_message) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.ai_message,
          timestamp: new Date().toISOString(),
        });
      }

      if (data.suggested_questions) {
        setSuggestedQuestions(data.suggested_questions);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "인터뷰 시작에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !interviewId || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInput("");
    setSuggestedQuestions([]);
    setLoading(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          interview_id: interviewId,
          message: userMessage.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "메시지 전송 실패");

      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.ai_message,
        timestamp: new Date().toISOString(),
      });

      if (data.suggested_questions) {
        setSuggestedQuestions(data.suggested_questions);
      }

      if (data.question_count !== undefined) {
        updateProgress(data.question_count, data.depth_score || 0);
      }

      if (data.is_complete) {
        setComplete(data.summary || "");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "응답을 받지 못했습니다");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Progress Bar */}
      <div className="px-4 py-2 border-b space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{era} 인터뷰</span>
          <span>질문 {questionCount}/10 | 깊이 {Math.round(depthScore * 100)}%</span>
        </div>
        <Progress value={depthScore * 100} className="h-1.5" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm">
              <span className="animate-pulse">AI가 생각하고 있어요...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Summary (when complete) */}
      {isComplete && summary && (
        <div className="mx-4 mb-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
            {era} 인터뷰 완료!
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">{summary}</p>
        </div>
      )}

      {/* Suggested Questions */}
      {!isComplete && suggestedQuestions.length > 0 && (
        <SuggestedQuestions
          questions={suggestedQuestions}
          onSelect={(question) => setInput(question)}
          disabled={isLoading}
        />
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isComplete ? "인터뷰가 완료되었습니다" : "이야기를 들려주세요..."}
            disabled={isLoading || isComplete}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || isComplete}
            size="default"
          >
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}
