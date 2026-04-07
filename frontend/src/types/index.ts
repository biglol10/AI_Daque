// 공통 타입 정의 — 프로젝트 전체에서 사용하는 핵심 타입

export interface Profile {
  id: string;
  display_name: string;
  birth_year: number;
  gender: "male" | "female" | "other" | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  status: "draft" | "interviewing" | "generating" | "completed" | "failed";
  current_era: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  project_id: string;
  era: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  langgraph_thread_id: string | null;
  summary: string | null;
  key_events: KeyEvent[];
  emotions: string[];
  question_count: number;
  created_at: string;
}

export interface KeyEvent {
  year?: number;
  title: string;
  description: string;
  emotion: string;
}

export interface Story {
  id: string;
  project_id: string;
  era: string;
  narrative_script: string | null;
  scene_breakdown: Scene[];
  source_type: "interview" | "template";
  created_at: string;
}

export interface Scene {
  scene_id: string;
  title: string;
  description: string;
  duration_sec: number;
  emotion: string;
  background_prompt?: string;
}

export interface Character {
  id: string;
  project_id: string;
  era: string;
  face_upload_url: string | null;
  character_image_url: string | null;
  style: string;
  status: "pending" | "generating" | "completed" | "failed";
}

export interface Voice {
  id: string;
  project_id: string;
  voice_type: "sample" | "cloned";
  sample_voice_id: string | null;
  cloned_voice_id: string | null;
  consent_given: boolean;
}

export interface Documentary {
  id: string;
  project_id: string;
  era: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  status: "pending" | "generating" | "completed" | "failed";
}

export type Era = "10대" | "20대" | "30대" | "40대" | "50대" | "60대 이상";
