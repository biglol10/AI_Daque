# AI 셀프 다큐멘터리 — Feature Backlog & 적용 가이드

> **Purpose**: MVP 이후 적용할 기능 목록 + 각 기능을 Claude에게 요청하는 방법
> **Last Updated**: 2026-03-31
> **Source**: Discovery Analysis + PRD v0.3 + PDCA Report

---

## 사용법

각 기능에 **"Claude에게 이렇게 말하세요"** 섹션이 있습니다. 해당 텍스트를 복사해서 Claude에게 보내면 됩니다. 필요에 따라 세부 사항을 수정하세요.

---

## Phase 0: MVP 보완 (환경 세팅 후 즉시)

### 0-1. 환경 세팅 + 첫 실행

> **이것부터 해야 합니다.** 코드는 있지만 한 번도 실행한 적 없습니다.

**해야 할 일**:
1. Supabase 프로젝트 생성 + 테이블 마이그레이션 (001_initial.sql)
2. API 키 발급 (OpenAI, ElevenLabs)
3. `.env.local`, `.env` 파일 생성 (example 파일 참고)
4. `docker compose up` (FastAPI + Redis)
5. `npm run dev` (Next.js)
6. 카카오 로그인 → 프로필 설정 → 인터뷰 시도

**Claude에게 이렇게 말하세요**:
```
Supabase 프로젝트를 생성하고 환경 세팅을 도와줘.
1. supabase/migrations/001_initial.sql을 Supabase Dashboard에서 실행하는 방법
2. .env.local과 backend/.env 파일을 실제 키로 채우기
3. docker compose up으로 백엔드 실행
4. npm run dev로 프론트 실행
5. 카카오 OAuth Provider 설정 방법
```

---

### 0-2. JWT Depends 각 라우터에 적용

> **현재 상태**: `core/auth.py`에 `verify_token` 함수가 있지만, 각 API 엔드포인트에 `Depends(verify_token)`이 추가되지 않았습니다. 모든 API가 인증 없이 호출 가능합니다.

**Claude에게 이렇게 말하세요**:
```
backend/app/core/auth.py에 verify_token 함수가 있는데,
backend/app/api/ 아래 모든 라우터(interview.py, narrative.py, generation.py, voice.py, documentary.py)의
각 엔드포인트에 Depends(verify_token)을 추가해줘.
또한 Next.js BFF 프록시(frontend/src/app/api/*/route.ts)에서 Supabase 세션 토큰을
Authorization 헤더로 FastAPI에 전달하도록 수정해줘.
```

---

### 0-3. 핵심 문장 하이라이트 추출 (Solution 2C)

> **현재 상태**: 서사 구조화는 있지만 "인생 명언 5문장" 추출 기능이 없습니다.
> **효과**: "내 영상" 소유감 향상, 명대사 카드(v1)의 기반

**Claude에게 이렇게 말하세요**:
```
backend/app/services/narrative_engine.py의 structure_narrative 함수에서
서사 구조화할 때 "인생 명언 5문장(highlight_quotes)"도 같이 추출하도록 수정해줘.
GPT-4o 프롬프트에 "사용자의 답변 중 가장 인상적인 문장 5개를 원문 그대로 추출"하라는
지시를 추가하고, 응답 JSON에 highlight_quotes 필드를 추가해줘.
프론트엔드의 StoryViewer 컴포넌트에도 명언 5문장을 보여주는 섹션을 추가해줘.
```

---

### 0-4. 감정 과몰입 가드레일 강화 (Solution 1E)

> **현재 상태**: `content_filter.py`에 키워드 매칭만 있고, 감정 패턴 감지나 민감 주제 진입 전 동의 화면이 없습니다.
> **효과**: 윤리적 리스크 감소, 사용자 신뢰 향상

