# Design Ref: §10 — Environment & Configuration
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # FastAPI
    app_name: str = "AI Self-Documentary Backend"
    debug: bool = False

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Supabase (Service Role — 생성 결과물 저장용)
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # OpenAI (인터뷰 LLM, 캐릭터/배경 이미지 생성)
    openai_api_key: str = ""

    # ElevenLabs (보이스 클로닝 + TTS)
    elevenlabs_api_key: str = ""

    # Redis (LangGraph Checkpointer)
    redis_url: str = "redis://localhost:6379"

    # Sentry (선택 — 없으면 에러 추적 비활성화)
    sentry_dsn: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
