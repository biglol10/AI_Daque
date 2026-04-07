// Design Ref: §3.3 — interviewStore (Zustand)
"use client";

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface InterviewState {
  interviewId: string | null;
  era: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isComplete: boolean;
  questionCount: number;
  depthScore: number;
  summary: string | null;
}

interface InterviewActions {
  setInterview: (id: string, era: string) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setComplete: (summary: string) => void;
  updateProgress: (questionCount: number, depthScore: number) => void;
  reset: () => void;
}

const initialState: InterviewState = {
  interviewId: null,
  era: null,
  messages: [],
  isLoading: false,
  isComplete: false,
  questionCount: 0,
  depthScore: 0,
  summary: null,
};

export const useInterviewStore = create<InterviewState & InterviewActions>(
  (set) => ({
    ...initialState,
    setInterview: (id, era) => set({ interviewId: id, era, messages: [], isComplete: false, summary: null }),
    addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
    setLoading: (loading) => set({ isLoading: loading }),
    setComplete: (summary) => set({ isComplete: true, summary }),
    updateProgress: (questionCount, depthScore) => set({ questionCount, depthScore }),
    reset: () => set(initialState),
  })
);