**Claude에게 이렇게 말하세요**:
```
인터뷰 가드레일을 강화해줘.
1. backend/app/guardrails/content_filter.py에 감정 과몰입 패턴 감지를 추가해줘.
   키워드뿐 아니라 "연속 3회 이상 부정 감정 답변" 같은 패턴도 감지
2. backend/app/graphs/nodes/guardrail.py에서 민감 주제(가족 갈등, 건강 이슈, 사별)
   진입 전 "이 주제에 대해 이야기해도 괜찮으신가요?" 동의 메시지를 보내는 로직 추가
3. 프론트엔드 ChatInterface에서 동의 버튼 UI 처리
```

---

## Phase 1: v1 기능 (MVP 검증 후)

### 1-1. 에피소드 시리즈 (Solution 4A)

> **효과**: 재방문 동기 부여. "한 번 만들고 끝" 문제 해결. 구독 모델의 핵심
> **Discovery 실험**: E11 — 단일 영상 vs 에피소드 3편 재방문율 비교

**Claude에게 이렇게 말하세요**:
```
에피소드 시리즈 기능을 구현해줘.
현재는 프로젝트 하나에 영상 하나인데, 시기별(10대편, 20대편, 30대편...)로
에피소드를 분리하고 시리즈로 묶는 기능이 필요해.

구체적으로:
1. Supabase documentaries 테이블에 episode_number, series_id 컬럼 추가
2. 프로젝트 오버뷰 페이지에서 시기별 에피소드 목록 표시
3. 각 에피소드별 독립 생성 + 시리즈 순서 관리
4. "다음 편 예고" 화면 (다음 시기 미리보기 텍스트)
5. 시리즈 전체 재생 기능 (에피소드 연속 재생)

Design 문서: docs/02-design/features/ai-self-documentary.design.md
PRD Feature Idea Matrix #3 참조
```

---

### 1-2. 명대사 카드 (Solution 1D)

> **효과**: SNS 공유 최소 단위. 영상 완성 전에도 바이럴 가능
> **Discovery 실험**: E10 — 카드 CTA vs 영상 CTA 공유 전환율 A/B
> **의존성**: 0-3 (핵심 문장 하이라이트 추출)이 선행되어야 함

**Claude에게 이렇게 말하세요**:
```
명대사 카드 자동 생성 기능을 구현해줘.
인터뷰 중 추출된 highlight_quotes를 캐릭터 이미지 + 텍스트로 합성한
이미지 카드(1080x1080, SNS 최적화)를 자동 생성하는 기능이야.

구체적으로:
1. backend에 카드 생성 서비스 추가 (캐릭터 이미지 + 텍스트 오버레이, Pillow 또는 FFmpeg)
2. 카드 생성 API 엔드포인트 추가
3. 프론트엔드에 QuoteCard 컴포넌트 (카드 미리보기 + SNS 공유 버튼)
4. 인터뷰 완료 후 자동으로 명대사 카드 3~5장 생성
5. 카드 이미지 Supabase Storage에 저장

PRD Feature Idea Matrix #4 참조
Discovery Analysis Solution 1D 참조
```

---

### 1-3. 캐릭터 나이 변화/에이징 (Solution 2F)

> **효과**: 시대배경과 연동 시 "내 인생 여정" 시각화. 에피소드 시리즈와 시너지
> **Discovery 실험**: E8 확장 — 에이징 전/후 동일 인물 인식률 측정 (80% 목표)
> **의존성**: 1-1 (에피소드 시리즈)과 함께 적용하면 효과 극대화

**Claude에게 이렇게 말하세요**:
```
캐릭터 나이 변화(에이징) 기능을 구현해줘.
현재는 하나의 캐릭터 이미지만 생성되는데, 시기별로 다른 나이의 캐릭터가 필요해.

구체적으로:
1. backend/app/services/character_service.py에 에이징 로직 추가
   - 10대: 어린 카툰 캐릭터 (교복, 작은 체형)
   - 20대: 청년 캐릭터
   - 30대+: 성인 캐릭터 (점진적 변화)
2. DALL-E 프롬프트에 나이대별 외형 차이를 반영하되 얼굴 특징은 유지
3. characters 테이블에 era 컬럼으로 시기별 캐릭터 관리
4. 프론트엔드에서 시기별 캐릭터 미리보기 그리드

PRD Feature Idea Matrix #5 참조
현재 캐릭터 생성 코드: backend/app/services/character_service.py
시대별 외형 매핑: backend/app/data/era_db.py
```

