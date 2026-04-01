# AI 셀프 다큐멘터리 Planning Document

> **Summary**: AI 인터뷰/템플릿으로 인생 스토리 수집 → 카툰 캐릭터 + 시대배경 + TTS 나레이션 다큐멘터리 자동 생성 플랫폼
>
> **Project**: AI 셀프 다큐멘터리
> **Author**: 사용자 + AI 협업
> **Date**: 2026-03-30
> **Status**: Draft
> **PRD Reference**: `docs/00-pm/ai-self-documentary.prd.md` (v0.3)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 개인의 소중한 삶의 이야기를 전문적 다큐멘터리로 기록하고 싶지만, 전문 제작팀 없이는 불가능하며 기존 AI 도구는 개인 서사에 특화되지 않음 |
| **Solution** | AI 인터뷰/템플릿으로 인생 스토리 수집 → 얼굴 기반 귀여운 카툰 캐릭터 + 시대배경 이미지 슬라이드쇼 + 보이스 클로닝/샘플 TTS 나레이션이 결합된 1~2분 다큐멘터리 자동 생성 |
| **Function/UX Effect** | 프로필 입력 → 인터뷰/작성 → 캐릭터+배경 생성 → 슬라이드쇼+TTS 다큐 1-click 생성. 10년 단위(10대/20대/30대...) 시기별 구성 |
| **Core Value** | "모든 사람의 삶에는 다큐멘터리로 남길 가치가 있다" — 나를 닮은 귀여운 캐릭터가 시대배경 속에서 내 인생을 살아가는 영상 |

---

## Context Anchor

> PRD → Plan 컨텍스트 연속성 보장. Design/Do 문서로 전파.

| Key | Value |
|-----|-------|
| **WHY** | 전문 다큐 제작팀 없이 개인 인생 다큐멘터리를 만들 방법이 없음. 기존 도구는 텍스트 회고록(StoryWorth) 또는 범용 AI 영상(Mootion)뿐, "개인 서사 + 캐릭터 영상"의 교차점이 비어 있음 |
| **WHO** | Beachhead: "효도 기록자" (30-50대, 부모님 이야기 기록 희망). Secondary: 셀프 브랜더(20대), 인생 기념자(50대+) |
| **RISK** | (1) 캐릭터 유사성 불만족 (2) 다중 AI 파이프라인 비용 폭증 (3) 개인정보(얼굴/음성/인생사) 신뢰 (4) 인터뷰 완료율 저조 |
| **SUCCESS** | MVP 100명 사용자, 인터뷰 완료율 60%+, 다큐 생성 완료율 70%+, NPS 40+ |
| **SCOPE** | MVP: 코어 루프(입력→생성→출력) / v1: 차별화+바이럴 / v2: 개인화 심화+수익화 |

---

## 1. Overview

### 1.1 Purpose

AI 기술을 활용하여 누구나 전문 제작팀 없이 자신의 인생 이야기를 귀여운 카툰 스타일의 다큐멘터리 영상으로 자동 제작할 수 있는 웹 플랫폼을 구축한다.

### 1.2 Background

- 고령화 사회에서 부모/조부모 세대의 이야기를 보존하려는 수요 급증
- 기존 회고록 서비스(StoryWorth, Legacium)는 텍스트만 지원
- 기존 AI 영상 도구(Mootion, HeyGen)는 개인 서사에 특화되지 않음
- **"개인 서사 깊이 + 멀티미디어 영상 출력"** 교차점이 미개척 상태
- AI 이미지/음성 생성 기술 성숙으로 실현 가능성 확보

### 1.3 Related Documents

- PRD: `docs/00-pm/ai-self-documentary.prd.md`
- ADR: PRD Appendix B (ADR-001~003)

### 1.4 Key Decisions from Checkpoint

| 항목 | 결정 | 근거 |
|------|------|------|
| **인생 시기 구분** | 10년 단위 고정 (10대/20대/30대...) | 시대배경 DB 매칭 단순화, 사용자 인지 부하 낮음 |
| **개인정보 입력** | 사용자 프로필 폼 (생년 등 직접 입력) | 시대배경 연도 정확한 자동 계산에 필수 |
| **MVP 영상 형태** | 이미지 슬라이드쇼 + TTS | AI 영상생성 API 비용/품질 리스크 제거. 이미지+TTS는 안정적이고 비용 예측 가능 |

---

## 2. Scope

### 2.1 In Scope (MVP)

