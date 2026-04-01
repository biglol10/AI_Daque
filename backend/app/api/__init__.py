# Design Ref: §4.2 — FastAPI AI Pipeline Endpoints
from fastapi import APIRouter

from app.api.interview import router as interview_router
from app.api.narrative import router as narrative_router
from app.api.generation import router as generation_router
from app.api.voice import router as voice_router
from app.api.documentary import router as documentary_router
from app.api.try_flow import router as try_router

router = APIRouter()


@router.get("/ping")
async def ping():
    return {"message": "pong", "service": "ai-pipeline"}


router.include_router(interview_router)
router.include_router(narrative_router)
router.include_router(generation_router)
router.include_router(voice_router)
router.include_router(documentary_router)
router.include_router(try_router)
