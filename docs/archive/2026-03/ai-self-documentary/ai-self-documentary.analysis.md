# AI 셀프 다큐멘터리 — Gap Analysis Report

> **Feature**: AI 셀프 다큐멘터리
> **Date**: 2026-03-31
> **Phase**: Check (Static Analysis)
> **Design Reference**: `docs/02-design/features/ai-self-documentary.design.md`

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | "개인 서사 + 캐릭터 영상" 교차점이 비어 있음 |
| **WHO** | Beachhead: 효도 기록자 (30-50대) |
| **RISK** | 캐릭터 유사성, AI 비용, 개인정보 신뢰, 인터뷰 완료율 |
| **SUCCESS** | MVP 100명, 인터뷰 60%+, 다큐 생성 70%+, NPS 40+ |
| **SCOPE** | MVP → v1(바이럴) → v2(수익화) |

---

## 1. Structural Match (파일 존재 여부)

### 1.1 Backend Files

| Design 명세 | 구현 파일 | 상태 |
|-------------|----------|:----:|
| `app/main.py` | `backend/app/main.py` | ✅ |
| `app/core/config.py` | `backend/app/core/config.py` | ✅ |
| `app/core/supabase.py` | `backend/app/core/supabase.py` | ✅ |
| `app/core/auth.py` (JWT 검증) | **없음** | ❌ |
| `app/graphs/state.py` | `backend/app/graphs/state.py` | ✅ |
| `app/graphs/interview_graph.py` | `backend/app/graphs/interview_graph.py` | ✅ |
| `app/graphs/nodes/greeting.py` | `backend/app/graphs/nodes/greeting.py` | ✅ |
| `app/graphs/nodes/ask_question.py` | `backend/app/graphs/nodes/ask_question.py` | ✅ |
| `app/graphs/nodes/guardrail.py` | `backend/app/graphs/nodes/guardrail.py` | ✅ |
| `app/graphs/nodes/analyze.py` | `backend/app/graphs/nodes/analyze.py` | ✅ |
| `app/graphs/nodes/should_deepen.py` | `backend/app/graphs/nodes/should_deepen.py` | ✅ |
| `app/graphs/nodes/redirect.py` | `backend/app/graphs/nodes/redirect.py` | ✅ |
| `app/graphs/nodes/summarize.py` | `backend/app/graphs/nodes/summarize.py` | ✅ |
| `app/services/narrative_engine.py` | `backend/app/services/narrative_engine.py` | ✅ |
| `app/services/character_service.py` | `backend/app/services/character_service.py` | ✅ |
| `app/services/background_service.py` | `backend/app/services/background_service.py` | ✅ |
| `app/services/voice_service.py` | `backend/app/services/voice_service.py` | ✅ |
| `app/services/composition_service.py` | `backend/app/services/composition_service.py` | ✅ |
| `app/guardrails/content_filter.py` | `backend/app/guardrails/content_filter.py` | ✅ |
| `app/guardrails/pii_detector.py` | `backend/app/guardrails/pii_detector.py` | ✅ |
| `app/guardrails/nsfw_filter.py` | `backend/app/guardrails/nsfw_filter.py` | ✅ |
| `app/guardrails/voice_consent.py` | `backend/app/guardrails/voice_consent.py` | ✅ |
| `app/guardrails/cost_limiter.py` | `backend/app/guardrails/cost_limiter.py` | ✅ |
| `app/data/era_db.py` | `backend/app/data/era_db.py` | ✅ |
| `app/api/interview.py` | `backend/app/api/interview.py` | ✅ |
| `app/api/narrative.py` | `backend/app/api/narrative.py` | ✅ |
| `app/api/generation.py` | `backend/app/api/generation.py` | ✅ |
| `app/api/voice.py` | `backend/app/api/voice.py` | ✅ |
| `app/api/documentary.py` | `backend/app/api/documentary.py` | ✅ |
| `app/models/schemas.py` | **없음** (각 API에 인라인) | ⚠️ |
| `Dockerfile` | `backend/Dockerfile` | ✅ |

**Backend 구조 일치율: 28/30 = 93%**

### 1.2 Frontend Pages (App Router Routes)

| Design 명세 | 구현 파일 | 상태 |
|-------------|----------|:----:|
| `/` (랜딩) | `app/page.tsx` | ✅ |
| `/login` | `app/(auth)/login/page.tsx` | ✅ |
| `/signup` | `app/(auth)/signup/page.tsx` | ✅ |
| `/callback` | `app/(auth)/callback/page.tsx` | ✅ |
| `/dashboard` | `app/(main)/dashboard/page.tsx` | ✅ |
| `/profile` | `app/(main)/profile/page.tsx` | ✅ |
| `/projects/new` | `app/(main)/projects/new/page.tsx` | ✅ |
| `/projects/[projectId]` | `app/(main)/projects/[projectId]/page.tsx` | ✅ |
| `/projects/[projectId]/interview/[era]` | 구현됨 | ✅ |
| `/projects/[projectId]/template/[era]` | 구현됨 | ✅ |
| `/projects/[projectId]/story/[era]` | **없음** | ❌ |
| `/projects/[projectId]/character` | 구현됨 | ✅ |
| `/projects/[projectId]/voice` | 구현됨 | ✅ |
| `/projects/[projectId]/generate` | 구현됨 | ✅ |
| `/projects/[projectId]/preview` | 구현됨 | ✅ |