- [x] 사용자 프로필 폼 (이름, 생년, 성별 등 기본 정보 입력)
- [x] LLM 적응형 AI 인터뷰 (LangGraph 기반, 10년 단위 시기별 질문 분기)
- [x] 인생 스토리 템플릿 작성 (예시 글 기반 자유 작성, 인터뷰 대안)
- [x] 서사 구조화 엔진 (인터뷰/템플릿 내용 → 시기별 기승전결 자동 편성)
- [x] 얼굴 업로드 → 귀여운 AI 카툰 캐릭터 생성
- [x] 시대배경 AI 생성 (생년 + 시기 → 연도 자동 계산 → 시대정보 수집 → 배경 이미지 생성)
- [x] 보이스 시스템 (보이스 클로닝 OR 샘플 보이스 선택 → TTS 나레이션)
- [x] 이미지 슬라이드쇼 + TTS 다큐멘터리 생성 (캐릭터+배경 이미지 연속 재생 + 나레이션)
- [x] 사용자 인증 (카카오/이메일 소셜 로그인)
- [x] 프로젝트 관리 (CRUD)
- [x] MP4 내보내기/다운로드
- [x] AI 가드레일 (민감 콘텐츠, NSFW, PII, 보이스 동의)

### 2.2 Out of Scope (v1/v2로 연기)

- 에피소드 시리즈 시스템 (v1)
- 명대사 카드 자동 생성 (v1)
- 캐릭터 나이 변화/에이징 (v1)
- BGM 시대 매칭 (v1)
- 스토리보드 미리보기/수정 (v1)
- AI 동영상 생성 (Runway/Kling — v2, 슬라이드쇼로 충분히 검증 후)
- 사진 삽입 액자 효과 (v2)
- 감정 곡선 반영 (v2)
- 공유/결제/구독 시스템 (v2)
- 가족 협업 모드 (v2)

---

## 3. Requirements

### 3.1 Functional Requirements (MVP)

| ID | Requirement | Priority | Status |
|----|-------------|:--------:|:------:|
| FR-01 | **LLM 적응형 AI 인터뷰**: LangGraph StateGraph 기반. 사용자 답변에 따라 질문 분기. 10년 단위 시기별 구조화된 흐름. 세션 저장/이어하기 (체크포인터) | High | Pending |
| FR-02 | **인생 스토리 템플릿 작성**: 시기별 예시 글 제공, 사용자가 자유 텍스트 입력. 인터뷰 대안 입력 방식 | High | Pending |
| FR-03 | **서사 구조화 엔진**: 인터뷰/템플릿 내용을 시기별 기승전결 다큐 서사로 자동 편성. 나레이션 스크립트 생성 | High | Pending |
| FR-04 | **얼굴 업로드 → AI 카툰 캐릭터**: 사진 업로드 → 동글동글 귀여운 카툰 스타일 캐릭터 생성. 재생성 가능 | High | Pending |
| FR-05 | **시대배경 AI 생성**: 생년 + 시기(10대/20대...) → 연도 자동 계산 → 한국 시대 DB + LLM으로 시대정보 수집 → 배경 이미지 생성 | High | Pending |
| FR-06 | **보이스 시스템**: (A) 음성 녹음 → 보이스 클로닝 TTS (B) 샘플 보이스 선택 → TTS. 둘 중 택 1 → 나레이션 적용 | High | Pending |
| FR-07 | **다큐멘터리 생성**: 캐릭터+배경 이미지 슬라이드쇼 + TTS 나레이션 합성 → 1~2분 MP4 영상 | High | Pending |
| FR-08 | **사용자 프로필 폼**: 이름, 생년, 성별 등 기본 정보 입력 폼. 시대배경 자동 계산의 기반 데이터 | High | Pending |
| FR-09 | **사용자 인증**: 카카오 소셜 로그인 + 이메일 로그인 (Supabase Auth) | High | Pending |
| FR-10 | **프로젝트 관리**: 다큐 프로젝트 생성/편집/삭제/목록. Supabase DB CRUD | High | Pending |
| FR-11 | **내보내기/다운로드**: 생성된 다큐를 MP4로 다운로드 | High | Pending |
| FR-12 | **AI 가드레일**: 인터뷰 민감 콘텐츠 감지, 캐릭터 NSFW 차단, 보이스 클로닝 동의, PII 마스킹 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| **Performance** | 인터뷰 응답 < 3초, 슬라이드쇼 다큐 생성 < 3분 | 서버 모니터링 |
| **Security** | 개인 데이터 암호화 (AES-256), HTTPS 필수 | 보안 감사 |
| **Privacy** | 얼굴/음성/인터뷰 데이터 완전 삭제 권한, 보이스 클로닝 동의 | PIPA 준수 |
| **Scalability** | 동시 50 사용자 인터뷰 세션 | 부하 테스트 |
| **Accessibility** | 고령자 친화 UI (큰 글씨, 단순 플로우) | 사용자 테스트 |
| **i18n** | 한국어 전용 (MVP) | - |
| **Cost** | 다큐 1건 생성 비용 < $1 (이미지+TTS 기준) | API 비용 모니터링 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 코어 루프 완성: 인터뷰/템플릿 → 캐릭터+배경+TTS → 슬라이드쇼 다큐 MP4 다운로드
- [ ] LangGraph 인터뷰 엔진 동작: 10년 단위 시기별 질문 분기, 세션 저장/이어하기
- [ ] 얼굴 업로드 → 카툰 캐릭터 생성 → 재생성 가능
- [ ] 시대배경 자동 생성: 생년 기반 연도 계산 → 시대정보 → 배경 이미지
- [ ] 보이스 클로닝 OR 샘플 TTS 나레이션 동작
- [ ] 가드레일 5개 영역 적용
- [ ] 카카오 로그인 동작
- [ ] 프로젝트 CRUD 동작

