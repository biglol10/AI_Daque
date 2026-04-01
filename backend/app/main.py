# Design Ref: §1.1 — Option B: FastAPI는 AI 파이프라인 전용 서버
import logging

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api import router as api_router

logger = logging.getLogger(__name__)

# Sentry 초기화 (DSN 없으면 비활성화)
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.1,
        environment="production" if not settings.debug else "development",
        send_default_pii=False,  # 개인정보 전송 안 함
    )
    logger.info("Sentry 에러 추적 활성화")

app = FastAPI(
    title="AI Self-Documentary Backend",
    description="AI 파이프라인 전용 서버 (인터뷰, 캐릭터/배경 생성, TTS, 다큐 합성)",
    version="0.1.0",
)


# 에러 응답 통일: 모든 에러를 {"error": "메시지"} 형태로
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    message = "; ".join(f"{e.get('loc', '')}: {e.get('msg', '')}" for e in errors)
    return JSONResponse(
        status_code=422,
        content={"error": f"입력값 검증 실패: {message}"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "서버 내부 오류가 발생했습니다"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-self-documentary-backend"}