---

### 1-4. BGM 시대 매칭 (Solution 4B)

> **효과**: 청각적 몰입감. 구현 비용 낮고 효과 즉각적
> **Discovery**: 에피소드 시리즈와 결합 시 시리즈 각 편의 "분위기 차이" 극대화

**Claude에게 이렇게 말하세요**:
```
시대배경에 맞는 BGM 자동 매칭 기능을 구현해줘.

구체적으로:
1. backend/app/data/era_db.py에 시대별 BGM 키워드/분위기 데이터 추가
   (80년대: 신스팝/트로트, 90년대: 댄스/서태지, 2000년대: K-pop 등)
2. 라이센스 프리 BGM 라이브러리 연동 (Pixabay Audio API 또는 로컬 BGM 파일)
   또는 Suno AI API로 시대풍 BGM 생성
3. backend/app/services/composition_service.py에서 FFmpeg 합성 시
   나레이션 뒤에 배경음악을 낮은 볼륨으로 믹싱
4. 프론트엔드에서 BGM 미리듣기 + 선택 UI

PRD Feature Idea Matrix #10 참조
현재 합성 코드: backend/app/services/composition_service.py
```

---

### 1-5. 스토리보드 미리보기/수정 (Plan FR-15)

> **효과**: AI 결과물 불만족 시 처음부터 재생성 방지. 이탈 감소
> **Discovery**: Solution 2C (편집 가능성)의 확장

**Claude에게 이렇게 말하세요**:
```
최종 영상 생성 전에 스토리보드 미리보기 기능을 구현해줘.

구체적으로:
1. 생성 페이지(/generate)에서 "바로 생성" 대신 "스토리보드 미리보기" 단계 추가
2. 장면별 캐릭터+배경 썸네일 + 나레이션 텍스트를 카드 형태로 나열
3. 각 장면에 "이 장면 다시 만들어줘" 버튼 (배경 또는 캐릭터 재생성)
4. 나레이션 톤 조절 옵션 (감동적/담담한/유쾌한)
5. 확인 후 "최종 생성" 버튼으로 FFmpeg 합성 진행

현재 생성 페이지: frontend/src/app/(main)/projects/[projectId]/generate/page.tsx
Design §11.3 Session Guide 참조
```

---

### 1-6. 사진 업로드 → 추억 기반 자동 질문 (Solution 1C)

> **효과**: 인터뷰 완료율 개선. "이 사진은 언제인가요?"로 이야기 시작이 쉬워짐
> **Discovery**: Opportunity 1 ("이야기 꺼내기 어려움") 직접 대응

**Claude에게 이렇게 말하세요**:
```
인터뷰 시작 시 사진 업로드 기반 질문 생성 기능을 추가해줘.

구체적으로:
1. 인터뷰 시작 페이지에 "사진으로 시작하기" 옵션 추가
2. 사용자가 당시 사진(졸업사진, 가족사진 등)을 업로드
3. GPT-4o Vision으로 사진 분석 (시기 추정, 장소, 인물, 분위기)
4. 분석 결과를 기반으로 첫 질문 자동 생성
   ("이 사진은 학교 앞에서 찍은 것 같은데, 그때 학교생활은 어땠나요?")
5. LangGraph 인터뷰 그래프의 greeting 노드에 사진 컨텍스트 주입

현재 인터뷰 엔진: backend/app/graphs/nodes/greeting.py
현재 얼굴 업로드: frontend/src/components/character/FaceUploader.tsx (재활용 가능)
```

---

### 1-7. 인터뷰어 캐릭터 페르소나 선택 (Ideation Pool #6)

> **효과**: 인터뷰 편안함 개선. 사용자가 원하는 스타일의 인터뷰어 선택
> **Discovery**: Opportunity 1 하위

