# Try-before-signup flow endpoints — NO auth required.
# These are the "hook" endpoints: users get instant results without logging in.
# All outputs are ephemeral (no DB writes, no Supabase storage).

import base64
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.openai import openai_client as client
from app.services.character_service import analyze_face
from app.services.narrative_engine import structure_narrative, generate_narration_script
from app.services.voice_service import generate_tts_preview, SAMPLE_VOICES
from app.guardrails.nsfw_filter import check_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/try", tags=["try"])

# ---------------------------------------------------------------------------
# Fixed mini-interview questions (3 questions for the try flow)
# ---------------------------------------------------------------------------

MINI_INTERVIEW_QUESTIONS = [
    "그 시절 가장 기억에 남는 순간은 무엇인가요?",
    "그때 가장 행복했던 일은 무엇인가요?",
    "그 시절의 나에게 해주고 싶은 말이 있다면?",
]

# Default sample voice for try flow TTS preview (남성 - 따뜻한 아버지)
DEFAULT_TRY_VOICE_ID = SAMPLE_VOICES[0]["id"]


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------


class TryCharacterRequest(BaseModel):
    face_image_base64: str = Field(
        description="Base64 인코딩된 얼굴 사진 (JPEG 또는 PNG)",
        min_length=100,
    )


class TryCharacterResponse(BaseModel):
    character_image_url: str
    prompt_used: str


class MiniInterviewAnswers(BaseModel):
    question1: str = Field(description=MINI_INTERVIEW_QUESTIONS[0], min_length=1)
    question2: str = Field(description=MINI_INTERVIEW_QUESTIONS[1], min_length=1)
    question3: str = Field(description=MINI_INTERVIEW_QUESTIONS[2], min_length=1)


class TryMiniInterviewRequest(BaseModel):
    era: str = Field(description="시대 구분: '10대', '20대', '30대', '40대', '50대', '60대 이상'")
    birth_year: int = Field(ge=1920, le=2020)
    answers: MiniInterviewAnswers


class TryMiniInterviewResponse(BaseModel):
    narrative: dict
    narration_script: str


class ScenePreview(BaseModel):
    scene_id: str
    background_url: str
    description: str
    duration_sec: int


class TryMiniDocumentaryRequest(BaseModel):
    character_image_url: str = Field(description="Try flow에서 생성된 캐릭터 이미지 URL")
    narrative: dict = Field(description="Mini-interview에서 생성된 구조화된 서사")
    birth_year: int = Field(ge=1920, le=2020)
    era: str = Field(description="시대 구분: '10대', '20대', '30대', '40대', '50대', '60대 이상'")


class TryMiniDocumentaryResponse(BaseModel):
    scenes: list[ScenePreview]
    narration_script: str
    sample_audio_base64: str | None = None
    character_image_url: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/character", response_model=TryCharacterResponse)
async def try_generate_character(req: TryCharacterRequest):
    """Upload a face photo and instantly get a cute cartoon character.

    No login required. The returned image URL is temporary (~1 hour).
    """
    try:
        # 1. Validate that the input is valid base64
        try:
            base64.b64decode(req.face_image_base64, validate=True)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="유효하지 않은 base64 이미지입니다. 올바른 base64 인코딩인지 확인해주세요.",
            )

        # 2. Analyze face with GPT-4o Vision
        logger.info("Try flow: analyzing face with GPT-4o Vision")
        face_description = await analyze_face(req.face_image_base64)
        logger.info("Try flow face description: %s", face_description)

        # 3. Build a cute cartoon prompt (default style, no era context needed)
        raw_prompt = (
            f"Cute cartoon character portrait, chibi style, round face, big expressive eyes, "
            f"Korean person. {face_description} "
            f"Warm and friendly expression, soft pastel colors, "
            f"clean white background, full body standing pose, "
            f"warm cartoon illustration style."
        )
        safe_prompt = check_prompt(raw_prompt)

        # 4. Generate with DALL-E 3
        logger.info("Try flow: generating character with DALL-E 3")
        dalle_response = await client.images.generate(
            model="dall-e-3",
            prompt=safe_prompt,
            size="1024x1024",
            quality="hd",
            n=1,
        )

        character_image_url = dalle_response.data[0].url

        # 5. Return the temporary OpenAI URL directly (no Supabase upload)
        return TryCharacterResponse(
            character_image_url=character_image_url,
            prompt_used=safe_prompt,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Try flow character generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"캐릭터 생성에 실패했습니다: {str(e)}",
        )


