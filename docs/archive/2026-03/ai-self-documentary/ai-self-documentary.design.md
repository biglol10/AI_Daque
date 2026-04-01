# AI 셀프 다큐멘터리 Design Document

> **Feature**: AI 셀프 다큐멘터리 (AI Self-Documentary)
> **Date**: 2026-03-30
> **Plan Reference**: `docs/01-plan/features/ai-self-documentary.plan.md`
> **Architecture**: Option B — Clean Separation
> **Status**: Design Complete

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 전문 다큐 제작팀 없이 개인 인생 다큐멘터리를 만들 방법이 없음. "개인 서사 + 캐릭터 영상" 교차점이 비어 있음 |
| **WHO** | Beachhead: "효도 기록자" (30-50대). Secondary: 셀프 브랜더(20대), 인생 기념자(50대+) |
| **RISK** | (1) 캐릭터 유사성 (2) AI 비용 폭증 (3) 개인정보 신뢰 (4) 인터뷰 완료율 |
| **SUCCESS** | MVP 100명, 인터뷰 완료율 60%+, 다큐 생성 70%+, NPS 40+ |
| **SCOPE** | MVP → v1(바이럴) → v2(수익화) |

---

## 1. Overview

### 1.1 선택된 아키텍처: Option B — Clean Separation

Option B는 Next.js가 프론트엔드와 BFF(Backend for Frontend) 역할을 동시에 수행하며, Supabase와 직접 통신한다. FastAPI는 AI 파이프라인 전용 서버로서 LangGraph 인터뷰, 이미지 생성, TTS, 영상 합성만 담당한다. 두 서비스 간에는 REST API로 통신하며, 데이터 저장소는 Supabase로 단일화한다.

### 1.2 선택 근거

| 기준 | Option B 이점 |
|------|--------------|
| **관심사 분리** | AI 로직과 비즈니스 로직이 완전 분리되어 각 팀/서비스가 독립 배포 가능 |
| **Supabase 활용** | Next.js에서 Supabase JS SDK를 직접 사용하여 Auth, DB, Storage를 최적화 |
| **비용 효율** | AI 서버만 GPU/고사양 인스턴스 사용, 프론트 서버는 Vercel 무료 티어 활용 |
| **개발 속도** | Next.js API Routes로 BFF 패턴을 빠르게 구현, FastAPI는 AI에만 집중 |
| **스케일링** | AI 파이프라인만 독립 스케일링 가능 (영상 생성 병목 해소) |

### 1.3 시스템 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  React (Next.js 15 App Router) + Tailwind + shadcn/ui              │
│  Zustand (State) + React Query (Server State)                      │
└────────┬──────────────────────┬─────────────────────────────────────┘
         │ (1) Supabase SDK     │ (2) Next.js API Routes
         │     직접 호출         │     (BFF Proxy)
         ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────┐