**Frontend 라우트 일치율: 14/15 = 93%**

### 1.3 Frontend Components

| Design 명세 | 구현 | 상태 |
|-------------|------|:----:|
| LoginForm | ✅ | ✅ |
| KakaoLoginButton | ✅ | ✅ |
| SignupForm | ✅ | ✅ |
| ProfileForm | ✅ | ✅ |
| ChatInterface | ✅ | ✅ |
| ChatBubble | ✅ | ✅ |
| SuggestedQuestions | **없음** | ❌ |
| InterviewProgress | **없음** (ChatInterface에 내장) | ⚠️ |
| InterviewComplete | **없음** (ChatInterface에 내장) | ⚠️ |
| TemplateForm | ✅ | ✅ |
| TemplateGuide | ✅ | ✅ |
| TemplatePreview | **없음** | ❌ |
| StoryViewer | ✅ | ✅ |
| SceneList | ✅ | ✅ |
| StoryEditor | **없음** | ❌ |
| FaceUploader | ✅ | ✅ |
| CharacterPreview | ✅ | ✅ |
| CharacterStyleSelector | **없음** | ❌ |
| VoiceSamplePlayer | ✅ | ✅ |
| VoiceCloneUploader | ✅ | ✅ |
| VoiceConsentDialog | ✅ | ✅ |
| VoiceSelector | ✅ | ✅ |
| GenerationProgress | ✅ | ✅ |
| GenerationStepCard | **없음** (GenerationProgress에 내장) | ⚠️ |
| GenerationError | **없음** (GenerationProgress에 내장) | ⚠️ |
| VideoPlayer | ✅ | ✅ |
| DownloadButton | ✅ | ✅ |
| ShareDialog | **없음** (v2 기능) | ⚠️ |
| ProjectCard | ✅ | ✅ |
| ProjectCreateForm | ✅ | ✅ |
| EraTimeline | ✅ | ✅ |
| EraCard | ✅ | ✅ |
| ErrorBoundary | ✅ | ✅ |

**컴포넌트 일치율: 23/33 = 70%** (단, 미구현 중 5개는 다른 컴포넌트에 기능 통합)

### 1.4 Infrastructure

| Design 명세 | 구현 | 상태 |
|-------------|------|:----:|
| docker-compose.yml | ✅ | ✅ |
| backend/Dockerfile | ✅ | ✅ |
| supabase/migrations/001_initial.sql (9 테이블) | ✅ (9 테이블) | ✅ |
| middleware.ts (AuthGuard) | ✅ | ✅ |
| .env.local.example | ✅ | ✅ |
| .env.example (backend) | ✅ | ✅ |

**인프라 일치율: 6/6 = 100%**

---

## 2. Functional Depth (기능 완성도)

### 2.1 Critical Gaps

| # | Gap | 심각도 | 영향 |
|---|-----|:------:|------|
| **G1** | **FastAPI JWT 인증 미구현** — Design §6에 명시된 `core/auth.py` + `verify_supabase_token` 없음. 모든 API 엔드포인트가 인증 없이 호출 가능 | **Critical** | 보안: 타인 프로젝트/데이터 접근 가능 |
| **G2** | **story/[era] 페이지 누락** — Design에 명시된 구조화 서사 확인/편집 전용 페이지 없음. 현재 TemplateForm 내에서만 확인 가능 | **Important** | UX: 인터뷰 완료 후 서사 확인 경로 없음 |

### 2.2 Important Gaps

| # | Gap | 심각도 | 영향 |
|---|-----|:------:|------|
| **G3** | **API prefix 불일치** — Design: `/api/v1/generate/*`, 구현: `/api/v1/generation/*` | Important | FE↔BE 연결 시 404 |
| **G4** | **SuggestedQuestions 미구현** — 인터뷰 중 AI 추천 질문 칩 UI 없음 | Important | UX: 사용자가 뭘 말해야 할지 막막 |
| **G5** | **CharacterStyleSelector 미구현** — 캐릭터 스타일 선택 UI 없음 (기본 cartoon 고정) | Important | UX: 스타일 선택 불가 |
| **G6** | **StoryEditor 미구현** — 생성된 서사/나레이션 수정 불가 | Important | UX: AI 결과물 수정 불가 |
| **G7** | **Pydantic schemas 분산** — Design에서 `models/schemas.py` 중앙화 명시, 실제로는 각 API 파일에 인라인 | Minor | 유지보수성 |

