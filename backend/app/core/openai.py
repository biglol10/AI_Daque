# OpenAI 클라이언트 싱글턴 — 전체 앱에서 하나의 인스턴스 공유
from openai import AsyncOpenAI

from app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
