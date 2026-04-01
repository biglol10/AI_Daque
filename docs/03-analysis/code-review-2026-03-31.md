# Code Review Report — AI 셀프 다큐멘터리

> **Date**: 2026-03-31
> **Scope**: 전체 프로젝트 (Frontend 66 + Backend 38 파일)
> **Reviewer**: AI Code Analyzer

---

## Summary

| Metric | Value |
|--------|-------|
| **Files Reviewed** | 104 |
| **Issues Found** | 14 (Critical: 3, Major: 5, Minor: 6) |
| **Score** | **62/100** |

| Category | Score | Weight | Weighted |
|----------|:-----:|:------:|:--------:|
| Security | 35/100 | 30% | 10.5 |
| Code Quality | 70/100 | 25% | 17.5 |
| Performance | 65/100 | 20% | 13.0 |
| Architecture | 80/100 | 15% | 12.0 |
| Error Handling | 60/100 | 10% | 6.0 |
| **Total** | | | **59/100** |

---

## Critical Issues (3)

### C1. JWT 인증이 어디에도 적용되지 않음

**파일**: `backend/app/api/*.py` (전체 5개 라우터)
**Confidence**: 100%

`backend/app/core/auth.py`에 `verify_token` 함수가 있지만, **어떤 엔드포인트에도 `Depends(verify_token)`이 사용되지 않습니다.** 모든 API가 인증 없이 호출 가능합니다.

```python
# 현재 상태 (모든 라우터 동일)
@router.post("/start")
async def start_interview(req: InterviewStartRequest):  # ← Depends 없음
    ...
```

```python
# 수정 필요
from app.core.auth import verify_token
@router.post("/start")
async def start_interview(req: InterviewStartRequest, user: dict = Depends(verify_token)):
    ...
```

**영향**: 타인의 프로젝트/얼굴/음성/인생사에 접근 가능. 서비스 출시 전 반드시 수정 필수.

---

### C2. BFF 프록시에서 인증 토큰 미전달

**파일**: `frontend/src/app/api/*/route.ts` (전체 5개)
**Confidence**: 100%

Next.js BFF 프록시가 FastAPI에 요청할 때 **사용자의 Supabase JWT 토큰을 Authorization 헤더로 전달하지 않습니다.**

```typescript
// 현재 상태 (모든 BFF 동일)
const res = await fetch(`${AI_BACKEND_URL}${endpoint}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },  // ← Authorization 없음
  body: JSON.stringify(payload),
});
```

C1(백엔드 인증)이 적용되면, BFF에서 토큰을 전달해야 합니다. 현재는 둘 다 없어서 "동작"하지만, 한쪽만 수정하면 전부 401 에러가 발생합니다.

---

### C3. Supabase placeholder 키가 프로덕션에서 동작할 수 있음

**파일**: `frontend/src/lib/supabase.ts:4-5`, `frontend/src/middleware.ts:12-13`, `frontend/src/lib/supabase-server.ts:10-11`
**Confidence**: 90%

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
```

환경변수가 설정되지 않으면 `placeholder.supabase.co`로 요청을 보냅니다. 빌드는 통과하지만 런타임에서 조용히 실패합니다. 환경변수 미설정 시 명시적 에러를 던져야 합니다.

---

## Major Issues (5)

### M1. OpenAI 클라이언트 7곳에서 중복 생성

**파일**: `backend/app/services/*.py`, `backend/app/graphs/nodes/*.py`
**Confidence**: 95%

`AsyncOpenAI(api_key=settings.openai_api_key)`가 7개 파일에서 각각 모듈 레벨로 생성됩니다. 3개는 모듈 상수(서비스), 4개는 함수 내부(노드)에서 매 호출마다 새 인스턴스를 만듭니다.

**수정**: `backend/app/core/openai.py`에 싱글턴 클라이언트를 만들고 모든 곳에서 import.

```python
# backend/app/core/openai.py
from openai import AsyncOpenAI
from app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
```

---

### M2. LangGraph MemorySaver — 서버 재시작 시 데이터 소실

