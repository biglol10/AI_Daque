# Design Ref: §5.2 — Character Generation Flow
# Uses OpenAI GPT-4o Vision to analyze face, then DALL-E 3 to generate cartoon character
# Steps: face analysis → era appearance mapping → prompt building → DALL-E generation → storage

import base64
import logging

import httpx

from app.core.openai import openai_client as client
from app.core.supabase import get_supabase_admin
from app.data.era_db import get_era_context
from app.guardrails.nsfw_filter import check_prompt

logger = logging.getLogger(__name__)


async def analyze_face(face_image_base64: str) -> str:
    """GPT-4o Vision으로 얼굴 특징 분석 (성별, 나이대, 특징적 외형).

    Args:
        face_image_base64: Base64 encoded face image string.

    Returns:
        English description of facial features for DALL-E prompt building.
    """
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a portrait description expert. Analyze the face in the image and "
                    "describe the key features in English for a cartoon character artist. "
                    "Include: apparent gender, approximate age group, hair style and color, "
                    "face shape, distinctive features (glasses, dimples, etc). "
                    "Keep the description concise (3-5 sentences). "
                    "Do NOT include any personal identifying information or names."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Please describe this person's facial features for a cartoon character reference.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{face_image_base64}",
                            "detail": "low",
                        },
                    },
                ],
            },
        ],
        max_tokens=300,
        temperature=0.3,
    )

    return response.choices[0].message.content


async def build_character_prompt(
    face_description: str,
    era: str,
    birth_year: int,
) -> str:
    """얼굴 특징 + 시대 → DALL-E 프롬프트.

    Args:
        face_description: English description of facial features from GPT-4o Vision.
        era: 시기 구분 (예: '10대', '20대').
        birth_year: 사용자 출생 연도.

    Returns:
        Complete DALL-E prompt for character generation.
    """
    era_ctx = get_era_context(birth_year, era)
    decade_label = era_ctx["decade_label"]
    visual_elements = era_ctx["visual_elements"]

    # Pick era-appropriate clothing/style cues
    clothing_cues = ", ".join(visual_elements[:3])

    prompt = (
        f"Cute cartoon character portrait, chibi style, round face, big expressive eyes, "
        f"Korean person. {face_description} "
        f"Wearing {decade_label} era Korean fashion and style ({clothing_cues}). "
        f"Warm and friendly expression, soft pastel colors, "
        f"clean white background, full body standing pose, "
        f"warm cartoon illustration style."
    )

    return check_prompt(prompt)


async def _download_image_as_base64(image_url: str) -> str:
    """Download an image from URL and return as base64 string.

    Args:
        image_url: Public or signed URL to the image.

    Returns:
        Base64 encoded image string.
    """
    async with httpx.AsyncClient(timeout=30.0) as http:
        resp = await http.get(image_url)
        resp.raise_for_status()
        return base64.b64encode(resp.content).decode("utf-8")


async def _upload_to_storage(
    bucket: str,
    path: str,
    image_bytes: bytes,
    content_type: str = "image/png",
) -> str:
    """Upload image bytes to Supabase Storage and return the public URL.

    Args:
        bucket: Storage bucket name.
        path: File path within the bucket.
        image_bytes: Raw image bytes.
        content_type: MIME type.

    Returns:
        Public URL of the uploaded file.
    """
    sb = get_supabase_admin()
    sb.storage.from_(bucket).upload(
        path,
        image_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    public_url = sb.storage.from_(bucket).get_public_url(path)
    return public_url


async def generate_character(
    project_id: str,
    era: str,
    face_image_url: str,
    birth_year: int,
) -> dict:
    """전체 캐릭터 생성 파이프라인.

    Args:
        project_id: 프로젝트 ID.
        era: 시기 구분 (예: '10대', '20대').
        face_image_url: Supabase Storage의 얼굴 사진 URL.
        birth_year: 사용자 출생 연도.

    Returns:
        dict with character_image_url and prompt_used.
    """
    # 1. Download face image from Supabase Storage
    logger.info("Downloading face image for project %s", project_id)
    face_base64 = await _download_image_as_base64(face_image_url)

    # 2. Analyze face with GPT-4o Vision
    logger.info("Analyzing face with GPT-4o Vision")
    face_description = await analyze_face(face_base64)
    logger.info("Face description: %s", face_description)

    # 3. Build prompt with era-appropriate appearance
    prompt = await build_character_prompt(face_description, era, birth_year)
    logger.info("Character prompt: %s", prompt)

    # 4. Generate character image with DALL-E 3
    logger.info("Generating character with DALL-E 3")
    dalle_response = await client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="hd",
        n=1,
    )

    generated_image_url = dalle_response.data[0].url
    revised_prompt = dalle_response.data[0].revised_prompt

    # 5. Download generated image and upload to Supabase Storage
    async with httpx.AsyncClient(timeout=60.0) as http:
        img_resp = await http.get(generated_image_url)
        img_resp.raise_for_status()
        image_bytes = img_resp.content

    era_safe = era.replace(" ", "_").replace("대", "dae")
    storage_path = f"{project_id}/{era_safe}/character.png"
    character_url = await _upload_to_storage("characters", storage_path, image_bytes)

    logger.info("Character uploaded to: %s", character_url)

    return {
        "character_image_url": character_url,
        "prompt_used": prompt,
        "revised_prompt": revised_prompt,
        "face_description": face_description,
    }