### 4.2 Quality Criteria

- [ ] 프론트엔드 Lighthouse Performance > 80
- [ ] API 응답 에러율 < 5%
- [ ] 캐릭터 생성 성공률 > 95%
- [ ] TTS 생성 성공률 > 95%
- [ ] Zero lint errors (ESLint + Ruff)
- [ ] 프론트/백엔드 빌드 성공

### 4.3 Business Criteria (PRD 기반)

- [ ] 파일럿 테스트 10명 → 인터뷰 완료율 60%+
- [ ] 다큐 생성 완료율 70%+
- [ ] 사용자 만족도 NPS 40+
- [ ] 다큐 1건 생성 비용 < $1

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| 캐릭터가 얼굴과 닮지 않아 사용자 실망 | Critical | High | 복수 스타일 프리셋, 재생성 옵션, 얼굴 특징 보존 파라미터 PoC |
| 다중 AI API 비용 폭증 (캐릭터+배경+TTS) | Critical | Medium | 이미지 슬라이드쇼로 영상 생성 비용 제거. 캐싱. 건당 비용 모니터링 |
| 개인정보(얼굴/음성/인생사) 신뢰 문제 | Critical | Medium | Privacy by Design. 데이터 삭제 권한. 보이스 동의 UI |
| LangGraph 학습 곡선 (Python AI 초보) | High | High | Phase 0에서 LangGraph 튜토리얼 먼저 완료. 단순 3-노드 그래프부터 시작 |
| 인터뷰 완료율 저조 | High | High | 템플릿 작성 대안 제공. 짧은 세션(5-10분). 진행률 시각화 |
| 시대배경 고증 부정확 | Medium | Medium | 한국 시대 이벤트 DB 사전 구축. LLM 교차 검증 |
| 보이스 클로닝 품질 부자연스러움 | Medium | Medium | 샘플 보이스 대안 항상 제공. 30초+ 녹음 가이드 |
| Next.js ↔ FastAPI 통신 복잡도 | Medium | Medium | Proxy 패턴으로 단순화. API 계약 먼저 정의 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

> 신규 프로젝트이므로 기존 리소스 변경 없음. 신규 생성 목록:

| Resource | Type | Description |
|----------|------|-------------|
| Supabase 프로젝트 | 인프라 | Auth, DB, Storage 설정 |
| FastAPI 서버 | 백엔드 | Python AI 파이프라인 서버 |
| Next.js 앱 | 프론트엔드 | 사용자 UI |
| LangGraph 인터뷰 그래프 | AI 엔진 | 적응형 인터뷰 StateGraph |
| 한국 시대 이벤트 DB | 데이터 | 연도별 한국 시대정보 JSON/DB |

### 6.2 Current Consumers

N/A (신규 프로젝트)

### 6.3 External Dependencies