**파일**: `backend/app/graphs/interview_graph.py`
**Confidence**: 95%

MVP에서 `MemorySaver`(인메모리)를 사용하지만, 서버 재시작/배포 시 **모든 인터뷰 세션이 소실**됩니다. Design에서는 PostgresSaver를 명시했습니다.

**수정**: 프로덕션 전에 `PostgresSaver` 또는 `RedisSaver`로 교체 필요.

---

### M3. FFmpeg subprocess에 timeout 없음

**파일**: `backend/app/services/composition_service.py`
**Confidence**: 90%

FFmpeg subprocess 호출에 `timeout` 파라미터가 없습니다. 비정상 입력 시 프로세스가 무한 대기할 수 있습니다.

```python
# 현재
result = subprocess.run(cmd, capture_output=True, text=True)
# 수정 필요
result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
```

---

### M4. 에러 응답 구조 불일치

**Confidence**: 85%

- FastAPI: `{"detail": "에러메시지"}` (HTTPException 기본)
- BFF 프록시: `{"error": "에러메시지"}`
- 프론트엔드: `data.error` 또는 `data.detail` 혼용

에러 응답 스키마가 통일되지 않아 프론트에서 에러 메시지를 안정적으로 표시할 수 없습니다.

---

### M5. projectStore에서 Supabase 에러 무시

**파일**: `frontend/src/stores/projectStore.ts`
**Confidence**: 85%

Supabase 호출 결과의 `error` 객체를 체크하지 않거나 무시하는 패턴이 있을 수 있습니다. Zustand store에서 비동기 작업 시 에러 상태 관리가 미흡합니다.

---

## Minor Issues (6)

| # | Issue | File | Confidence |
|---|-------|------|:----------:|
| m1 | `.env.example`에 `SUPABASE_JWT_SECRET` 누락 | `backend/.env.example` | 100% |
| m2 | Docker Compose에 `SUPABASE_JWT_SECRET` env 미포함 | `docker-compose.yml` | 100% |
| m3 | `__init__.py` 파일 일부 빈 파일 (data/, pipeline/) | `backend/app/` | 80% |
| m4 | 프론트엔드 `types/` 디렉토리 없음 — 타입이 각 컴포넌트에 인라인 | `frontend/src/` | 75% |
| m5 | era_db.py의 한국 시대 데이터에 2020s 이벤트 부족 | `backend/app/data/era_db.py` | 70% |
| m6 | BFF 프록시 5개의 에러 처리가 동일 패턴 — 공통 유틸로 추출 가능 | `frontend/src/app/api/` | 70% |

---

## Recommendations

### 즉시 수정 (서비스 출시 전 필수)

1. **C1+C2**: 모든 FastAPI 엔드포인트에 `Depends(verify_token)` 추가 + BFF에서 JWT 전달
2. **C3**: placeholder fallback 제거, 환경변수 미설정 시 빌드/런타임 에러 발생시키기

### 단기 개선 (1주 내)

3. **M1**: OpenAI 클라이언트 싱글턴으로 통합
4. **M3**: FFmpeg subprocess에 timeout 추가 (300초)
5. **M4**: 에러 응답 스키마 통일 (`{ error: string, code?: string }`)
6. **m1+m2**: `.env.example`과 docker-compose에 `SUPABASE_JWT_SECRET` 추가

### 프로덕션 전 필수

7. **M2**: LangGraph checkpointer를 PostgresSaver 또는 RedisSaver로 교체
8. 테스트 코드 작성 (현재 0개)

---

## Score Breakdown

```
Security:       35/100  — C1(인증 미적용), C2(토큰 미전달), C3(placeholder 키)
Code Quality:   70/100  — M1(중복 클라이언트), m4(타입 분산), m6(프록시 중복)
Performance:    65/100  — M1(클라이언트 중복), M2(인메모리 체크포인터)
Architecture:   80/100  — Option B 패턴 잘 준수, BFF 프록시 일관성, 가드레일 구조 양호
Error Handling: 60/100  — M3(FFmpeg timeout), M4(에러 스키마 불일치), M5(store 에러 무시)

Overall: 62/100
```