@router.post("/mini-interview", response_model=TryMiniInterviewResponse)
async def try_mini_interview(req: TryMiniInterviewRequest):
    """Answer 3 quick questions and get a structured narrative + narration script.

    No login required. The 3 fixed questions are:
    1. 그 시절 가장 기억에 남는 순간은 무엇인가요?
    2. 그때 가장 행복했던 일은 무엇인가요?
    3. 그 시절의 나에게 해주고 싶은 말이 있다면?
    """
    try:
        # 1. Combine 3 answers into a single raw_text block
        raw_text = (
            f"질문: {MINI_INTERVIEW_QUESTIONS[0]}\n"
            f"답변: {req.answers.question1}\n\n"
            f"질문: {MINI_INTERVIEW_QUESTIONS[1]}\n"
            f"답변: {req.answers.question2}\n\n"
            f"질문: {MINI_INTERVIEW_QUESTIONS[2]}\n"
            f"답변: {req.answers.question3}"
        )

        # 2. Structure the narrative (reuse existing narrative engine)
        logger.info("Try flow: structuring narrative for era=%s, birth_year=%d", req.era, req.birth_year)
        narrative = await structure_narrative(
            era=req.era,
            raw_text=raw_text,
            birth_year=req.birth_year,
        )

        # 3. Generate narration script (reuse existing narrative engine)
        logger.info("Try flow: generating narration script")
        narration_script = await generate_narration_script(
            era=req.era,
            structured_narrative=narrative,
        )

        # 4. Return structured narrative + script (no DB save)
        return TryMiniInterviewResponse(
            narrative=narrative,
            narration_script=narration_script,
        )

    except Exception as e:
        logger.exception("Try flow mini-interview failed")
        raise HTTPException(
            status_code=500,
            detail=f"미니 인터뷰 처리에 실패했습니다: {str(e)}",
        )


@router.post("/mini-documentary", response_model=TryMiniDocumentaryResponse)
async def try_mini_documentary(req: TryMiniDocumentaryRequest):
    """Generate a storyboard preview: background images for top 2 scenes + TTS audio.

    No login required. Returns a preview with:
    - 2 scene background images (temporary OpenAI URLs)
    - Narration script text
    - Sample TTS audio (base64 encoded MP3)
    - Character image URL (passed through)

    This is a simplified "storyboard preview" — no actual video composition.
    """
    try:
        scenes = req.narrative.get("scenes", [])
        if not scenes:
            raise HTTPException(
                status_code=400,
                detail="서사 데이터에 장면(scenes)이 없습니다.",
            )

        # 1. Pick top 2 scenes for the preview
        preview_scenes = scenes[:2]
        scene_previews: list[ScenePreview] = []

        for scene in preview_scenes:
            scene_id = scene.get("scene_id", "scene_unknown")
            description = scene.get("description", "")
            background_prompt = scene.get("background_prompt", description)
            duration_sec = scene.get("duration_sec", 15)

            # Build a safe DALL-E prompt for the background
            raw_prompt = (
                f"{background_prompt}. "
                f"Wide panoramic background illustration, no characters in foreground, "
                f"cinematic composition, atmospheric lighting, "
                f"warm cartoon illustration style."
            )
            safe_prompt = check_prompt(raw_prompt)

            # Generate background image with DALL-E 3
            logger.info("Try flow: generating background for %s", scene_id)
            dalle_response = await client.images.generate(
                model="dall-e-3",
                prompt=safe_prompt,
                size="1792x1024",
                quality="hd",
                n=1,
            )

            background_url = dalle_response.data[0].url

            scene_previews.append(
                ScenePreview(
                    scene_id=scene_id,
                    background_url=background_url,
                    description=description,
                    duration_sec=duration_sec,
                )
            )

        # 2. Generate narration script from the narrative (if not already available)
        narration_script = await generate_narration_script(
            era=req.era,
            structured_narrative=req.narrative,
        )

        # 3. Generate sample TTS audio with the default voice
        sample_audio_base64: str | None = None
        try:
            # Use a short excerpt of the narration for the preview
            # Take the first ~100 characters to keep audio short (~30 seconds)
            preview_text = narration_script
            if len(preview_text) > 200:
                # Find a good break point near 200 characters
                cut_point = preview_text.rfind(".", 0, 200)
                if cut_point == -1:
                    cut_point = preview_text.rfind(" ", 0, 200)
                if cut_point == -1:
                    cut_point = 200
                preview_text = preview_text[: cut_point + 1]

            # Remove [pause] markers for preview audio
            preview_text = preview_text.replace("[pause]", " ").replace("[long_pause]", " ")

            logger.info("Try flow: generating TTS preview (%d chars)", len(preview_text))
            audio_bytes = await generate_tts_preview(
                text=preview_text,
                voice_id=DEFAULT_TRY_VOICE_ID,
            )
            sample_audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        except Exception as tts_err:
            # TTS failure is non-critical — return preview without audio
            logger.warning("Try flow TTS preview failed (non-critical): %s", tts_err)
            sample_audio_base64 = None

        # 4. Return the storyboard preview
        return TryMiniDocumentaryResponse(
            scenes=scene_previews,
            narration_script=narration_script,
            sample_audio_base64=sample_audio_base64,
            character_image_url=req.character_image_url,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Try flow mini-documentary failed")
        raise HTTPException(
            status_code=500,
            detail=f"미니 다큐멘터리 생성에 실패했습니다: {str(e)}",
        )
