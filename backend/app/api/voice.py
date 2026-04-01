# Design Ref: §4.2 — Voice API (TTS + Voice Cloning Endpoints)
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.core.auth import verify_token

from app.guardrails.voice_consent import voice_consent_guard
from app.services.voice_service import (
    clone_voice,
    generate_tts,
    generate_tts_preview,
    get_sample_voices,
)

router = APIRouter(prefix="/voice", tags=["voice"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------


class VoiceCloneRequest(BaseModel):
    project_id: str
    audio_file_url: str = Field(description="Supabase Storage 내 오디오 파일 URL")
    voice_name: str = Field(
        default="내 목소리",
        min_length=1,
        max_length=50,
        description="클로닝 보이스 이름",
    )


class VoiceCloneResponse(BaseModel):
    cloned_voice_id: str
    name: str


class VoiceConsentRequest(BaseModel):
    project_id: str
    consent_given: bool


class VoiceConsentResponse(BaseModel):
    project_id: str
    consent_given: bool


class VoiceTTSRequest(BaseModel):
    project_id: str
    narration_script: str = Field(
        min_length=1,
        max_length=10000,
        description="나레이션 스크립트",
    )
    voice_id: str = Field(description="ElevenLabs 보이스 ID")


class VoiceTTSResponse(BaseModel):
    audio_url: str
    duration_estimate: float


class VoicePreviewRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=500,
        description="미리듣기 텍스트",
    )
    voice_id: str = Field(description="ElevenLabs 보이스 ID")


class SampleVoice(BaseModel):
    id: str
    name: str
    gender: str
    preview_url: str | None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/samples", response_model=list[SampleVoice])
async def list_sample_voices(user: dict = Depends(verify_token)):
    """샘플 보이스 목록을 반환합니다."""
    voices = await get_sample_voices()
    return voices


@router.post("/clone", response_model=VoiceCloneResponse)
async def clone_user_voice(req: VoiceCloneRequest, user: dict = Depends(verify_token)):
    """사용자의 음성 파일로 보이스 클로닝을 수행합니다.

    동의가 기록되어 있어야 합니다.
    """
    # Consent verification
    await voice_consent_guard.verify(req.project_id, "cloned")

    try:
        result = await clone_voice(
            project_id=req.project_id,
            audio_file_url=req.audio_file_url,
            voice_name=req.voice_name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"보이스 클로닝에 실패했습니다: {str(e)}",
        )

    return VoiceCloneResponse(**result)


@router.post("/consent", response_model=VoiceConsentResponse)
async def record_voice_consent(req: VoiceConsentRequest, user: dict = Depends(verify_token)):
    """보이스 클로닝 동의를 기록합니다."""
    result = await voice_consent_guard.record_consent(
        project_id=req.project_id,
        consent_given=req.consent_given,
    )
    return VoiceConsentResponse(**result)


@router.post("/tts", response_model=VoiceTTSResponse)
async def create_tts(req: VoiceTTSRequest, user: dict = Depends(verify_token)):
    """나레이션 스크립트를 TTS 음성으로 생성합니다."""
    try:
        result = await generate_tts(
            project_id=req.project_id,
            narration_script=req.narration_script,
            voice_id=req.voice_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"TTS 생성에 실패했습니다: {str(e)}",
        )

    return VoiceTTSResponse(**result)


@router.post("/preview")
async def preview_tts(req: VoicePreviewRequest, user: dict = Depends(verify_token)):
    """짧은 텍스트로 TTS 미리듣기 음성을 생성합니다.

    audio/mpeg 바이트를 직접 반환합니다.
    """
    try:
        audio_bytes = await generate_tts_preview(
            text=req.text,
            voice_id=req.voice_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"미리듣기 생성에 실패했습니다: {str(e)}",
        )

    return Response(content=audio_bytes, media_type="audio/mpeg")