**Claude에게 이렇게 말하세요**:
```
AI 인터뷰어의 페르소나를 사용자가 선택할 수 있게 해줘.

구체적으로:
1. 인터뷰 시작 전 인터뷰어 선택 UI (3~4개 페르소나)
   - "따뜻한 이웃 언니/오빠" (친근, 격려형)
   - "다큐 PD" (전문적, 구조적 질문)
   - "오래된 친구" (편안, 대화형)
2. 선택된 페르소나에 따라 LangGraph의 ask_question 노드 시스템 프롬프트 변경
3. 인터뷰 메시지의 어조/호칭이 페르소나에 맞게 변화

현재 질문 생성: backend/app/graphs/nodes/ask_question.py
```

---

### 1-8. 감정 지도 UI (Ideation Pool #7)

> **효과**: 인터뷰 완료 후 보상감. 공유 가능한 콘텐츠
> **Discovery**: Opportunity 2 하위

**Claude에게 이렇게 말하세요**:
```
인터뷰 완료 후 감정 지도(Emotion Map) UI를 구현해줘.

구체적으로:
1. 인터뷰에서 추출된 emotions 데이터(이미 InterviewState에 있음)를 시각화
2. 시기별 감정 흐름 차트 (x: 질문 순서, y: 감정 강도, 색상: 감정 종류)
3. 감정 키워드 워드클라우드
4. "나의 인생 감정 지도" 이미지로 내보내기 (SNS 공유용)
5. 인터뷰 완료 페이지에 감정 지도 섹션 추가

현재 감정 데이터: backend/app/graphs/nodes/analyze.py에서 추출
차트 라이브러리: recharts 또는 chart.js 추천
```

---

### 1-9. MediaPipe 브라우저 얼굴 감지

> **효과**: 얼굴 없는 사진 업로드 즉시 차단. GPT-4o Vision 호출 절약 + UX 개선
> **이전 논의**: ONNX/HuggingFace 검토에서 "지금 적용 추천"으로 분류

**Claude에게 이렇게 말하세요**:
```
프론트엔드 FaceUploader 컴포넌트에 MediaPipe 얼굴 감지를 추가해줘.
업로드 전에 브라우저에서 얼굴이 있는지 확인하고, 없으면 "얼굴이 감지되지 않았습니다" 경고.

npm install @mediapipe/tasks-vision
frontend/src/components/character/FaceUploader.tsx 수정
얼굴 감지 실패 시 업로드 차단 + toast 메시지
```

---

### 1-10. NSFW 이미지 분류기 (HuggingFace)

> **효과**: DALL-E 생성 결과물을 실제로 검증. 현재는 프롬프트 키워드만 필터링
> **이전 논의**: "지금 적용 추천"이었지만 서버 설정 필요

**Claude에게 이렇게 말하세요**:
```
DALL-E로 생성된 캐릭터/배경 이미지를 NSFW 분류기로 검증하는 기능을 추가해줘.

HuggingFace의 Falconsai/nsfw_image_detection 모델 사용.
1. backend/requirements.txt에 transformers, torch, Pillow 추가
2. backend/app/guardrails/nsfw_filter.py에 이미지 분류 함수 추가
   (현재는 프롬프트 텍스트만 필터링, 이미지 검증 추가)
3. character_service.py와 background_service.py에서 이미지 생성 후
   NSFW 분류기 통과 여부 확인. 실패 시 재생성
4. CPU 추론으로 충분 (GPU 불필요)
```

---

## Phase 2: v2 기능 (v1 검증 후)

### 2-1. AI 동영상 생성 (Runway/Kling)

> **현재**: 이미지 슬라이드쇼 + TTS. **v2**: 캐릭터가 움직이는 실제 AI 영상
> **Plan 결정**: MVP는 슬라이드쇼, AI 영상은 품질 검증 후 도입

**Claude에게 이렇게 말하세요**:
```
현재 이미지 슬라이드쇼 방식의 다큐 생성을 AI 동영상 생성으로 업그레이드해줘.

구체적으로:
1. Runway ML 또는 Kling API 연동 서비스 추가
2. 캐릭터+배경 이미지를 기반으로 2~5초 AI 영상 클립 생성
3. 기존 FFmpeg 합성 파이프라인에서 이미지 대신 영상 클립 사용
4. 비용 모니터링 (클립당 비용 로깅)
5. 사용자에게 "슬라이드쇼" vs "AI 영상" 선택 옵션 제공

현재 합성: backend/app/services/composition_service.py
비용 제한: backend/app/guardrails/cost_limiter.py
```