| Dependency | Purpose | Risk Level | Fallback |
|------------|---------|:----------:|----------|
| OpenAI GPT-4o API | 인터뷰 대화, 서사 구조화 | Medium | Claude API |
| DALL-E 3 / Flux API | 캐릭터, 배경 이미지 생성 | High | Stable Diffusion 로컬 |
| ElevenLabs API | 보이스 클로닝 + TTS | Medium | CLOVA Voice |
| Supabase | Auth, DB, Storage | Low | 직접 PostgreSQL + S3 |
| FFmpeg | 슬라이드쇼 + TTS → MP4 합성 | Low | 없음 (필수) |

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 7.2 Key Architectural Decisions (ADR 참조)

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 아키텍처 패턴 | 올 TS / 올 Python / 하이브리드 | **하이브리드 (Next.js + FastAPI)** | AI 생태계 Python 집중, 프론트 기존 역량 TS (ADR-002) |
| AI 오케스트레이션 | 전체 LangGraph / 전체 Pipeline / 하이브리드 | **LangGraph(인터뷰) + DAG(생성)** | 판단 필요한 부분만 Agentic, 나머지 Pipeline (ADR-001) |
| 가드레일 | 없음 / 부분 적용 / 전면 적용 | **5개 영역 전면 적용** | 얼굴/음성/인생사 민감 데이터 특성상 필수 (ADR-003) |
| Frontend | Next.js / React / Vue | **Next.js 15 (App Router)** | SSR, React 생태계, 개발자 역량 |
| State Management | Context / Zustand / Redux | **Zustand + React Query** | 경량 + AI 백엔드 서버 상태 관리 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS + shadcn/ui** | 빠른 UI, 일관 디자인 |
| Backend/BaaS | Supabase / Firebase / 직접 구축 | **Supabase** | Auth+DB+Storage 올인원 |
| MVP 영상 형태 | AI 영상 / 슬라이드쇼 | **이미지 슬라이드쇼 + TTS** | 비용/품질 리스크 제거 (Checkpoint 결정) |
| 시기 구분 | 10년 고정 / 자유 / 둘 다 | **10년 단위 고정** | 시대배경 DB 매칭 단순화 (Checkpoint 결정) |
| Deploy | Vercel+Railway / AWS / GCP | **Vercel(FE) + Railway(AI BE)** | 독립 배포, 스케일링 분리 |

### 7.3 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Client — Next.js 15 (TypeScript)              │
│  프로필폼 | 인터뷰챗 | 템플릿작성 | 업로더 | 플레이어    │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Next.js API Routes (Proxy Layer)              │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
          ┌──────────────┼──────────────┐
          ▼                              ▼
┌─────────────────────┐   ┌────────────────────────────────┐
│  LangGraph (Agentic) │   │  Generation Pipeline (DAG)      │
│  인터뷰 엔진         │   │  캐릭터+배경+TTS → 슬라이드쇼   │
│  + 가드레일           │──→│  + 가드레일 → MP4 합성 (FFmpeg)  │
│  + 체크포인터         │   │                                  │
└─────────────────────┘   └────────────────────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   Supabase (BaaS)                          │
│  Auth / PostgreSQL DB / Storage (S3) / Realtime            │
└──────────────────────────────────────────────────────────┘
```

### 7.4 Folder Structure (Preview)

```
ai-self-documentary/
├── frontend/                     # Next.js 15 (TypeScript)
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (auth)/           # 로그인/회원가입
│   │   │   ├── dashboard/        # 프로젝트 목록
│   │   │   ├── project/[id]/     # 프로젝트 상세
│   │   │   │   ├── interview/    # AI 인터뷰
│   │   │   │   ├── template/     # 템플릿 작성
│   │   │   │   ├── character/    # 캐릭터 생성
│   │   │   │   ├── voice/        # 보이스 설정
│   │   │   │   ├── generate/     # 다큐 생성
│   │   │   │   └── result/       # 결과 플레이어
│   │   │   └── profile/          # 프로필 폼
│   │   ├── components/           # 공통 UI 컴포넌트
│   │   ├── lib/                  # Supabase 클라이언트, API 호출
│   │   ├── stores/               # Zustand stores
│   │   └── types/                # TypeScript 타입
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                      # Python FastAPI
│   ├── app/
│   │   ├── main.py               # FastAPI 앱 엔트리
│   │   ├── api/                   # API 라우터
│   │   │   ├── interview.py       # 인터뷰 엔드포인트
│   │   │   ├── character.py       # 캐릭터 생성
│   │   │   ├── background.py      # 배경 생성
│   │   │   ├── voice.py           # TTS/클로닝
│   │   │   └── documentary.py     # 다큐 생성
│   │   ├── graphs/                # LangGraph 정의
│   │   │   ├── interview_graph.py # 인터뷰 StateGraph
│   │   │   └── nodes/             # 그래프 노드들
│   │   ├── pipeline/              # 생성 파이프라인 (DAG)
│   │   │   ├── character_gen.py
│   │   │   ├── background_gen.py
│   │   │   ├── tts_gen.py
│   │   │   └── slideshow_gen.py
│   │   ├── guardrails/            # 가드레일
│   │   │   ├── content_filter.py
│   │   │   ├── nsfw_checker.py
│   │   │   └── pii_detector.py
│   │   ├── data/                  # 한국 시대 이벤트 DB
│   │   │   └── era_events.json
│   │   └── core/                  # 설정, DB 연결
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docs/                          # PDCA 문서
└── supabase/                      # Supabase 마이그레이션
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] `CLAUDE.md` — 미작성 (프로젝트 시작 전)
- [ ] ESLint — 미설정
- [ ] Prettier — 미설정
- [ ] TypeScript — 미설정
- [ ] Ruff (Python) — 미설정