│   Supabase       │   │   Next.js API Routes (BFF)       │
│   ├─ Auth        │   │   ├─ /api/interview/*             │
│   ├─ PostgreSQL  │   │   ├─ /api/generate/*              │
│   ├─ Storage     │   │   ├─ /api/voice/*                 │
│   └─ Realtime    │   │   └─ /api/documentary/*           │
└──────────────────┘   └──────────────┬───────────────────┘
                                      │ (3) REST API
                                      │ (Bearer Token 전달)
                                      ▼
                       ┌──────────────────────────────────┐
                       │   FastAPI (AI Backend)            │
                       │   ├─ LangGraph 인터뷰 엔진        │
                       │   │   ├─ StateGraph               │
                       │   │   ├─ Checkpointer (Redis)     │
                       │   │   └─ Guardrails               │
                       │   ├─ 캐릭터 생성 (DALL-E 3)        │
                       │   ├─ 배경 생성 (DALL-E 3 + 시대DB) │
                       │   ├─ TTS (ElevenLabs)             │
                       │   └─ 슬라이드쇼 합성 (FFmpeg)      │
                       └──────────────┬───────────────────┘
                                      │ (4) 결과 저장
                                      ▼
                       ┌──────────────────────────────────┐
                       │   Supabase Storage                │
                       │   ├─ faces/ (업로드 사진)          │
                       │   ├─ characters/ (생성 캐릭터)     │
                       │   ├─ backgrounds/ (시대 배경)      │
                       │   ├─ voices/ (TTS 음성)           │
                       │   └─ documentaries/ (최종 MP4)    │
                       └──────────────────────────────────┘
```

**데이터 흐름 요약**:
1. 클라이언트 → Supabase: 인증, 프로필 CRUD, 프로젝트 관리 (직접 SDK 호출)
2. 클라이언트 → Next.js BFF: AI 관련 요청 프록시 (인터뷰, 생성, 내보내기)
3. Next.js BFF → FastAPI: AI 파이프라인 호출 (JWT 토큰 전달)
4. FastAPI → Supabase Storage: 생성된 에셋 저장 (Service Role Key 사용)

---

## 2. Data Model

### 2.1 Supabase Tables

#### `profiles` (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,               -- 생년 (시기 구분 계산용)
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `projects` (다큐 프로젝트)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '나의 다큐멘터리',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'interviewing', 'generating', 'completed', 'failed')),
  current_era TEXT,                           -- 현재 진행 중인 시기 (예: '20대')
  settings JSONB DEFAULT '{}',               -- 프로젝트 설정 (음성 선택, 스타일 등)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `interviews` (인터뷰 세션)
```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,                          -- '10대', '20대', '30대' 등
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  langgraph_thread_id TEXT,                  -- LangGraph checkpointer thread ID
  messages JSONB DEFAULT '[]',               -- 대화 히스토리 (백업)
  summary TEXT,                              -- AI 생성 요약
  key_events JSONB DEFAULT '[]',             -- 추출된 핵심 사건
  emotions JSONB DEFAULT '[]',               -- 감정 태그
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `stories` (구조화된 서사)
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'interview'
    CHECK (source IN ('interview', 'template', 'manual')),
  narrative_text TEXT NOT NULL,              -- 구조화된 서사 텍스트
  scene_breakdown JSONB DEFAULT '[]',        -- 장면 분해 [{scene_id, description, duration_sec}]
  narration_script TEXT,                     -- TTS용 내레이션 스크립트
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `characters` (AI 캐릭터)
```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,
  face_upload_url TEXT,                      -- 원본 얼굴 사진 URL
  character_image_url TEXT,                  -- 생성된 캐릭터 이미지 URL
  style TEXT DEFAULT 'cartoon',              -- 캐릭터 스타일
  generation_prompt TEXT,                    -- 사용된 프롬프트
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `backgrounds` (시대 배경)
```sql
CREATE TABLE backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,
  scene_id TEXT,                             -- stories.scene_breakdown 참조
  image_url TEXT,                            -- 생성된 배경 이미지 URL
  era_context JSONB,                         -- 시대 DB에서 가져온 컨텍스트
  generation_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `voices` (보이스)
```sql
CREATE TABLE voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  voice_type TEXT NOT NULL DEFAULT 'sample'
    CHECK (voice_type IN ('sample', 'cloned')),
  sample_voice_id TEXT,                      -- ElevenLabs 기본 보이스 ID
  cloned_voice_id TEXT,                      -- ElevenLabs 클론 보이스 ID
  upload_url TEXT,                           -- 클론용 음성 파일 URL
  consent_given BOOLEAN DEFAULT FALSE,       -- 보이스 클로닝 동의
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `documentaries` (최종 다큐멘터리)
```sql
CREATE TABLE documentaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'composing', 'completed', 'failed')),
  video_url TEXT,                            -- 최종 MP4 URL
  duration_sec INTEGER,
  resolution TEXT DEFAULT '1080p',
  file_size_mb NUMERIC,
  composition_log JSONB DEFAULT '{}',        -- FFmpeg 합성 로그
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

#### `era_references` (시대 참조 DB - 읽기 전용)
```sql
CREATE TABLE era_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  era TEXT NOT NULL,                          -- '1960s', '1970s', '1980s', ...
  decade_start INTEGER NOT NULL,
  decade_end INTEGER NOT NULL,
  cultural_keywords JSONB NOT NULL,           -- ["올림픽", "민주화", ...]
  visual_elements JSONB NOT NULL,             -- ["교복", "골목", "다방", ...]
  music_references JSONB DEFAULT '[]',
  historical_events JSONB NOT NULL,           -- [{year, event, description}]
  image_prompt_template TEXT NOT NULL,         -- DALL-E 프롬프트 템플릿
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Entity Relationship Diagram

```
┌──────────┐
│  auth.   │
│  users   │
└────┬─────┘
     │ 1:1
     ▼
┌──────────┐     1:N     ┌──────────┐
│ profiles ├────────────►│ projects │
└──────────┘             └────┬─────┘
                              │
              ┌───────┬───────┼───────┬──────────┐
              │ 1:N   │ 1:N   │ 1:N   │ 1:N      │ 1:1
              ▼       ▼       ▼       ▼          ▼
        ┌─────────┐ ┌──────┐ ┌─────────┐ ┌───────┐ ┌──────────────┐
        │interviews│ │stories│ │characters│ │voices │ │documentaries │
        └─────────┘ └──────┘ └─────────┘ └───────┘ └──────────────┘
                                  │
                                  │ N:1 (era 기반 매핑)
                                  ▼
                           ┌────────────┐
                           │ backgrounds│
                           └────────────┘

        ┌────────────────┐
        │ era_references │  (독립 참조 테이블, 읽기 전용)
        └────────────────┘
```

**관계 설명**:
- `profiles` 1:N `projects`: 한 사용자가 여러 다큐 프로젝트 생성 가능
- `projects` 1:N `interviews`: 프로젝트당 시기별 인터뷰 (10대, 20대, ...)
- `projects` 1:N `stories`: 프로젝트당 시기별 서사
- `projects` 1:N `characters`: 프로젝트당 시기별 캐릭터 이미지
- `projects` 1:N `backgrounds`: 프로젝트당 장면별 배경
- `projects` 1:1 `voices`: 프로젝트당 하나의 보이스 설정
- `projects` 1:1 `documentaries`: 프로젝트당 하나의 최종 영상

### 2.3 Key Types (TypeScript Interfaces)

```typescript
// ===== Enums =====
type ProjectStatus = 'draft' | 'interviewing' | 'generating' | 'completed' | 'failed';
type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
type StorySource = 'interview' | 'template' | 'manual';
type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';
type VoiceType = 'sample' | 'cloned';
type Era = '10대' | '20대' | '30대' | '40대' | '50대' | '60대' | '70대' | '80대';

// ===== Core Types =====
interface Profile {
  id: string;
  displayName: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  userId: string;
  title: string;
  status: ProjectStatus;
  currentEra: Era | null;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

interface ProjectSettings {
  voiceId: string | null;
  characterStyle: string;
  resolution: '720p' | '1080p';
}

interface Interview {
  id: string;
  projectId: string;
  era: Era;
  status: InterviewStatus;
  langgraphThreadId: string | null;
  messages: InterviewMessage[];
  summary: string | null;
  keyEvents: KeyEvent[];
  emotions: string[];
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface KeyEvent {
  year: number | null;
  title: string;
  description: string;
  emotion: string;
}

interface Story {
  id: string;
  projectId: string;
  era: Era;
  source: StorySource;
  narrativeText: string;
  sceneBreakdown: SceneBreakdown[];
  narrationScript: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SceneBreakdown {
  sceneId: string;
  description: string;
  durationSec: number;
  characterNeeded: boolean;
  backgroundDescription: string;
}

interface Character {
  id: string;
  projectId: string;
  era: Era;
  faceUploadUrl: string | null;
  characterImageUrl: string | null;
  style: string;
  generationPrompt: string | null;
  status: GenerationStatus;
  createdAt: string;
}

interface Background {
  id: string;
  projectId: string;
  era: Era;
  sceneId: string | null;
  imageUrl: string | null;
  eraContext: EraContext | null;
  generationPrompt: string | null;
  status: GenerationStatus;
  createdAt: string;
}

interface Voice {
  id: string;
  projectId: string;
  voiceType: VoiceType;
  sampleVoiceId: string | null;
  clonedVoiceId: string | null;
  uploadUrl: string | null;
  consentGiven: boolean;
  createdAt: string;
}

interface Documentary {
  id: string;
  projectId: string;
  status: GenerationStatus | 'composing';
  videoUrl: string | null;
  durationSec: number | null;
  resolution: string;
  fileSizeMb: number | null;
  compositionLog: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

interface EraContext {
  era: string;
  culturalKeywords: string[];
  visualElements: string[];
  historicalEvents: { year: number; event: string; description: string }[];
}

// ===== API Types =====
interface InterviewStartRequest {
  projectId: string;
  era: Era;
}

interface InterviewMessageRequest {
  interviewId: string;
  message: string;
}

interface InterviewResponse {
  message: string;
  isComplete: boolean;
  progress: number;            // 0-100
  suggestedQuestions: string[];
}

interface GenerateCharacterRequest {
  projectId: string;
  era: Era;
  faceImageUrl: string;
  style: string;
}

interface GenerateBackgroundRequest {
  projectId: string;
  era: Era;
  sceneId: string;
  sceneDescription: string;
}

interface GenerateTTSRequest {
  projectId: string;
  narrationScript: string;
  voiceId: string;
}

interface ComposeDocumentaryRequest {
  projectId: string;
}

interface GenerationStatusResponse {
  status: GenerationStatus;
  progress: number;
  resultUrl: string | null;
  error: string | null;
}
```

---

## 3. Frontend Architecture (Next.js)

### 3.1 Page Structure (App Router)

```
app/
├─ layout.tsx                    # Root layout (Providers: Supabase, QueryClient, Zustand)
├─ page.tsx                      # 랜딩 페이지
├─ (auth)/
│   ├─ login/page.tsx            # 로그인 (카카오 + 이메일)
│   ├─ signup/page.tsx           # 회원가입
│   └─ callback/page.tsx         # OAuth 콜백 (카카오)
├─ (main)/
│   ├─ layout.tsx                # 인증된 사용자 레이아웃 (사이드바, 헤더)
│   ├─ dashboard/page.tsx        # 대시보드 (프로젝트 목록)
│   ├─ profile/page.tsx          # 프로필 설정 (생년, 이름 등)
│   └─ projects/
│       ├─ new/page.tsx          # 새 프로젝트 생성
│       └─ [projectId]/
│           ├─ page.tsx          # 프로젝트 오버뷰 (시기별 진행률)
│           ├─ interview/
│           │   └─ [era]/page.tsx  # 인터뷰 채팅 화면
│           ├─ template/
│           │   └─ [era]/page.tsx  # 템플릿 입력 화면 (인터뷰 대안)
│           ├─ story/
│           │   └─ [era]/page.tsx  # 구조화된 서사 확인/편집
│           ├─ character/page.tsx   # 캐릭터 생성 (얼굴 업로드 + 결과)
│           ├─ voice/page.tsx      # 보이스 설정 (샘플 선택 / 클론)
│           ├─ generate/page.tsx   # 다큐 생성 진행 화면
│           └─ preview/page.tsx    # 완성된 다큐 미리보기 + 다운로드
└─ api/                           # BFF API Routes (Section 4.1 참조)
```

### 3.2 Component Tree (주요 컴포넌트)

```
components/
├─ ui/                           # shadcn/ui 기반 공통 컴포넌트
│   ├─ Button, Input, Card, Dialog, Progress, Tabs, ...
│   └─ (shadcn/ui CLI로 추가)
├─ layout/
│   ├─ AppHeader.tsx             # 상단 헤더 (로고, 사용자 메뉴)
│   ├─ AppSidebar.tsx            # 사이드바 (프로젝트 네비게이션)
│   └─ AuthGuard.tsx             # 인증 체크 래퍼
├─ auth/
│   ├─ LoginForm.tsx             # 이메일 로그인 폼
│   ├─ KakaoLoginButton.tsx      # 카카오 OAuth 버튼
│   └─ SignupForm.tsx            # 회원가입 폼
├─ profile/
│   └─ ProfileForm.tsx           # 프로필 입력 폼 (이름, 생년, 성별)
├─ project/
│   ├─ ProjectCard.tsx           # 대시보드 프로젝트 카드
│   ├─ ProjectCreateForm.tsx     # 프로젝트 생성 폼
│   ├─ EraTimeline.tsx           # 시기별 타임라인 진행률 표시
│   └─ EraCard.tsx               # 개별 시기 카드 (인터뷰/생성 상태)
├─ interview/
│   ├─ ChatInterface.tsx         # 인터뷰 채팅 UI
│   ├─ ChatBubble.tsx            # 메시지 버블
│   ├─ SuggestedQuestions.tsx    # AI 추천 질문 칩
│   ├─ InterviewProgress.tsx     # 인터뷰 진행률 바
│   └─ InterviewComplete.tsx     # 인터뷰 완료 요약 카드
├─ template/
│   ├─ TemplateForm.tsx          # 서사 템플릿 입력 폼
│   ├─ TemplateGuide.tsx         # 작성 가이드
│   └─ TemplatePreview.tsx       # 입력 미리보기
├─ story/
│   ├─ StoryViewer.tsx           # 구조화된 서사 뷰어
│   ├─ SceneList.tsx             # 장면 목록
│   └─ StoryEditor.tsx           # 서사 수정 에디터
├─ character/
│   ├─ FaceUploader.tsx          # 얼굴 사진 업로드
│   ├─ CharacterPreview.tsx      # 생성된 캐릭터 미리보기
│   └─ CharacterStyleSelector.tsx # 캐릭터 스타일 선택
├─ voice/
│   ├─ VoiceSamplePlayer.tsx     # 샘플 보이스 재생
│   ├─ VoiceCloneUploader.tsx    # 클론용 음성 업로드
│   ├─ VoiceConsentDialog.tsx    # 보이스 클로닝 동의 다이얼로그
│   └─ VoiceSelector.tsx         # 보이스 선택 UI
├─ generation/
│   ├─ GenerationProgress.tsx    # 생성 진행 상황 (단계별)
│   ├─ GenerationStepCard.tsx    # 개별 생성 단계 카드
│   └─ GenerationError.tsx       # 생성 실패 에러 UI
└─ documentary/
    ├─ VideoPlayer.tsx           # 영상 플레이어
    ├─ DownloadButton.tsx        # MP4 다운로드 버튼
    └─ ShareDialog.tsx           # 공유 다이얼로그
```

### 3.3 State Management (Zustand Stores)

```typescript
// stores/authStore.ts
interface AuthStore {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  logout: () => void;
}

// stores/projectStore.ts
interface ProjectStore {
  currentProject: Project | null;
  currentEra: Era | null;
  setCurrentProject: (project: Project | null) => void;
  setCurrentEra: (era: Era | null) => void;
  resetProject: () => void;
}

// stores/interviewStore.ts
interface InterviewStore {
  messages: InterviewMessage[];
  isStreaming: boolean;
  progress: number;
  suggestedQuestions: string[];
  addMessage: (message: InterviewMessage) => void;
  setStreaming: (streaming: boolean) => void;
  setProgress: (progress: number) => void;
  setSuggestedQuestions: (questions: string[]) => void;
  resetInterview: () => void;
}

// stores/generationStore.ts
interface GenerationStore {
  characterStatus: Record<string, GenerationStatus>;  // era -> status
  backgroundStatus: Record<string, GenerationStatus>;
  ttsStatus: GenerationStatus | null;
  documentaryStatus: GenerationStatus | null;
  overallProgress: number;
  setCharacterStatus: (era: string, status: GenerationStatus) => void;
  setBackgroundStatus: (era: string, status: GenerationStatus) => void;
  setTtsStatus: (status: GenerationStatus) => void;
  setDocumentaryStatus: (status: GenerationStatus) => void;
  calculateOverallProgress: () => void;
}
```

**Zustand 선택 근거**:
- 보일러플레이트 최소화 (Redux 대비 70% 적은 코드)
- React Query와 역할 분담: Zustand = 클라이언트 상태, React Query = 서버 상태
- DevTools 지원, 미들웨어 확장 가능

### 3.4 API Client (React Query Hooks)

```typescript
// lib/supabase.ts - Supabase 클라이언트 설정
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// hooks/useProjects.ts - Supabase 직접 호출
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ title: input.title })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// hooks/useInterview.ts - FastAPI 프록시 호출
export function useStartInterview() {
  return useMutation({
    mutationFn: async (input: InterviewStartRequest) => {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Interview>;
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (input: InterviewMessageRequest) => {
      const res = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<InterviewResponse>;
    },
  });
}

// hooks/useGeneration.ts - 생성 파이프라인 호출
export function useGenerateCharacter() {
  return useMutation({
    mutationFn: async (input: GenerateCharacterRequest) => {
      const res = await fetch('/api/generate/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GenerationStatusResponse>;
    },
  });
}

export function useGenerationStatus(taskId: string | null) {
  return useQuery({
    queryKey: ['generation-status', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/generate/status/${taskId}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GenerationStatusResponse>;
    },
    enabled: !!taskId,
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 3000 : false,
  });
}

export function useComposeDocumentary() {
  return useMutation({
    mutationFn: async (input: ComposeDocumentaryRequest) => {
      const res = await fetch('/api/documentary/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GenerationStatusResponse>;
    },
  });
}
```

---

## 4. API Design

### 4.1 Next.js API Routes (BFF)

BFF 레이어의 역할:
1. 클라이언트의 Supabase JWT를 검증하고 FastAPI로 전달
2. FastAPI 응답을 클라이언트에 맞게 변환
3. 요청 유효성 검사 (Zod)

```typescript
// app/api/interview/start/route.ts (예시)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/interview/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
```

### 4.2 FastAPI Endpoints (AI Pipeline)

```python
# FastAPI 라우터 구조
app/
├─ main.py
├─ api/
│   └─ v1/
│       ├─ router.py
│       ├─ interview.py      # /api/v1/interview/*
│       ├─ generate.py       # /api/v1/generate/*
│       ├─ voice.py          # /api/v1/voice/*
│       └─ documentary.py    # /api/v1/documentary/*
├─ core/
│   ├─ config.py             # 환경 변수 설정
│   ├─ auth.py               # Supabase JWT 검증
│   └─ supabase.py           # Supabase Admin 클라이언트
├─ services/
│   ├─ interview_engine.py   # LangGraph 인터뷰 엔진
│   ├─ narrative_engine.py   # 서사 구조화 엔진
│   ├─ character_service.py  # 캐릭터 생성
│   ├─ background_service.py # 배경 생성
│   ├─ voice_service.py      # TTS/클로닝
│   └─ composition_service.py # FFmpeg 합성
├─ models/
│   ├─ schemas.py            # Pydantic 요청/응답 스키마
│   └─ state.py              # LangGraph 상태 스키마
├─ guardrails/
│   ├─ content_filter.py     # 민감 콘텐츠 필터
│   ├─ pii_detector.py       # PII 탐지
│   ├─ nsfw_filter.py        # NSFW 필터
│   ├─ voice_consent.py      # 보이스 동의 검증
│   └─ cost_limiter.py       # AI 비용 제한
└─ data/
    └─ era_db.py             # 한국 시대 참조 데이터
```

### 4.3 API Contract Table

#### Interview API

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| `POST` | `/api/v1/interview/start` | `{ project_id, era }` | `{ interview_id, thread_id, greeting_message }` | Bearer JWT |
| `POST` | `/api/v1/interview/message` | `{ interview_id, message }` | `{ message, is_complete, progress, suggested_questions[] }` | Bearer JWT |
| `GET` | `/api/v1/interview/{interview_id}/status` | - | `{ status, progress, question_count, summary? }` | Bearer JWT |
| `POST` | `/api/v1/interview/{interview_id}/complete` | - | `{ summary, key_events[], emotions[] }` | Bearer JWT |

#### Narrative API

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| `POST` | `/api/v1/narrative/structure` | `{ project_id, era, source_text }` | `{ story_id, narrative_text, scene_breakdown[] }` | Bearer JWT |
| `POST` | `/api/v1/narrative/script` | `{ story_id }` | `{ narration_script, estimated_duration_sec }` | Bearer JWT |

#### Generation API

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| `POST` | `/api/v1/generate/character` | `{ project_id, era, face_image_url, style }` | `{ task_id, status }` | Bearer JWT |
| `POST` | `/api/v1/generate/background` | `{ project_id, era, scene_id, scene_description }` | `{ task_id, status }` | Bearer JWT |
| `GET` | `/api/v1/generate/status/{task_id}` | - | `{ status, progress, result_url?, error? }` | Bearer JWT |

#### Voice API

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| `GET` | `/api/v1/voice/samples` | - | `{ voices: [{ id, name, preview_url }] }` | Bearer JWT |
| `POST` | `/api/v1/voice/clone` | `{ project_id, audio_url, consent }` | `{ voice_id, status }` | Bearer JWT |
| `POST` | `/api/v1/voice/tts` | `{ project_id, narration_script, voice_id }` | `{ task_id, status }` | Bearer JWT |

#### Documentary API

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| `POST` | `/api/v1/documentary/compose` | `{ project_id }` | `{ task_id, status }` | Bearer JWT |
| `GET` | `/api/v1/documentary/status/{task_id}` | - | `{ status, progress, video_url?, duration_sec?, error? }` | Bearer JWT |
| `GET` | `/api/v1/documentary/{project_id}/download` | - | `302 Redirect → Supabase Storage signed URL` | Bearer JWT |

---

## 5. AI Pipeline Architecture (FastAPI)

### 5.1 LangGraph Interview Engine

#### StateGraph 다이어그램

```
                    ┌──────────────┐
                    │   START      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  greeting    │  "안녕하세요, {era} 시절 이야기를 들려주세요"
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
              ┌────►│ ask_question │◄────────────────┐
              │     └──────┬───────┘                  │
              │            │                          │
              │            ▼                          │
              │     ┌──────────────┐                  │
              │     │ wait_response│  (사용자 입력 대기) │
              │     └──────┬───────┘                  │
              │            │                          │
              │            ▼                          │
              │     ┌──────────────┐                  │
              │     │  guardrail   │  PII/민감 콘텐츠  │
              │     └──────┬───────┘                  │
              │            │                          │
              │       ┌────┴────┐                     │
              │       ▼         ▼                     │
              │  [통과]     [차단]                     │
              │       │    ┌──────────┐               │
              │       │    │ redirect │ 안전한 주제로   │
              │       │    └────┬─────┘               │
              │       │         │                     │
              │       ▼         ▼                     │
              │     ┌──────────────┐                  │
              │     │  analyze     │  응답 분석 + 추출  │
              │     └──────┬───────┘                  │
              │            │                          │
              │       ┌────┴────┐                     │
              │       ▼         ▼                     │
              │  [충분]     [부족]──────────────────────┘
              │       │
              │       ▼
              │  ┌──────────────┐    ┌────┐
              │  │ should_deepen│───►│ NO │──► summarize
              │  └──────┬───────┘    └────┘
              │         │
              │       [YES]
              │         │
              └─────────┘ (더 깊은 질문)

                    ┌──────────────┐
                    │  summarize   │  서사 요약 + 핵심 사건 추출
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │     END      │
                    └──────────────┘
```

**전환 조건**:
- `ask_question → wait_response`: 항상 (사용자 입력 필요)
- `wait_response → guardrail`: 사용자 메시지 수신 시
- `guardrail → analyze`: 콘텐츠 안전 통과
- `guardrail → redirect`: PII/민감 콘텐츠 감지
- `analyze → ask_question`: 수집된 정보 부족 (key_events < 3 또는 depth_score < 0.6)
- `analyze → should_deepen`: 기본 정보 충분
- `should_deepen → ask_question`: 감정/디테일 심화 필요 (총 질문 < 8)
- `should_deepen → summarize`: 충분한 깊이 도달 또는 질문 8개 초과
- `redirect → ask_question`: 안전한 주제로 전환 후 계속

#### State Schema

```python
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages

class InterviewState(TypedDict):
    # LangGraph 메시지 히스토리
    messages: Annotated[list, add_messages]

    # 인터뷰 메타데이터
    project_id: str
    user_id: str
    era: str                                # '10대', '20대', ...
    birth_year: int

    # 진행 상태
    question_count: int                     # 현재까지 질문 수
    max_questions: int                      # 최대 질문 수 (기본 10)
    depth_score: float                      # 0.0 ~ 1.0 (서사 깊이)
    is_complete: bool

    # 추출된 정보
    key_events: list[dict]                  # [{year, title, description, emotion}]
    emotions: list[str]                     # 감정 태그 목록
    topics_covered: list[str]               # 다룬 주제 목록
    topics_remaining: list[str]             # 남은 주제 목록

    # 가드레일
    pii_detected: bool
    redirect_count: int                     # 리다이렉트 횟수
    last_guardrail_action: str | None       # 'pass' | 'redirect' | 'block'

    # 결과
    summary: str | None
    suggested_questions: list[str]          # 다음 추천 질문
```

#### Checkpointer 설정

```python
from langgraph.checkpoint.postgres import PostgresSaver

# Supabase PostgreSQL을 Checkpointer 저장소로 활용
checkpointer = PostgresSaver.from_conn_string(
    conn_string=settings.SUPABASE_DB_URL,
    table_name="langgraph_checkpoints"
)

# 인터뷰 세션 복원
config = {"configurable": {"thread_id": interview.langgraph_thread_id}}
graph = interview_graph.compile(checkpointer=checkpointer)

# 메시지 전송 및 상태 업데이트
result = await graph.ainvoke(
    {"messages": [HumanMessage(content=user_message)]},
    config=config
)
```

**Checkpointer 활용**:
- 사용자가 브라우저를 닫아도 인터뷰 상태 유지
- 각 인터뷰 세션은 고유 `thread_id`로 식별
- PostgreSQL (Supabase DB)을 직접 활용하여 추가 인프라 불필요

### 5.2 Generation Pipeline (DAG)

#### 전체 생성 파이프라인 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    Generation Pipeline (DAG)                     │
│                                                                  │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ Stories │───►│ Narration   │───►│ TTS Generation          │  │
│  │ (입력)   │    │ Script 생성  │    │ (ElevenLabs)            │  │
│  └─────────┘    └─────────────┘    └───────────┬─────────────┘  │
│                                                 │                │
│  ┌─────────┐    ┌─────────────┐                │                │
│  │ Face    │───►│ Character   │                │                │
│  │ Photo   │    │ Gen (DALL-E)│                │                │
│  └─────────┘    └──────┬──────┘                │                │
│                         │                       │                │
│  ┌─────────┐    ┌──────┴──────┐                │                │
│  │ Scene   │───►│ Background  │                │                │
│  │ Break-  │    │ Gen (DALL-E)│                │                │
│  │ down    │    └──────┬──────┘                │                │
│  └─────────┘           │                       │                │
│                         │                       │                │
│                         ▼                       ▼                │
│                  ┌─────────────────────────────────┐            │
│                  │   FFmpeg Slideshow Composition   │            │
│                  │   (이미지 + TTS → MP4)            │            │
│                  └──────────────┬──────────────────┘            │
│                                 │                                │
│                                 ▼                                │
│                          ┌────────────┐                         │
│                          │ Upload MP4 │                         │
│                          │ (Supabase) │                         │
│                          └────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

**병렬 처리 가능 구간**:
- Character Generation과 Background Generation은 독립적으로 병렬 실행 가능
- Narration Script 생성 → TTS 생성은 순차 (의존성)
- FFmpeg 합성은 모든 에셋 완료 후 실행

#### Character Generation Flow

```python
async def generate_character(
    project_id: str,
    era: str,
    face_image_url: str,
    style: str = "cartoon"
) -> str:
    """얼굴 사진 → AI 캐릭터 이미지 생성"""

    # 1. 얼굴 사진 다운로드 및 분석
    face_image = await download_from_supabase(face_image_url)
    face_description = await analyze_face(face_image)  # GPT-4o Vision

    # 2. 시기별 외형 프롬프트 구성
    era_appearance = get_era_appearance(era)  # 시기별 헤어/패션 참조
    prompt = build_character_prompt(
        face_description=face_description,
        style=style,
        era=era,
        era_appearance=era_appearance
    )

    # 3. DALL-E 3 캐릭터 생성
    # 가드레일: NSFW 필터 적용
    filtered_prompt = await nsfw_filter.check(prompt)
    image_url = await openai_client.images.generate(
        model="dall-e-3",
        prompt=filtered_prompt,
        size="1024x1024",
        quality="hd",
        n=1
    )

    # 4. Supabase Storage 업로드
    stored_url = await upload_to_supabase(
        bucket="characters",
        path=f"{project_id}/{era}/character.png",
        data=image_url
    )

    # 5. DB 업데이트
    await update_character_record(project_id, era, stored_url, prompt)

    return stored_url
```

#### Background Generation Flow (시대 DB 활용)

```python
async def generate_background(
    project_id: str,
    era: str,
    scene_id: str,
    scene_description: str
) -> str:
    """장면 설명 + 시대 DB → 시대 배경 이미지 생성"""

    # 1. 시대 DB에서 컨텍스트 조회
    era_context = await get_era_context(era, birth_year)
    # era_context 예시:
    # {
    #   "era": "1990s",
    #   "cultural_keywords": ["PC통신", "HOT", "IMF"],
    #   "visual_elements": ["교복", "오락실", "삐삐"],
    #   "historical_events": [{"year": 1997, "event": "IMF 외환위기"}]
    # }

    # 2. 배경 프롬프트 구성
    prompt = build_background_prompt(
        scene_description=scene_description,
        era_context=era_context,
        template=era_context.get("image_prompt_template")
    )
    # 예시 프롬프트: "1990년대 한국 고등학교 교실, 나무 책상, 칠판,
    #               창밖으로 보이는 아파트 단지, 따뜻한 오후 햇살,
    #               카툰 스타일 일러스트레이션"

    # 3. DALL-E 3 배경 생성
    filtered_prompt = await nsfw_filter.check(prompt)
    image_url = await openai_client.images.generate(
        model="dall-e-3",
        prompt=filtered_prompt,
        size="1792x1024",  # 와이드 배경
        quality="hd",
        n=1
    )

    # 4. Supabase Storage 업로드
    stored_url = await upload_to_supabase(
        bucket="backgrounds",
        path=f"{project_id}/{era}/{scene_id}.png",
        data=image_url
    )

    # 5. DB 업데이트
    await update_background_record(project_id, era, scene_id, stored_url, prompt)

    return stored_url
```

#### TTS Generation Flow

```python
async def generate_tts(
    project_id: str,
    narration_script: str,
    voice_id: str
) -> str:
    """내레이션 스크립트 → TTS 음성 생성 (ElevenLabs)"""

    # 1. 보이스 동의 검증 (가드레일)
    voice_record = await get_voice_record(project_id)
    if voice_record.voice_type == "cloned" and not voice_record.consent_given:
        raise GuardrailError("보이스 클로닝 동의가 필요합니다.")

    # 2. 스크립트 전처리
    #    - 장면 전환 마커 삽입 (무음 구간)
    #    - 감정 태그를 SSML로 변환
    processed_script = preprocess_narration(narration_script)

    # 3. ElevenLabs TTS 호출
    audio = await elevenlabs_client.text_to_speech.convert(
        voice_id=voice_id,
        text=processed_script,
        model_id="eleven_multilingual_v2",
        voice_settings={
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
        }
    )

    # 4. 오디오 파일 저장
    stored_url = await upload_to_supabase(
        bucket="voices",
        path=f"{project_id}/narration.mp3",
        data=audio
    )

    return stored_url
```

#### Slideshow Composition (FFmpeg)

```python
import ffmpeg

async def compose_documentary(project_id: str) -> str:
    """모든 에셋을 결합하여 최종 MP4 슬라이드쇼 생성"""

    # 1. 에셋 수집
    stories = await get_stories(project_id)
    characters = await get_characters(project_id)
    backgrounds = await get_backgrounds(project_id)
    narration_url = await get_narration_audio(project_id)

    # 2. 로컬 임시 디렉토리에 에셋 다운로드
    work_dir = f"/tmp/documentary/{project_id}"
    os.makedirs(work_dir, exist_ok=True)

    audio_path = await download_file(narration_url, f"{work_dir}/narration.mp3")
    audio_duration = get_audio_duration(audio_path)

    # 3. 장면별 이미지 시퀀스 구성
    scene_list = []
    for story in stories:
        for scene in story.scene_breakdown:
            character_img = find_character_for_era(characters, story.era)
            background_img = find_background_for_scene(backgrounds, scene.scene_id)

            scene_list.append({
                "character": await download_file(character_img, f"{work_dir}/char_{scene.scene_id}.png"),
                "background": await download_file(background_img, f"{work_dir}/bg_{scene.scene_id}.png"),
                "duration": scene.duration_sec,
                "description": scene.description,
            })

    # 4. FFmpeg 합성
    #    - 배경 이미지 위에 캐릭터 오버레이
    #    - 자막(scene description) 추가
    #    - 장면 간 crossfade 전환 (0.5초)
    #    - 나레이션 오디오 합성
    concat_filter = build_ffmpeg_concat_filter(scene_list)

    output_path = f"{work_dir}/documentary.mp4"

    stream = ffmpeg.input(audio_path)
    video_stream = build_video_stream(scene_list, work_dir)

    ffmpeg.output(
        video_stream,
        stream.audio,
        output_path,
        vcodec='libx264',
        acodec='aac',
        pix_fmt='yuv420p',
        r=30,
        **{'b:v': '2M', 'b:a': '192k'}
    ).overwrite_output().run()

    # 5. 결과 업로드
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    stored_url = await upload_to_supabase(
        bucket="documentaries",
        path=f"{project_id}/documentary.mp4",
        file_path=output_path
    )

    # 6. DB 업데이트
    await update_documentary_record(
        project_id=project_id,
        video_url=stored_url,
        duration_sec=audio_duration,
        file_size_mb=file_size
    )

    # 7. 임시 파일 정리
    shutil.rmtree(work_dir, ignore_errors=True)

    return stored_url


def build_video_stream(scene_list: list, work_dir: str):
    """장면별 이미지를 FFmpeg 비디오 스트림으로 합성"""
    inputs = []
    for i, scene in enumerate(scene_list):
        # 배경 위에 캐릭터 오버레이
        bg = ffmpeg.input(scene["background"], loop=1, t=scene["duration"])
        char_img = ffmpeg.input(scene["character"], loop=1, t=scene["duration"])

        # 캐릭터를 배경 중앙 하단에 오버레이
        overlaid = ffmpeg.filter([bg, char_img], 'overlay',
                                  x='(W-w)/2', y='H-h-50')

        # 자막 추가
        with_subtitle = overlaid.filter(
            'drawtext',
            text=scene["description"][:50],
            fontsize=24,
            fontcolor='white',
            borderw=2,
            bordercolor='black',
            x='(w-text_w)/2',
            y='h-60'
        )

        # 크기 규격화 (1920x1080)
        scaled = with_subtitle.filter('scale', 1920, 1080)
        inputs.append(scaled)

    # 장면 연결 (crossfade 전환)
    if len(inputs) == 1:
        return inputs[0]

    result = inputs[0]
    for i in range(1, len(inputs)):
        offset = sum(s["duration"] for s in scene_list[:i]) - 0.5
        result = ffmpeg.filter(
            [result, inputs[i]],
            'xfade',
            transition='fade',
            duration=0.5,
            offset=offset
        )

    return result
```

### 5.3 Guardrails Implementation

5개 영역의 가드레일을 각 파이프라인 노드에 적용한다.

#### (1) 민감 콘텐츠 필터 (Content Filter)

```python
# guardrails/content_filter.py

SENSITIVE_TOPICS = [
    "자살", "자해", "학대", "성폭력", "마약",
    "극단적 폭력", "아동 착취", "테러"
]

REDIRECT_RESPONSES = {
    "자살": "힘든 시기였군요. 그 시절 당신에게 힘이 되어준 것은 무엇이었나요?",
    "자해": "어려운 경험이었을 것 같습니다. 그 시기를 어떻게 극복하셨는지 말씀해주실 수 있나요?",
    "default": "그 부분은 조금 다른 관점에서 이야기해볼까요? {era} 시절 가장 기억에 남는 좋은 순간은 무엇인가요?"
}

class ContentFilter:
    async def check(self, text: str) -> tuple[bool, str | None]:
        """텍스트 내 민감 콘텐츠 확인. (is_safe, redirect_message)"""
        # 1차: 키워드 기반 빠른 필터
        for topic in SENSITIVE_TOPICS:
            if topic in text:
                redirect = REDIRECT_RESPONSES.get(topic, REDIRECT_RESPONSES["default"])
                return False, redirect

        # 2차: GPT-4o 기반 맥락 분석 (키워드 우회 방지)
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": CONTENT_CLASSIFICATION_PROMPT},
                {"role": "user", "content": text}
            ],
            temperature=0,
            max_tokens=50
        )

        classification = response.choices[0].message.content.strip()
        if classification == "UNSAFE":
            return False, REDIRECT_RESPONSES["default"]

        return True, None
```

적용 위치: LangGraph `guardrail` 노드 (매 사용자 메시지마다)

#### (2) NSFW 필터

```python
# guardrails/nsfw_filter.py

NSFW_KEYWORDS = [
    "nude", "naked", "explicit", "sexual", "pornographic",
    "violent", "gore", "blood", "weapon"
]

class NSFWFilter:
    async def check(self, prompt: str) -> str:
        """이미지 생성 프롬프트의 NSFW 요소 제거"""
        # 1. 금지 키워드 제거
        cleaned = prompt
        for keyword in NSFW_KEYWORDS:
            cleaned = cleaned.replace(keyword, "")

        # 2. 안전 접두사 추가
        safe_prefix = "Safe for all ages, family-friendly illustration. "
        cleaned = safe_prefix + cleaned

        # 3. DALL-E 자체 안전 필터 활용 (추가 방어)
        # DALL-E 3는 자체 콘텐츠 정책 보유
        return cleaned
```

적용 위치: Character Generation, Background Generation (이미지 생성 직전)

#### (3) PII 탐지기

```python
# guardrails/pii_detector.py
import re

PII_PATTERNS = {
    "phone": r'01[0-9]-?\d{3,4}-?\d{4}',
    "email": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    "resident_id": r'\d{6}-?[1-4]\d{6}',
    "card_number": r'\d{4}-?\d{4}-?\d{4}-?\d{4}',
    "address": r'(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주).{5,30}(동|리|로|길)\s?\d*',
}

class PIIDetector:
    def detect(self, text: str) -> list[dict]:
        """PII 패턴 탐지. [{type, value, start, end}]"""
        findings = []
        for pii_type, pattern in PII_PATTERNS.items():
            for match in re.finditer(pattern, text):
                findings.append({
                    "type": pii_type,
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })
        return findings

    def mask(self, text: str) -> str:
        """PII를 마스킹 처리"""
        masked = text
        for finding in self.detect(text):
            masked = masked.replace(finding["value"], "[개인정보 보호됨]")
        return masked

    def has_pii(self, text: str) -> bool:
        return len(self.detect(text)) > 0
```

적용 위치:
- LangGraph `guardrail` 노드: 사용자 응답에서 PII 감지 시 마스킹 후 저장
- Narration Script 생성: 스크립트에 PII 포함 방지
- 최종 서사 저장: DB 저장 전 PII 마스킹

#### (4) 보이스 동의 검증

```python
# guardrails/voice_consent.py

class VoiceConsentGuard:
    async def verify(self, project_id: str, voice_type: str) -> bool:
        """보이스 클로닝 동의 검증"""
        if voice_type != "cloned":
            return True  # 샘플 보이스는 동의 불필요

        voice = await get_voice_record(project_id)
        if not voice or not voice.consent_given:
            raise ConsentRequiredError(
                "보이스 클로닝을 위해 본인 동의가 필요합니다. "
                "설정 페이지에서 동의를 완료해주세요."
            )
        return True

    def get_consent_text(self) -> str:
        return (
            "본인의 음성을 AI 보이스 클로닝에 사용하는 것에 동의합니다.\n"
            "- 생성된 음성은 본 다큐멘터리 제작에만 사용됩니다.\n"
            "- 프로젝트 삭제 시 클론된 음성 데이터도 함께 삭제됩니다.\n"
            "- 동의는 언제든 철회할 수 있습니다."
        )
```

적용 위치: Voice Clone 요청 시, TTS 생성 시

#### (5) AI 비용 제한

```python
# guardrails/cost_limiter.py

COST_LIMITS = {
    "per_project": {
        "interview_calls": 50,         # 인터뷰 LLM 호출 최대 횟수
        "image_generations": 30,       # 이미지 생성 최대 횟수
        "tts_characters": 10000,       # TTS 최대 글자 수
        "total_cost_usd": 5.0,         # 프로젝트당 총 비용 상한
    },
    "per_user_daily": {
        "total_cost_usd": 10.0,        # 사용자당 일일 비용 상한
    }
}

COST_PER_UNIT = {
    "gpt-4o_input_1k": 0.0025,
    "gpt-4o_output_1k": 0.01,
    "dall-e-3_hd": 0.08,
    "elevenlabs_1k_chars": 0.30,
}

class CostLimiter:
    async def check_budget(self, project_id: str, operation: str, estimated_cost: float) -> bool:
        """예상 비용이 한도 내인지 확인"""
        current_usage = await get_project_usage(project_id)
        projected = current_usage.total_cost + estimated_cost

        if projected > COST_LIMITS["per_project"]["total_cost_usd"]:
            raise BudgetExceededError(
                f"프로젝트 비용 한도 초과 예상: "
                f"현재 ${current_usage.total_cost:.2f} + "
                f"예상 ${estimated_cost:.2f} > "
                f"한도 ${COST_LIMITS['per_project']['total_cost_usd']:.2f}"
            )
        return True

    async def record_usage(self, project_id: str, operation: str, cost: float):
        """사용량 기록"""
        await supabase.from_("usage_logs").insert({
            "project_id": project_id,
            "operation": operation,
            "cost_usd": cost,
            "created_at": "now()"
        }).execute()
```

적용 위치: 모든 AI API 호출 직전 (인터뷰, 이미지 생성, TTS)

---

## 6. Authentication & Authorization

### Supabase Auth Flow

```
┌──────────┐    (1) 카카오 로그인 클릭      ┌───────────────┐
│  Client  │ ──────────────────────────────► │ Supabase Auth │
└──────────┘                                 └───────┬───────┘
     ▲                                               │
     │              (2) 카카오 OAuth 리다이렉트          │
     │    ┌─────────────────────────────────────────────┘
     │    │
     │    ▼
     │  ┌───────────────┐    (3) 인가코드 교환
     │  │  Kakao OAuth  │ ◄─────────────────────
     │  └───────┬───────┘
     │          │ (4) access_token 반환
     │          ▼
     │  ┌───────────────┐    (5) JWT 발급
     │  │ Supabase Auth │ ──────────────────────►  Client
     │  └───────────────┘
     │
     │  (6) JWT를 Authorization 헤더로 사용
     └────────────────────────────────────────────
```

**인증 방법**:

```typescript
// 카카오 로그인
const handleKakaoLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) console.error('카카오 로그인 실패:', error);
};

// 이메일 로그인
const handleEmailLogin = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
};

// 이메일 회원가입
const handleSignup = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
};

// OAuth 콜백 처리 (app/(auth)/callback/page.tsx)
export default function AuthCallback() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // 프로필 존재 확인 → 없으면 프로필 설정으로 리다이렉트
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            router.push('/profile');
          } else {
            router.push('/dashboard');
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);
}
```

### RLS (Row Level Security) Policies

```sql
-- profiles: 본인만 읽기/수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- projects: 본인 프로젝트만 접근
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- interviews: 프로젝트 소유자만 접근
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own interviews"
  ON interviews FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- stories: 프로젝트 소유자만 접근
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own stories"
  ON stories FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- characters: 프로젝트 소유자만 접근
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own characters"
  ON characters FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- backgrounds: 프로젝트 소유자만 접근
ALTER TABLE backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own backgrounds"
  ON backgrounds FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- voices: 프로젝트 소유자만 접근
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own voices"
  ON voices FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- documentaries: 프로젝트 소유자만 접근
ALTER TABLE documentaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own documentaries"
  ON documentaries FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- era_references: 모든 인증 사용자 읽기 가능
ALTER TABLE era_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read era references"
  ON era_references FOR SELECT
  USING (auth.role() = 'authenticated');
```

### FastAPI JWT 검증

```python
# core/auth.py
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Supabase JWT 토큰 검증"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

---

## 7. File Storage

### Supabase Storage Buckets

| Bucket | 접근 권한 | 파일 형식 | 최대 크기 | 용도 |
|--------|----------|----------|----------|------|
| `faces` | Private (RLS) | JPG, PNG, WebP | 10MB | 사용자 얼굴 사진 업로드 |
| `voices` | Private (RLS) | MP3, WAV, M4A | 20MB | 보이스 클론 샘플 + 생성된 TTS |
| `characters` | Private (RLS) | PNG | 5MB | 생성된 AI 캐릭터 이미지 |
| `backgrounds` | Private (RLS) | PNG | 5MB | 생성된 시대 배경 이미지 |
| `documentaries` | Private (RLS) | MP4 | 500MB | 최종 다큐멘터리 영상 |

### Storage RLS Policy

```sql
-- faces 버킷: 본인 폴더만 접근
CREATE POLICY "Users can upload to own face folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'faces' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own faces"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'faces' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 동일 패턴을 voices, characters, backgrounds, documentaries에 적용
-- (프로젝트 ID 기반 폴더 구조 사용 시 projects 테이블 join으로 소유권 확인)
```

### Upload/Download Flow

```
[업로드 Flow - 클라이언트 직접]
Client → Supabase Storage SDK → faces/{user_id}/{filename}
  └─ supabase.storage.from('faces').upload(path, file)

[업로드 Flow - FastAPI 서비스]
FastAPI → Supabase Admin SDK → characters/{project_id}/{era}/character.png
  └─ supabase_admin.storage.from('characters').upload(path, data)

[다운로드 Flow - Signed URL]
Client → Next.js API → Supabase Storage → Signed URL (1시간 유효)
  └─ supabase.storage.from('documentaries').createSignedUrl(path, 3600)
```

**파일 경로 규칙**:
```
faces/{user_id}/{timestamp}_{original_filename}
voices/{project_id}/sample.mp3
voices/{project_id}/narration.mp3
characters/{project_id}/{era}/character.png
backgrounds/{project_id}/{era}/{scene_id}.png
documentaries/{project_id}/documentary.mp4
```

---

## 8. Test Plan

### Unit Tests

#### Python (pytest) — FastAPI AI Pipeline

```
tests/
├─ conftest.py                       # 공통 fixture (mock OpenAI, mock Supabase)
├─ unit/
│   ├─ test_interview_engine.py      # LangGraph 노드별 테스트
│   │   ├─ test_greeting_node
│   │   ├─ test_ask_question_node
│   │   ├─ test_analyze_node
│   │   ├─ test_should_deepen_condition
│   │   └─ test_summarize_node
│   ├─ test_narrative_engine.py      # 서사 구조화 테스트
│   │   ├─ test_structure_narrative
│   │   └─ test_generate_narration_script
│   ├─ test_character_service.py     # 캐릭터 생성 테스트
│   │   ├─ test_face_analysis
│   │   ├─ test_prompt_building
│   │   └─ test_era_appearance_mapping
│   ├─ test_background_service.py    # 배경 생성 테스트
│   │   ├─ test_era_context_lookup
│   │   └─ test_background_prompt_building
│   ├─ test_voice_service.py         # 보이스 테스트
│   │   ├─ test_tts_generation
│   │   └─ test_voice_clone
│   ├─ test_composition_service.py   # FFmpeg 합성 테스트
│   │   ├─ test_scene_sequencing
│   │   └─ test_ffmpeg_command_building
│   └─ test_guardrails/
│       ├─ test_content_filter.py
│       │   ├─ test_keyword_detection
│       │   └─ test_redirect_response
│       ├─ test_pii_detector.py
│       │   ├─ test_phone_detection
│       │   ├─ test_email_detection
│       │   ├─ test_resident_id_detection
│       │   └─ test_masking
│       ├─ test_nsfw_filter.py
│       ├─ test_voice_consent.py
│       └─ test_cost_limiter.py
│           ├─ test_budget_check
│           └─ test_usage_recording
└─ integration/
    └─ (아래 참조)
```

#### TypeScript (vitest) — Next.js Frontend

```
__tests__/
├─ setup.ts                          # vitest 설정 (happy-dom)
├─ unit/
│   ├─ hooks/
│   │   ├─ useProjects.test.ts       # React Query 훅 테스트
│   │   ├─ useInterview.test.ts
│   │   └─ useGeneration.test.ts
│   ├─ stores/
│   │   ├─ authStore.test.ts         # Zustand 스토어 테스트
│   │   ├─ projectStore.test.ts
│   │   ├─ interviewStore.test.ts
│   │   └─ generationStore.test.ts
│   ├─ components/
│   │   ├─ ChatInterface.test.tsx    # 인터뷰 채팅 UI 테스트
│   │   ├─ EraTimeline.test.tsx      # 타임라인 렌더링 테스트
│   │   ├─ FaceUploader.test.tsx     # 파일 업로드 테스트
│   │   ├─ VoiceConsentDialog.test.tsx
│   │   └─ GenerationProgress.test.tsx
│   └─ utils/
│       ├─ eraCalculator.test.ts     # 생년 → 시기 계산 로직
│       └─ validators.test.ts        # 입력 유효성 검사
└─ integration/
    └─ (아래 참조)
```

### Integration Tests

```
# Python Integration Tests
tests/integration/
├─ test_interview_flow.py            # 인터뷰 시작 → 질문 → 완료 전체 흐름
├─ test_generation_pipeline.py       # 에셋 생성 → 합성 파이프라인
├─ test_auth_flow.py                 # JWT 검증 → API 호출 권한
└─ test_storage_flow.py              # 파일 업로드 → 다운로드

# TypeScript Integration Tests
__tests__/integration/
├─ interviewPage.test.tsx            # 인터뷰 페이지 E2E (MSW 모킹)
├─ projectFlow.test.tsx              # 프로젝트 생성 → 인터뷰 → 생성 흐름
└─ authFlow.test.tsx                 # 로그인 → 리다이렉트 흐름
```

### Key Test Scenarios (Plan 기반)

| 시나리오 | 테스트 내용 | 도구 | 우선순위 |
|---------|-----------|------|---------|
| 인터뷰 완료 흐름 | 인터뷰 시작 → 5개 질문 응답 → 완료 → 서사 요약 생성 | pytest + LangGraph mock | P0 |
| 가드레일 PII 차단 | 주민번호/전화번호 포함 응답 → 마스킹 처리 확인 | pytest | P0 |
| 가드레일 민감 주제 | 민감 키워드 응답 → 리다이렉트 메시지 반환 | pytest | P0 |
| 캐릭터 생성 | 얼굴 사진 업로드 → 캐릭터 이미지 생성 → Storage 저장 | pytest + mock DALL-E | P1 |
| 시대 배경 매핑 | birth_year=1985 + era='10대' → 1990s 시대 컨텍스트 매핑 | pytest | P1 |
| TTS 생성 | 나레이션 스크립트 → ElevenLabs TTS → MP3 반환 | pytest + mock ElevenLabs | P1 |
| 비용 한도 초과 | 프로젝트 비용 $5 도달 시 추가 생성 차단 | pytest | P0 |
| 보이스 동의 미비 | 동의 없이 클론 TTS 시도 → 에러 반환 | pytest | P0 |
| FFmpeg 합성 | 이미지 3장 + TTS 1개 → MP4 생성 | pytest + FFmpeg binary | P1 |
| 인증 미비 접근 | JWT 없이 API 호출 → 401 반환 | pytest | P0 |
| 프로젝트 CRUD | 생성/조회/수정/삭제 전체 흐름 | vitest + Supabase mock | P1 |
| 인터뷰 채팅 UI | 메시지 전송 → 버블 렌더링 → 진행률 업데이트 | vitest + React Testing Library | P1 |

---

## 9. Error Handling

### Frontend Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <h2 className="text-xl font-semibold text-destructive mb-2">
        문제가 발생했습니다
      </h2>
      <p className="text-muted-foreground mb-4">
        {getErrorMessage(error)}
      </p>
      <Button onClick={resetErrorBoundary}>다시 시도</Button>
    </div>
  );
}

function getErrorMessage(error: Error): string {
  if (error.message.includes('401')) return '로그인이 필요합니다.';
  if (error.message.includes('403')) return '접근 권한이 없습니다.';
  if (error.message.includes('429')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (error.message.includes('500')) return '서버에 문제가 발생했습니다.';
  return '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.';
}

// layout.tsx에서 래핑
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
```

**React Query 전역 에러 처리**:

```typescript
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 4xx 에러는 재시도하지 않음
        if (error instanceof Error && error.message.match(/^4\d{2}/)) return false;
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5,  // 5분
    },
    mutations: {
      onError: (error) => {
        // 전역 에러 토스트 표시
        toast.error(getErrorMessage(error as Error));
      },
    },
  },
});
```

### FastAPI Error Responses

```python
# core/exceptions.py
from fastapi import HTTPException

class AppError(Exception):
    """기본 애플리케이션 에러"""
    def __init__(self, message: str, status_code: int = 500, error_code: str = "INTERNAL_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

class GuardrailError(AppError):
    """가드레일 차단 에러"""
    def __init__(self, message: str):
        super().__init__(message, status_code=422, error_code="GUARDRAIL_BLOCKED")

class BudgetExceededError(AppError):
    """비용 한도 초과 에러"""
    def __init__(self, message: str):
        super().__init__(message, status_code=429, error_code="BUDGET_EXCEEDED")

class ConsentRequiredError(AppError):
    """동의 필요 에러"""
    def __init__(self, message: str):
        super().__init__(message, status_code=403, error_code="CONSENT_REQUIRED")

class GenerationFailedError(AppError):
    """AI 생성 실패 에러"""
    def __init__(self, message: str):
        super().__init__(message, status_code=502, error_code="GENERATION_FAILED")

# main.py에서 전역 에러 핸들러 등록
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
            }
        }
    )

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "서버 내부 오류가 발생했습니다."
            }
        }
    )
```

**에러 응답 형식** (모든 API 통일):

```json
{
  "error": {
    "code": "GUARDRAIL_BLOCKED",
    "message": "민감한 콘텐츠가 감지되었습니다."
  }
}
```

### AI Generation Failure Recovery

```python
# services/generation_recovery.py

class GenerationRecovery:
    MAX_RETRIES = 3
    RETRY_DELAYS = [2, 5, 10]  # 초 단위 지수 백오프

    async def with_retry(self, operation: str, func, *args, **kwargs):
        """AI 생성 작업 재시도 로직"""
        last_error = None

        for attempt in range(self.MAX_RETRIES):
            try:
                result = await func(*args, **kwargs)
                return result
            except RateLimitError:
                # API Rate Limit → 대기 후 재시도
                delay = self.RETRY_DELAYS[attempt]
                logger.warning(f"{operation}: Rate limited, retrying in {delay}s (attempt {attempt + 1})")
                await asyncio.sleep(delay)
                last_error = "rate_limit"
            except ContentPolicyError:
                # DALL-E 콘텐츠 정책 위반 → 프롬프트 수정 후 재시도
                logger.warning(f"{operation}: Content policy violation, modifying prompt")
                kwargs["prompt"] = self.sanitize_prompt(kwargs.get("prompt", ""))
                last_error = "content_policy"
            except TimeoutError:
                # 타임아웃 → 재시도
                logger.warning(f"{operation}: Timeout, retrying (attempt {attempt + 1})")
                last_error = "timeout"
            except Exception as e:
                logger.error(f"{operation}: Unexpected error: {e}")
                last_error = str(e)
                break

        # 모든 재시도 실패
        await self.mark_failed(operation, last_error)
        raise GenerationFailedError(
            f"{operation} 생성에 실패했습니다. "
            f"잠시 후 다시 시도해주세요. (사유: {last_error})"
        )

    async def mark_failed(self, operation: str, error: str):
        """실패 상태 DB 기록"""
        logger.error(f"Generation permanently failed: {operation} - {error}")
```

**복구 전략 요약**:

| 에러 유형 | 복구 전략 | 재시도 횟수 |
|----------|---------|-----------|
| Rate Limit (429) | 지수 백오프 (2s → 5s → 10s) | 3회 |
| Content Policy | 프롬프트 정제 후 재시도 | 2회 |
| Timeout | 즉시 재시도 | 3회 |
| API 키 에러 (401) | 재시도 불가, 관리자 알림 | 0회 |
| 네트워크 에러 | 지수 백오프 | 3회 |
| FFmpeg 실패 | 에셋 재확인 후 재시도 | 2회 |

---

## 10. Environment & Configuration

### Environment Variables

#### Next.js (Frontend + BFF)

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...       # 서버 전용 (BFF에서만 사용)

# FastAPI Backend URL
FASTAPI_URL=http://localhost:8000          # 개발: localhost, 프로덕션: Railway URL

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### FastAPI (AI Backend)

```env
# .env

# Supabase (Service Role - 전체 접근)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_DB_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=xi-...

# Redis (LangGraph Checkpointer 대안)
REDIS_URL=redis://localhost:6379

# App
ENVIRONMENT=development                    # development | staging | production
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000         # 프론트엔드 URL
MAX_WORKERS=4
```

### Docker Setup (FastAPI)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

# FFmpeg 설치 (슬라이드쇼 합성용)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```yaml
# docker-compose.yml (로컬 개발용)
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Deployment Config

#### Vercel (Frontend) — `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "env": {
    "FASTAPI_URL": "@fastapi-url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

#### Railway (FastAPI Backend)

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4"
healthcheckPath = "/health"
healthcheckTimeout = 10
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 5
```

---

## 11. Implementation Guide

### 11.1 Implementation Order (Phases)

```
Phase 0: 프로젝트 초기 설정 (1-2일)
├─ Next.js 15 프로젝트 생성 + 기본 구조
├─ FastAPI 프로젝트 생성 + Docker
├─ Supabase 프로젝트 생성 + 테이블 마이그레이션
├─ 환경 변수 설정
└─ 로컬 개발 환경 검증

Phase 1: 인증 + 프로필 (2-3일)
├─ Supabase Auth 설정 (카카오 + 이메일)
├─ 로그인/회원가입 페이지
├─ OAuth 콜백 처리
├─ 프로필 폼 (생년, 이름, 성별)
├─ RLS 정책 적용
└─ AuthGuard 미들웨어

Phase 2: 인터뷰 엔진 (4-5일)
├─ LangGraph StateGraph 구현
├─ 인터뷰 노드 (greeting, ask, analyze, summarize)
├─ Checkpointer 설정 (PostgreSQL)
├─ 가드레일 5종 구현
├─ FastAPI 인터뷰 엔드포인트
├─ 인터뷰 채팅 UI
└─ 인터뷰 상태 관리 (Zustand + React Query)

Phase 3: 템플릿 작성 (2일)
├─ 템플릿 폼 구현 (시기별 서사 입력)
├─ 작성 가이드 UI
├─ 서사 구조화 엔진 (narrative → scene breakdown)
└─ 나레이션 스크립트 자동 생성

Phase 4: 캐릭터 + 배경 생성 (3-4일)
├─ 얼굴 업로드 + Storage 연동
├─ 캐릭터 생성 서비스 (DALL-E 3)
├─ 시대 DB 구축 (era_references 시드 데이터)
├─ 배경 생성 서비스 (DALL-E 3 + 시대 컨텍스트)
├─ 생성 상태 폴링 UI
└─ 결과 미리보기

Phase 5: 보이스 시스템 (2-3일)
├─ 샘플 보이스 목록 + 미리듣기
├─ 보이스 클로닝 (음성 업로드 + ElevenLabs)
├─ 보이스 동의 다이얼로그
├─ TTS 생성 서비스
└─ 생성된 음성 재생 UI

Phase 6: 다큐 생성 + 내보내기 (3-4일)
├─ FFmpeg 슬라이드쇼 합성 서비스
├─ 장면 시퀀싱 로직
├─ 생성 진행 상황 UI (단계별 진행률)
├─ 결과 미리보기 + 비디오 플레이어
└─ MP4 다운로드 (Signed URL)

Phase 7: 프론트엔드 통합 (3-4일)
├─ 대시보드 (프로젝트 목록)
├─ 프로젝트 오버뷰 (시기별 타임라인)
├─ 전체 플로우 연결 (인터뷰 → 생성 → 미리보기)
├─ 에러 바운더리 + 전역 에러 처리
├─ 반응형 UI 최적화
└─ 최종 통합 테스트
```

**총 예상 기간**: 20-26일 (1인 개발 기준)

### 11.2 Dependency Installation

#### Frontend (Next.js)

```bash
# 프로젝트 생성
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir

# 핵심 의존성
cd frontend
npm install @supabase/supabase-js @supabase/ssr          # Supabase
npm install @tanstack/react-query                         # React Query
npm install zustand                                       # 상태 관리
npm install zod                                           # 스키마 검증
npm install react-error-boundary                          # 에러 바운더리

# UI
npx shadcn@latest init                                    # shadcn/ui 초기화
npx shadcn@latest add button input card dialog progress tabs textarea avatar badge toast

# 개발 의존성
npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
npm install -D msw                                        # API 모킹
```

#### Backend (FastAPI)

```txt
# backend/requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.10.0
pydantic-settings==2.6.0

# AI / LangGraph
langgraph==0.2.60
langchain-openai==0.2.14
langchain-core==0.3.28
openai==1.58.0

# Supabase
supabase==2.11.0

# TTS
elevenlabs==1.15.0

# FFmpeg
ffmpeg-python==0.2.0

# Auth
python-jose[cryptography]==3.3.0

# Database (Checkpointer)
langgraph-checkpoint-postgres==2.0.10
asyncpg==0.30.0
psycopg[binary]==3.2.4

# Utilities
httpx==0.28.0
python-multipart==0.0.18
redis==5.2.0

# Testing
pytest==8.3.4
pytest-asyncio==0.25.0
pytest-cov==6.0.0
```

```bash
# 가상환경 생성 및 의존성 설치
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 11.3 Session Guide (Module Map + Session Plan)

#### Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        Module Map                                │
│                                                                  │
│  module-0: 프로젝트 초기 설정                                      │
│  ├─ 범위: Next.js + FastAPI + Supabase 세팅                      │
│  ├─ 산출물: 동작하는 빈 프로젝트 + DB 테이블 + Docker               │
│  ├─ 의존성: 없음                                                  │
│  └─ 예상 세션: 1-2                                                │
│                                                                  │
│  module-1: 인증 + 프로필                                          │
│  ├─ 범위: Supabase Auth (카카오+이메일) + 프로필 폼 + RLS           │
│  ├─ 산출물: 로그인 가능한 앱 + 프로필 설정 페이지                     │
│  ├─ 의존성: module-0                                              │
│  ├─ FR: FR-08, FR-09                                             │
│  └─ 예상 세션: 2-3                                                │
│                                                                  │
│  module-2: 인터뷰 엔진                                            │
│  ├─ 범위: LangGraph StateGraph + 가드레일 5종 + 채팅 UI            │
│  ├─ 산출물: AI 인터뷰 대화 가능 + 서사 요약 생성                     │
│  ├─ 의존성: module-0, module-1                                    │
│  ├─ FR: FR-01, FR-03, FR-12                                      │
│  └─ 예상 세션: 3-4                                                │
│                                                                  │
│  module-3: 템플릿 작성                                             │
│  ├─ 범위: 서사 템플릿 폼 + 구조화 엔진 + 나레이션 스크립트            │
│  ├─ 산출물: 인터뷰 대안 경로 (직접 입력)                             │
│  ├─ 의존성: module-0, module-1                                    │
│  ├─ FR: FR-02, FR-03                                              │
│  └─ 예상 세션: 1-2                                                │
│                                                                  │
│  module-4: 캐릭터 + 배경 생성                                      │
│  ├─ 범위: 얼굴 업로드 + DALL-E 캐릭터/배경 + 시대 DB                │
│  ├─ 산출물: 시기별 캐릭터/배경 이미지 생성 가능                       │
│  ├─ 의존성: module-0, module-1                                    │
│  ├─ FR: FR-04, FR-05                                              │
│  └─ 예상 세션: 2-3                                                │
│                                                                  │
│  module-5: 보이스 시스템                                           │
│  ├─ 범위: 샘플 TTS + 보이스 클로닝 + 동의 프로세스                   │
│  ├─ 산출물: 나레이션 음성 생성 가능                                  │
│  ├─ 의존성: module-0                                              │
│  ├─ FR: FR-06, FR-12                                              │
│  └─ 예상 세션: 2                                                  │
│                                                                  │
│  module-6: 다큐 생성 + 내보내기                                     │
│  ├─ 범위: FFmpeg 슬라이드쇼 합성 + MP4 다운로드                     │
│  ├─ 산출물: 최종 다큐멘터리 MP4 생성 + 다운로드 가능                  │
│  ├─ 의존성: module-2 또는 module-3, module-4, module-5             │
│  ├─ FR: FR-07, FR-11                                              │
│  └─ 예상 세션: 2-3                                                │
│                                                                  │
│  module-7: 프론트엔드 통합                                         │
│  ├─ 범위: 대시보드 + 프로젝트 관리 + 전체 UI 연결 + 에러 처리         │
│  ├─ 산출물: 완성된 MVP 앱                                          │
│  ├─ 의존성: module-1 ~ module-6 전체                               │
│  ├─ FR: FR-10                                                     │
│  └─ 예상 세션: 2-3                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Module Dependency Graph

```
module-0 (프로젝트 초기 설정)
   │
   ├──► module-1 (인증 + 프로필)
   │       │
   │       ├──► module-2 (인터뷰 엔진) ──────┐
   │       │                                  │
   │       ├──► module-3 (템플릿 작성) ────────┤
   │       │                                  │
   │       └──► module-4 (캐릭터 + 배경) ──────┤
   │                                          │
   └──► module-5 (보이스 시스템) ──────────────┤
                                              │
                                              ▼
                                   module-6 (다큐 생성 + 내보내기)
                                              │
                                              ▼
                                   module-7 (프론트엔드 통합)
```

**병렬 작업 가능 구간**: module-2, module-3, module-4, module-5는 module-1 완료 후 병렬 진행 가능

#### Session Plan

각 세션은 약 2-4시간 단위로 구성한다. 세션 시작 시 `/pdca do --scope={module}` 패턴으로 범위를 지정한다.

```
Session 01: module-0 — 프로젝트 스캐폴딩
  scope: module-0
  목표: Next.js + FastAPI + Supabase 프로젝트 생성, 로컬 실행 확인
  작업:
    - Next.js 15 프로젝트 생성 (App Router, TypeScript, Tailwind)
    - shadcn/ui 초기화 + 기본 컴포넌트 추가
    - FastAPI 프로젝트 구조 생성
    - Docker Compose 설정 (FastAPI + Redis)
    - Supabase 프로젝트 생성 + 테이블 마이그레이션 스크립트 작성
    - 환경 변수 파일 (.env.local, .env) 템플릿 생성
  완료 기준: `npm run dev` + `docker compose up` + Supabase Dashboard 접근 성공

Session 02: module-1a — 인증 기반
  scope: module-1
  목표: Supabase Auth 연동 + 로그인/회원가입 페이지
  작업:
    - Supabase Auth 설정 (카카오 Provider 등록)
    - Supabase JS 클라이언트 설정 (createBrowserClient, createServerClient)
    - 로그인 페이지 (이메일 + 카카오)
    - 회원가입 페이지
    - OAuth 콜백 페이지
    - AuthGuard 미들웨어 (middleware.ts)
    - authStore (Zustand) 구현
  완료 기준: 카카오 로그인 → 콜백 → 인증 상태 유지 성공

Session 03: module-1b — 프로필 + RLS
  scope: module-1
  목표: 프로필 폼 + RLS 정책 + 신규 가입 플로우
  작업:
    - 프로필 폼 페이지 (이름, 생년, 성별)
    - profiles 테이블 RLS 정책 적용
    - 전체 테이블 RLS 정책 적용
    - 신규 가입 시 프로필 설정 리다이렉트 로직
    - 프로필 수정 기능
  완료 기준: 가입 → 프로필 설정 → 대시보드 리다이렉트 성공, RLS로 타인 데이터 접근 차단 확인

Session 04: module-2a — LangGraph 인터뷰 엔진 (백엔드)
  scope: module-2
  목표: LangGraph StateGraph 구현 + 기본 인터뷰 흐름
  작업:
    - InterviewState 타입 정의
    - 노드 구현: greeting, ask_question, wait_response, analyze, should_deepen, summarize
    - 조건부 엣지 로직
    - PostgreSQL Checkpointer 설정
    - FastAPI 인터뷰 엔드포인트 (/start, /message, /status, /complete)
    - JWT 검증 미들웨어
  완료 기준: curl/Postman으로 인터뷰 시작 → 질문 5회 → 완료 → 서사 요약 반환

Session 05: module-2b — 가드레일 구현
  scope: module-2
  목표: 5개 가드레일 모듈 구현 + LangGraph 연동
  작업:
    - content_filter.py (민감 콘텐츠 필터)
    - pii_detector.py (PII 탐지 + 마스킹)
    - nsfw_filter.py (NSFW 필터)
    - voice_consent.py (보이스 동의 검증)
    - cost_limiter.py (비용 제한)
    - LangGraph guardrail 노드에 통합
    - 가드레일 단위 테스트
  완료 기준: PII 포함 응답 → 마스킹, 민감 키워드 → 리다이렉트, 비용 초과 → 차단

Session 06: module-2c — 인터뷰 채팅 UI
  scope: module-2
  목표: 인터뷰 채팅 프론트엔드
  작업:
    - ChatInterface 컴포넌트
    - ChatBubble 컴포넌트
    - SuggestedQuestions 컴포넌트
    - InterviewProgress 컴포넌트
    - InterviewComplete 컴포넌트 (요약 카드)
    - interviewStore (Zustand)
    - React Query 훅 (useStartInterview, useSendMessage)
    - Next.js BFF API Routes (/api/interview/*)
  완료 기준: 브라우저에서 AI 인터뷰 대화 가능, 진행률 표시, 완료 시 요약 표시

Session 07: module-3 — 템플릿 작성
  scope: module-3
  목표: 인터뷰 대안 경로 (직접 서사 입력)
  작업:
    - TemplateForm 컴포넌트 (시기별 입력 폼)
    - TemplateGuide 컴포넌트 (작성 가이드 표시)
    - 서사 구조화 엔진 (FastAPI: narrative/structure)
    - 나레이션 스크립트 생성 (FastAPI: narrative/script)
    - stories 테이블 CRUD
    - SceneList, StoryViewer, StoryEditor 컴포넌트
  완료 기준: 템플릿 입력 → 구조화 → 장면 분해 → 나레이션 스크립트 생성 성공

Session 08: module-4a — 캐릭터 생성
  scope: module-4
  목표: 얼굴 업로드 + AI 캐릭터 생성
  작업:
    - FaceUploader 컴포넌트 (Supabase Storage 업로드)
    - 캐릭터 생성 서비스 (character_service.py)
    - GPT-4o Vision 얼굴 분석
    - DALL-E 3 캐릭터 프롬프트 빌드
    - CharacterPreview, CharacterStyleSelector 컴포넌트
    - 비동기 생성 상태 폴링
  완료 기준: 얼굴 사진 업로드 → 캐릭터 이미지 생성 → 미리보기 표시

Session 09: module-4b — 배경 생성 + 시대 DB
  scope: module-4
  목표: 시대 참조 DB + 배경 이미지 생성
  작업:
    - era_references 시드 데이터 작성 (1950s ~ 2020s)
    - 배경 생성 서비스 (background_service.py)
    - 시대 컨텍스트 조회 로직
    - DALL-E 3 배경 프롬프트 빌드 (시대 요소 반영)
    - 배경 미리보기 UI
  완료 기준: 특정 시기 + 장면 설명 → 시대 반영된 배경 이미지 생성

Session 10: module-5 — 보이스 시스템
  scope: module-5
  목표: 샘플 TTS + 보이스 클로닝
  작업:
    - ElevenLabs SDK 연동
    - 샘플 보이스 목록 API (voice/samples)
    - VoiceSamplePlayer 컴포넌트
    - 보이스 클로닝 서비스 (음성 업로드 → 클론 생성)
    - VoiceCloneUploader, VoiceConsentDialog 컴포넌트
    - TTS 생성 서비스
    - 음성 재생 UI
  완료 기준: 샘플 보이스 선택 + TTS 생성 성공, 보이스 클로닝 (동의 → 업로드 → 클론) 성공

Session 11: module-6a — FFmpeg 슬라이드쇼 합성
  scope: module-6
  목표: 에셋 결합 → MP4 영상 생성
  작업:
    - composition_service.py (FFmpeg 합성 로직)
    - 장면 시퀀싱 (stories → scene_breakdown → 이미지 매핑)
    - 캐릭터 + 배경 오버레이
    - 자막 추가
    - 장면 전환 (crossfade)
    - TTS 오디오 합성
    - 임시 파일 관리
  완료 기준: 테스트 이미지 3장 + TTS 1개 → 정상 MP4 생성

Session 12: module-6b — 내보내기 + 다운로드
  scope: module-6
  목표: 다큐 생성 API + 진행 상황 UI + 다운로드
  작업:
    - FastAPI 다큐 합성 엔드포인트 (documentary/compose, documentary/status)
    - 생성 작업 큐 (백그라운드 태스크)
    - GenerationProgress 컴포넌트 (단계별 진행률)
    - VideoPlayer 컴포넌트 (결과 미리보기)
    - DownloadButton 컴포넌트 (Signed URL → MP4 다운로드)
    - 에러 복구 로직 (GenerationRecovery)
  완료 기준: 다큐 생성 요청 → 진행 상황 표시 → 완성 → 미리보기 + 다운로드

Session 13: module-7a — 대시보드 + 프로젝트 관리
  scope: module-7
  목표: 대시보드 + 프로젝트 CRUD
  작업:
    - 대시보드 페이지 (ProjectCard 목록)
    - ProjectCreateForm (새 프로젝트)
    - 프로젝트 오버뷰 페이지 (EraTimeline)
    - EraCard (시기별 상태: 인터뷰/생성/완료)
    - 프로젝트 삭제 (연관 에셋 포함)
    - projectStore (Zustand)
  완료 기준: 프로젝트 생성 → 오버뷰 → 시기별 작업 진입 가능

Session 14: module-7b — 전체 통합 + 마무리
  scope: module-7
  목표: 전체 플로우 연결 + 에러 처리 + 최종 테스트
  작업:
    - 프로젝트 오버뷰 → 인터뷰/템플릿 → 캐릭터/배경 → 보이스 → 다큐 생성 플로우 연결
    - ErrorBoundary 적용 (전역 + 페이지별)
    - React Query 전역 에러 처리 (toast)
    - 반응형 UI 최적화 (모바일 뷰)
    - 로딩 상태 UI (Skeleton)
    - 통합 테스트 실행 + 버그 수정
    - 랜딩 페이지 구성
  완료 기준: MVP 전체 플로우 (가입 → 인터뷰 → 생성 → 다운로드) 정상 동작
```

#### Session Execution Pattern

```bash
# 세션 시작
# 1. 현재 상태 확인
git status && git branch

# 2. 모듈 브랜치 생성
git checkout -b feature/module-{N}-{description}

# 3. 작업 수행 (해당 module scope)

# 4. 작업 완료 후
git add -A && git commit -m "feat(module-{N}): {description}"

# 5. main으로 머지
git checkout main && git merge feature/module-{N}-{description}
```