---

### 2-2. 사진 삽입 액자 효과 (Solution 2G)

> **효과**: 실제 기억 + AI 콘텐츠 결합 → 소유감 최고조
> **Discovery**: Experiment E3 확장 — 사진 삽입 있을 때/없을 때 비교

**Claude에게 이렇게 말하세요**:
```
다큐 영상에 사용자의 실제 사진을 액자 효과로 삽입하는 기능을 추가해줘.

구체적으로:
1. 시기별 사진 업로드 UI (졸업사진, 가족사진 등)
2. FFmpeg 합성 시 카툰 배경 안에 액자/포토프레임 효과로 실제 사진 배치
3. 액자 스타일 선택 (나무 액자, 폴라로이드, 디지털 프레임)
4. 자연스러운 블렌딩 (약간의 카툰 필터를 사진에도 적용)

현재 합성: backend/app/services/composition_service.py의 build_video_stream 함수
```

---

### 2-3. 감정 곡선 반영 (Plan FR-17)

> **효과**: 장면 톤/캐릭터 표정/BGM이 감정에 맞게 변화. 몰입감 심화

**Claude에게 이렇게 말하세요**:
```
다큐 생성 시 스토리의 감정 곡선을 영상에 반영하는 기능을 추가해줘.

구체적으로:
1. narrative_engine.py에서 장면별 감정 분석 (기쁨/슬픔/그리움/설렘/감동)
2. 감정에 따른 배경 이미지 톤 조절 (슬픈 장면: 어두운 톤, 행복한 장면: 밝은 톤)
3. FFmpeg color overlay 필터로 감정별 색감 적용
4. BGM 매칭(1-4)과 연동: 감정에 맞는 BGM 구간 자동 매핑
5. TTS 음성 속도/톤 미세 조정 (감동적 부분: 느리게)
```

---

### 2-4. 내레이션 말투 학습 (Solution 2H)

> **효과**: "내가 말하는 것처럼" 느껴지는 나레이션. 개인화 최상위
> **Discovery**: Experiment E4 확장 — 말투 학습 적용 vs 표준 스크립트 비교

**Claude에게 이렇게 말하세요**:
```
사용자의 말투 패턴을 학습해서 나레이션 스크립트에 반영하는 기능을 추가해줘.

구체적으로:
1. 인터뷰 답변 텍스트에서 개인 어휘/문장 구조 패턴 추출
   (자주 쓰는 표현, 문장 길이, 종결 어미 패턴)
2. narrative_engine.py의 나레이션 스크립트 생성 시 말투 패턴을
   시스템 프롬프트에 주입 ("이 사용자는 ~거든요, ~잖아요 같은 표현을 자주 씀")
3. 생성된 스크립트가 사용자 고유의 화법으로 느껴지도록
```

---

### 2-5. 공유/결제/구독 시스템

> **Discovery**: Solution 3A(무료 미리보기 → 유료), 3B(연간 구독), 3C(가족 팩)

**Claude에게 이렇게 말하세요**:
```
결제 및 구독 시스템을 구현해줘.

구체적으로:
1. Toss Payments 연동 (한국 결제)
2. 가격 모델: 무료(캐릭터 미리보기 30초) / Basic ₩9,900/건 / Premium ₩19,900/월
3. 무료 사용자: 캐릭터 생성 + 30초 미리보기까지 무료, 전체 영상은 결제 후
4. 구독형 연간 다큐멘터리 옵션 (월 ₩9,900)
5. 가족 팩 (3인 묶음 30% 할인, "부모님께 선물하기" CTA)
6. Supabase에 subscriptions, payments 테이블 추가
```

---

### 2-6. 가족 함께 보기 (Solution 4C)

> **효과**: 가족 리액션이 다음 에피소드 제작 동기. 바이럴 루프