---

## 3. API Contract Match (Design §4.3 vs 구현)

| API | Design Path | 구현 Path | 일치? |
|-----|------------|----------|:-----:|
| Interview start | `/api/v1/interview/start` | `/api/v1/interview/start` | ✅ |
| Interview message | `/api/v1/interview/message` | `/api/v1/interview/message` | ✅ |
| Interview status | `/api/v1/interview/{id}/status` | `/api/v1/interview/{id}/status` | ✅ |
| Interview complete | `/api/v1/interview/{id}/complete` | `/api/v1/interview/{id}/complete` | ✅ |
| Narrative structure | `/api/v1/narrative/structure` | `/api/v1/narrative/structure` | ✅ |
| Narrative script | `/api/v1/narrative/script` | `/api/v1/narrative/script` | ✅ |
| **Generate character** | `/api/v1/generate/character` | `/api/v1/generation/character` | **❌** |
| **Generate background** | `/api/v1/generate/background` | `/api/v1/generation/background` | **❌** |
| **Generate status** | `/api/v1/generate/status/{id}` | `/api/v1/generation/{id}/assets` | **❌** |
| Voice samples | `/api/v1/voice/samples` | `/api/v1/voice/samples` | ✅ |
| Voice clone | `/api/v1/voice/clone` | `/api/v1/voice/clone` | ✅ |
| Voice TTS | `/api/v1/voice/tts` | `/api/v1/voice/tts` | ✅ |
| Voice consent | - | `/api/v1/voice/consent` | ➕ (추가) |
| Voice preview | - | `/api/v1/voice/preview` | ➕ (추가) |
| Documentary compose | `/api/v1/documentary/compose` | `/api/v1/documentary/compose` | ✅ |
| Documentary status | `/api/v1/documentary/status/{id}` | `/api/v1/documentary/status/{id}` | ✅ |
| Documentary download | `/api/v1/documentary/{id}/download` | `/api/v1/documentary/{id}/download` | ✅ |

**API 계약 일치율: 14/17 = 82%** (3개 prefix 불일치)

---

## 4. Plan Success Criteria 평가

| Criteria | Status | Evidence |
|----------|:------:|---------|
| 코어 루프 완성 (인터뷰→캐릭터+배경+TTS→슬라이드쇼 MP4) | ⚠️ Partial | 코드 구조 존재하나 API 인증 없이 동작, prefix 불일치로 연결 안 됨 |
| LangGraph 인터뷰 엔진 (시기별 분기, 세션 저장) | ✅ Met | `graphs/interview_graph.py` + 7 nodes + MemorySaver |
| 얼굴→카툰 캐릭터 생성 → 재생성 | ✅ Met | `character_service.py` + `CharacterPreview.tsx` |
| 시대배경 자동 생성 | ✅ Met | `background_service.py` + `era_db.py` (7개 연대) |
| 보이스 클로닝/샘플 TTS | ✅ Met | `voice_service.py` + 5개 엔드포인트 |
| 가드레일 5개 영역 | ✅ Met | content_filter, pii_detector, nsfw_filter, voice_consent, cost_limiter |
| 카카오 로그인 | ✅ Met | Supabase Auth + middleware + KakaoLoginButton |
| 프로젝트 CRUD | ✅ Met | projectStore + dashboard + CRUD UI |

---

## 5. Match Rate 계산

```
Static Only (서버 미실행):
  Structural  = (93 + 93 + 70 + 100) / 4 = 89% → × 0.2 = 17.8
  Functional  = (G1 Critical 감점 -15, G2-G7 -5 each) → 55% → × 0.4 = 22.0
  Contract    = 82% → × 0.4 = 32.8

  Overall = 17.8 + 22.0 + 32.8 = 72.6% ≈ 73%
```

**Overall Match Rate: 73%** (목표: 90%)

---

## 6. Gap 우선순위 정리

| 순위 | Gap | 심각도 | 수정 난이도 |
|:----:|-----|:------:|:---------:|
| 1 | **G1: JWT 인증 미구현** | Critical | 중간 (1파일 + Depends 추가) |
| 2 | **G3: API prefix 불일치** (generate→generation) | Important | 쉬움 (rename) |
| 3 | **G2: story/[era] 페이지 누락** | Important | 쉬움 (1페이지) |
| 4 | **G4: SuggestedQuestions 미구현** | Important | 쉬움 (1컴포넌트) |
| 5 | **G5: CharacterStyleSelector 미구현** | Important | 쉬움 (1컴포넌트) |
| 6 | **G6: StoryEditor 미구현** | Important | 중간 (편집 로직) |
| 7 | **G7: Pydantic schemas 중앙화** | Minor | 리팩토링 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-31 | Initial Gap Analysis — Static Only (서버 미실행) |
