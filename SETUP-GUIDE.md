# AI 셀프 다큐멘터리 — 환경 세팅 가이드

> 이 문서를 따라하면 프로젝트를 실제로 실행할 수 있습니다.
> 예상 소요 시간: 30~40분

---

## 목차

1. [필요한 계정 총정리](#1-필요한-계정-총정리)
2. [로컬 소프트웨어 설치](#2-로컬-소프트웨어-설치)
3. [Step 1: Supabase 세팅](#step-1-supabase-세팅)
4. [Step 2: OpenAI API 세팅](#step-2-openai-api-세팅)
5. [Step 3: ElevenLabs 세팅](#step-3-elevenlabs-세팅)
6. [Step 4: 카카오 로그인 세팅 (선택)](#step-4-카카오-로그인-세팅-선택)
7. [.env 파일 작성](#env-파일-작성)
8. [실행하기](#실행하기)
9. [배포하기 (서비스 공개)](#배포하기-서비스-공개)
10. [비용 정리](#비용-정리)
11. [문제 해결](#문제-해결)

---

## 1. 필요한 계정 총정리

| 서비스 | 필수? | 카드 등록? | 무료 범위 | 용도 |
|--------|:-----:|:---------:|----------|------|
| Supabase | 필수 | 불필요 | DB 500MB, Storage 1GB | 데이터베이스, 로그인, 파일 저장 |
| OpenAI | 필수 | **필요** | 신규 $5 크레딧 | AI 인터뷰, 캐릭터/배경 이미지 생성 |
| ElevenLabs | 필수 | 불필요 | 월 10,000자 | 음성 나레이션 (TTS, 보이스 클로닝) |
| 카카오 개발자 | 선택 | 불필요 | 무료 | 카카오 로그인 (없으면 이메일 로그인만) |
| GitHub | 선택 | 불필요 | 무료 | 코드 저장/버전 관리 |
| Vercel | 배포 시 | 불필요 | 무료 (개인) | 프론트엔드 배포 |
| Railway | 배포 시 | **필요** | $5/월~ | 백엔드(FastAPI) 배포 |

---

## 2. 로컬 소프트웨어 설치

### 이미 있을 가능성이 높은 것

```bash
# 확인 방법 (터미널에서 실행)
node -v       # v18 이상이면 OK
python --version  # 3.11 이상이면 OK
git -v        # 있으면 OK
```

### Docker Desktop (필수)

FastAPI 백엔드와 Redis를 실행하는 데 필요합니다.

1. https://www.docker.com/products/docker-desktop/ 접속
2. "Download for Windows" 클릭 → 설치
3. 설치 후 Docker Desktop 실행 (시스템 트레이에 고래 아이콘 뜨면 OK)
4. 확인: `docker -v`

### FFmpeg (로컬 테스트 시)

Docker 안에는 포함되어 있지만, Docker 없이 테스트하려면 필요합니다.

**Windows:**
1. https://www.gyan.dev/ffmpeg/builds/ 접속
2. "ffmpeg-release-essentials.zip" 다운로드
3. 압축 해제 → `bin/ffmpeg.exe`를 시스템 PATH에 추가
4. 확인: `ffmpeg -version`

---

## Step 1: Supabase 세팅

### 가입 (2분)

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (가장 간편) 또는 이메일 가입

### 프로젝트 생성 (3분)

1. Dashboard에서 "New Project" 클릭
2. 설정:
   - **Organization**: 기본값 (Personal)
   - **Name**: `ai-self-documentary` (자유)
   - **Database Password**: 강력한 비밀번호 입력 → **반드시 메모해두세요**
   - **Region**: `Northeast Asia (Tokyo)` 선택 (한국에서 가장 빠름)
3. "Create new project" 클릭 → 2~3분 대기

### API 키 가져오기 (2분)

프로젝트 생성 완료 후:

1. 왼쪽 메뉴 **Settings** (톱니바퀴) > **API**
2. 아래 4개 값을 복사해서 메모장에 저장:

| 항목 | 위치 | 복사할 값 |
|------|------|----------|
| **Project URL** | `API Settings` 상단 | `https://xxxxx.supabase.co` |
| **anon public** | `Project API keys` | `eyJhbGciOi...` (긴 문자열) |
| **service_role** | `Project API keys` | `eyJhbGciOi...` (reveal 클릭 후 복사) |
| **JWT Secret** | 아래로 스크롤 > `JWT Settings` | 긴 문자열 (reveal 클릭) |

> **주의**: `service_role` 키는 절대 프론트엔드 코드에 넣지 마세요. 백엔드 `.env`에만 넣습니다.

### 테이블 생성 (3분)

1. 왼쪽 메뉴 **SQL Editor** 클릭
2. "New query" 클릭
3. `supabase/migrations/001_initial.sql` 파일의 내용을 전체 복사 → 붙여넣기
4. "Run" 버튼 클릭
5. 왼쪽 **Table Editor**에서 `profiles`, `projects`, `interviews` 등 9개 테이블이 보이면 성공

### Storage 버킷 생성 (2분)

1. 왼쪽 메뉴 **Storage** 클릭
2. "New bucket" 버튼으로 아래 5개 생성:

| 버킷 이름 | Public? | 용도 |
|-----------|:-------:|------|
| `faces` | No | 사용자 얼굴 사진 |
| `characters` | Yes | 생성된 캐릭터 이미지 |
| `backgrounds` | Yes | 시대배경 이미지 |
| `voices` | No | TTS 음성 파일 |
| `documentaries` | Yes | 완성 MP4 영상 |

> **Public 설정**: Yes로 하면 URL로 직접 접근 가능 (캐릭터, 배경, 영상은 공유 필요). No로 하면 Signed URL 필요 (얼굴, 음성은 개인정보).

---

## Step 2: OpenAI API 세팅

### 가입 + 결제 등록 (5분)

1. https://platform.openai.com 접속
2. "Sign up" → 이메일 또는 구글 계정으로 가입
3. **결제 카드 등록** (필수):
   - 오른쪽 상단 프로필 > "Billing"
   - "Add payment method" → 카드 정보 입력
   - **Usage limits 설정 추천**: "Monthly budget" $10으로 설정 (예상치 못한 과금 방지)

### API 키 생성 (2분)

1. 왼쪽 메뉴 "API keys"
2. "Create new secret key" 클릭
3. 이름: `ai-self-documentary`
4. 생성된 키 복사 (화면 닫으면 다시 못 봄!) → 메모장에 저장

```
sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### 비용 참고

| 모델 | 용도 | 건당 비용 |
|------|------|:--------:|
| GPT-4o | 인터뷰 대화, 서사 구조화 | ~$0.01 |
| GPT-4o-mini | 인사말, 질문 생성 | ~$0.001 |
| DALL-E 3 (1024x1024) | 캐릭터 생성 | ~$0.04 |
| DALL-E 3 (1792x1024) | 배경 생성 | ~$0.08 |

혼자 테스트하면 월 $2 이내.

---

## Step 3: ElevenLabs 세팅

### 가입 (3분)

1. https://elevenlabs.io 접속
2. "Sign up" → 구글 계정 또는 이메일 가입
3. 가입 직후 무료 플랜(Free) 자동 적용 — **카드 등록 불필요**

### API 키 생성 (1분)

1. 로그인 후 오른쪽 상단 프로필 아이콘 클릭
2. "Profile + API key" 선택
3. API Key 옆의 눈 아이콘(reveal) 클릭 → 복사

```
xi_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 무료 범위

| 항목 | 무료 (Free) | Starter ($5/월) |
|------|:-----------:|:---------------:|
| 월 글자 수 | 10,000자 | 30,000자 |
| 보이스 클로닝 | 3개까지 | 10개 |
| 음질 | 표준 | 고품질 |

10,000자 = 나레이션 약 5~6편 분량. 테스트에는 충분합니다.

### 보이스 클로닝 사용 시 주의

- 본인 음성만 클로닝 가능 (타인 음성 불가, 이용약관 위반)
- 최소 30초 이상의 깨끗한 음성 녹음 필요
- 프로젝트에 이미 동의 화면이 구현되어 있습니다

---

## Step 4: 카카오 로그인 세팅 (선택)

> 카카오 로그인을 안 쓰면 이메일 로그인만 사용됩니다. 나중에 추가해도 됩니다.

### 카카오 개발자 가입 (5분)

1. https://developers.kakao.com 접속
2. 카카오 계정으로 로그인
3. "내 애플리케이션" > "애플리케이션 추가하기"
4. 설정:
   - 앱 이름: `AI 셀프 다큐멘터리`
   - 사업자명: 본인 이름

### 카카오 로그인 설정 (5분)

1. 생성된 앱 클릭 > "카카오 로그인" 메뉴
2. "활성화 설정" ON
3. "Redirect URI" 추가:
   ```
   https://[your-supabase-project-id].supabase.co/auth/v1/callback
   ```
   (`your-supabase-project-id`는 Supabase URL에서 확인)
4. "동의항목" > 닉네임, 프로필 사진 "필수 동의"로 설정

### Supabase에 연결 (2분)

1. Supabase Dashboard > **Authentication** > **Providers**
2. "Kakao" 찾아서 Enable
3. 카카오 개발자 페이지의 **REST API 키**를 복사 → `Client ID`에 붙여넣기
4. **Client Secret**: 카카오 앱 > "보안" > "Client Secret" 코드 생성 → 복사해서 붙여넣기
5. Save

---

## .env 파일 작성

위에서 모은 키들로 두 개의 파일을 만듭니다.

### frontend/.env.local

```bash
# 이 파일을 frontend/ 폴더 안에 생성하세요
# .env.local.example을 복사하면 편합니다: cp .env.local.example .env.local

# Supabase (Step 1에서 복사한 값)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# FastAPI 백엔드 주소 (로컬 개발 시)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### backend/.env

```bash
# 이 파일을 backend/ 폴더 안에 생성하세요
# .env.example을 복사하면 편합니다: cp .env.example .env

# Supabase (Step 1에서 복사한 값)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_JWT_SECRET=your-jwt-secret-xxxxx

# OpenAI (Step 2에서 복사한 값)
OPENAI_API_KEY=sk-proj-xxxxx

# ElevenLabs (Step 3에서 복사한 값)
ELEVENLABS_API_KEY=xi_xxxxx

# Redis (Docker Compose가 자동으로 띄워줌, 이대로 두면 됨)
REDIS_URL=redis://localhost:6379

# 개발 설정
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]
```

> **중요**: `.env` 파일은 절대 GitHub에 올리지 마세요. `.gitignore`에 이미 포함되어 있습니다.

---

## 실행하기

### 1. 백엔드 실행 (Docker)

```bash
# 프로젝트 루트에서
docker compose up -d
```

확인:
```bash
# 정상 실행 확인
curl http://localhost:8000/health
# {"status":"ok","service":"ai-self-documentary-backend"} 이 나오면 성공
```

> **Docker 없이 실행하려면:**
> ```bash
> cd backend
> python -m venv venv
> venv\Scripts\activate       # Windows
> pip install -r requirements.txt
> uvicorn app.main:app --reload --port 8000
> ```
> (이 경우 Redis를 별도로 설치하거나, MemorySaver가 자동 fallback됩니다)

### 2. 프론트엔드 실행

```bash
cd frontend
npm run dev
```

### 3. 브라우저에서 확인

http://localhost:3000 접속

1. 회원가입 (이메일 + 비밀번호)
2. 이메일 인증 확인 (Supabase가 확인 메일 발송)
3. 프로필 설정 (이름, 생년, 성별)
4. 새 프로젝트 생성
5. 인터뷰 시작!

> **이메일 인증 건너뛰기** (개발 중):
> Supabase Dashboard > Authentication > Users에서 직접 "Confirm" 클릭

---

## 배포하기 (서비스 공개)

### 프론트엔드: Vercel

1. https://vercel.com 가입 (GitHub 연동)
2. "Import Project" → GitHub 저장소 선택
3. Framework: Next.js (자동 감지)
4. Root Directory: `frontend`
5. Environment Variables에 `.env.local` 내용 추가
6. "Deploy" 클릭 → 3분 후 `https://your-app.vercel.app` 완성

### 백엔드: Railway

1. https://railway.app 가입 (GitHub 연동)
2. "New Project" → "Deploy from GitHub repo"
3. Root Directory: `backend`
4. Dockerfile이 자동 감지됨
5. Variables에 `backend/.env` 내용 추가
6. Redis도 추가: "Add Service" → "Redis"
7. Deploy → `https://your-backend.railway.app` 완성

배포 후 Vercel의 환경변수 `NEXT_PUBLIC_API_URL`을 Railway URL로 변경:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## 비용 정리

### 개발 단계 (혼자 테스트)

| 항목 | 월 비용 |
|------|:------:|
| Supabase Free | $0 |
| OpenAI (~50회 테스트) | ~$2 |
| ElevenLabs Free | $0 |
| Docker (로컬) | $0 |
| **합계** | **~$2** |

### MVP 출시 (사용자 100명)

| 항목 | 월 비용 |
|------|:------:|
| Supabase Pro | $25 |
| OpenAI (~500회) | ~$20 |
| ElevenLabs Starter | $5 |
| Railway | ~$10 |
| Vercel Free | $0 |
| **합계** | **~$60** |

### 비용 폭탄 방지

- **OpenAI**: Billing > Usage limits에서 "Monthly budget" $10 설정
- **ElevenLabs**: 무료 한도 초과 시 자동 차단 (과금 안 됨)
- **Supabase**: Free 플랜은 한도 초과 시 자동 일시정지 (과금 안 됨)
- **Railway**: Billing에서 "Spending limit" 설정 가능

---

## 문제 해결

### "Supabase URL/Key가 없다" 에러

```
[Supabase] 환경변수가 설정되지 않았습니다
```
→ `.env.local` 파일이 `frontend/` 안에 있는지 확인. 파일명 앞의 `.`이 빠지지 않았는지 확인.

### Docker 실행 안 됨

```
docker: Cannot connect to the Docker daemon
```
→ Docker Desktop이 실행 중인지 확인 (시스템 트레이 고래 아이콘).

### "401 Unauthorized" 에러

→ `backend/.env`의 `SUPABASE_JWT_SECRET`이 Supabase Dashboard의 JWT Secret과 일치하는지 확인.

### DALL-E "billing hard limit reached"

→ OpenAI Billing 페이지에서 결제 카드가 정상인지, Usage limit이 너무 낮게 설정되어 있지 않은지 확인.

### 카카오 로그인 안 됨

→ Redirect URI가 정확한지 확인:
`https://[project-id].supabase.co/auth/v1/callback`

### 이메일 인증 메일이 안 옴

→ Supabase Dashboard > Authentication > Users에서 해당 유저를 찾아 수동으로 "Confirm" 클릭 (개발 중에는 이렇게 해도 됨).

---

*이 문서는 2026-03-31 기준으로 작성되었습니다. 각 서비스의 UI/가격은 변경될 수 있습니다.*