**Claude에게 이렇게 말하세요**:
```
완성된 다큐를 가족과 공유하고 리액션을 받는 기능을 구현해줘.

구체적으로:
1. 공유 링크 생성 (로그인 없이 시청 가능한 Signed URL)
2. 시청자가 이모지 리액션 + 짧은 코멘트 남기기 가능
3. 제작자에게 리액션 알림 (이메일 또는 앱 내)
4. "가족이 본 내 다큐" 리액션 모아보기 UI
5. Supabase에 reactions 테이블 추가
```

---

### 2-7. 캐릭터 소품 커스텀 (Solution 4D)

> **효과**: 캐릭터 애착 강화 → 다음 에피소드 제작 동기

**Claude에게 이렇게 말하세요**:
```
캐릭터에 소품(안경, 모자, 악기, 가방 등)을 추가하는 커스텀 기능을 구현해줘.

구체적으로:
1. 소품 카탈로그 (10~20개 아이템, 카테고리별)
2. 캐릭터 생성 시 선택한 소품을 DALL-E 프롬프트에 포함
3. 소품 선택 UI (캐릭터 미리보기 옆에 소품 그리드)
4. 시기별 다른 소품 가능 (10대: 교복+가방, 20대: 기타, 30대: 아이 안고 있는 모습)
```

---

## Discovery 실험 로드맵 (코드 이후)

> 이 실험들은 코드 추가가 아니라 **사용자 검증**입니다. 환경 세팅 후 진행.

| 우선순위 | 실험 | 방법 | 필요한 것 |
|---------|------|------|----------|
| **Week 1** | E12: LangGraph latency | FastAPI 실행 후 3턴 대화 P95 측정 | API 키 + docker compose up |
| **Week 1** | E14: GPU 비용 벤치마크 | 1편 전체 생성 원가 측정 | 모든 API 키 설정 |
| **Week 1** | E1: Fake Door 랜딩페이지 | 현재 랜딩 페이지에 "9,900원" CTA 추가 | Vercel 배포 |
| **Week 2** | E8: 캐릭터 만족도 | 10명에게 캐릭터 생성 → 닮음도/귀여움 평가 | 테스터 모집 |
| **Week 2** | E9: 시대배경 정확도 | 20장 AI 생성 → 해당 시대 경험자 평가 | 테스터 모집 |
| **Week 3** | E2: Wizard of Oz 인터뷰 | 5명 실제 인터뷰 진행 | 앱 동작 상태 |
| **Week 3** | E6: JTBD 인터뷰 | MZ 10명 + 50대+ 5명 인터뷰 | 인터뷰 스크립트 (Discovery 문서에 있음) |

**Claude에게 실험 진행을 요청하려면**:
```
Discovery Analysis 문서의 E12 실험(LangGraph latency 측정)을 진행하려고 해.
FastAPI 백엔드를 실행한 상태에서 인터뷰 API를 3턴 호출하고
P50/P95 응답 시간을 측정하는 스크립트를 만들어줘.
```

---

## 빠른 참조: 기능별 관련 파일

| 기능 영역 | Backend 파일 | Frontend 파일 |
|-----------|-------------|--------------|
| 인터뷰 엔진 | `graphs/`, `graphs/nodes/` | `components/interview/`, `stores/interviewStore.ts` |
| 서사 구조화 | `services/narrative_engine.py` | `components/template/`, `components/story/` |
| 캐릭터 생성 | `services/character_service.py` | `components/character/` |
| 배경 생성 | `services/background_service.py`, `data/era_db.py` | (character 페이지에서 호출) |
| 보이스 | `services/voice_service.py` | `components/voice/` |
| 다큐 합성 | `services/composition_service.py` | `components/generation/`, `components/documentary/` |
| 가드레일 | `guardrails/` (5개 파일) | (백엔드에서 처리) |
| 인증 | `core/auth.py` | `middleware.ts`, `stores/authStore.ts` |
| 프로젝트 | (Supabase 직접) | `stores/projectStore.ts`, `components/project/` |

---

*이 문서는 PDCA 사이클 완료 후 생성되었습니다. 새 기능 추가 시 이 문서에 항목을 추가하세요.*