### 8.2 Conventions to Define

| Category | To Define | Priority |
|----------|-----------|:--------:|
| **Naming (TS)** | camelCase 변수/함수, PascalCase 컴포넌트, kebab-case 파일 | High |
| **Naming (Python)** | snake_case 변수/함수, PascalCase 클래스 | High |
| **Folder structure** | 위 7.4 구조 준수 | High |
| **API contract** | Next.js ↔ FastAPI REST 엔드포인트 명세 | High |
| **Error handling** | TS: try-catch + toast, Python: HTTPException + structured errors | Medium |
| **Environment variables** | `.env.local` (FE), `.env` (BE) 분리 | Medium |

### 8.3 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Frontend |
| `NEXT_PUBLIC_API_URL` | FastAPI 백엔드 URL | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 | Backend |
| `OPENAI_API_KEY` | GPT-4o API | Backend |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS/클로닝 | Backend |
| `DALLE_API_KEY` | DALL-E 이미지 생성 (또는 OPENAI_API_KEY 공유) | Backend |

---

## 9. Implementation Phases

### Phase 0: 학습 + 환경 설정

- [ ] Python FastAPI 기초 학습
- [ ] LangGraph 튜토리얼 완료 (3-노드 그래프)
- [ ] Next.js 15 + Supabase 프로젝트 세팅
- [ ] FastAPI 프로젝트 세팅 + Hello World API 연동 확인
- [ ] 외부 AI API 키 발급 및 테스트 (OpenAI, ElevenLabs)

### Phase 1: 인터뷰 엔진 (LangGraph)

- [ ] LangGraph StateGraph 기본 구조 구현
- [ ] 인터뷰 질문 생성 노드 구현
- [ ] 답변 분석 + 분기 판단 노드 구현
- [ ] 가드레일 노드 (민감 콘텐츠 감지) 구현
- [ ] 체크포인터 (세션 저장/이어하기) 구현
- [ ] 서사 구조화 노드 구현

### Phase 2: 캐릭터 + 배경 생성

- [ ] 얼굴 업로드 API (Supabase Storage)
- [ ] 카툰 캐릭터 생성 API (DALL-E/SD)
- [ ] 생년 + 시기 → 연도 계산 로직
- [ ] 한국 시대 이벤트 DB 구축 (JSON)
- [ ] 시대배경 이미지 생성 API

### Phase 3: 보이스 + 다큐 생성

- [ ] 음성 녹음 → 보이스 클로닝 (ElevenLabs)
- [ ] 샘플 보이스 목록 + TTS 생성
- [ ] 나레이션 스크립트 → TTS 오디오 생성
- [ ] 이미지 슬라이드쇼 + TTS → MP4 합성 (FFmpeg)
- [ ] 다운로드 기능

### Phase 4: 프론트엔드 + 통합

- [ ] 사용자 인증 (Supabase Auth + 카카오)
- [ ] 프로필 폼 페이지
- [ ] 인터뷰 채팅 UI
- [ ] 템플릿 작성 UI
- [ ] 캐릭터/보이스 설정 UI
- [ ] 다큐 생성 + 결과 플레이어 UI
- [ ] 프로젝트 대시보드

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`/pdca design ai-self-documentary`)
2. [ ] Phase 0 학습 + 환경 설정
3. [ ] 구현 시작 (`/pdca do ai-self-documentary`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-30 | Initial Plan — PRD v0.3 기반, Checkpoint 1/2 완료 | 사용자 + AI 협업 |
