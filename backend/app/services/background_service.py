# Design Ref: §5.2 — Background Generation Flow (시대 DB 활용)
# Generates era-appropriate background images for documentary scenes

import logging

import httpx

from app.core.openai import openai_client as client
from app.core.supabase import get_supabase_admin
from app.data.era_db import get_era_context
from app.guardrails.nsfw_filter import check_prompt

logger = logging.getLogger(__name__)


def _build_background_prompt(
    scene_description: str,
    era_context: dict,
) -> str:
    """Build a DALL-E prompt for a scene background using era context.

    Args:
        scene_description: Description of the scene from the narrative engine.
        era_context: Full era context dict from get_era_context().

    Returns:
        Complete DALL-E prompt for background generation.
    """
    decade_label = era_context["decade_label"]
    visual_elements = ", ".join(era_context["visual_elements"])
    template = era_context["image_prompt_template"]

    prompt = (
        f"{scene_description}. "
        f"Set in {decade_label} Korea. "
        f"Era-specific visual elements: {visual_elements}. "
        f"Reference style: {template}. "
        f"Wide panoramic background illustration, no characters in foreground, "
        f"cinematic composition, atmospheric lighting, "
        f"warm cartoon illustration style."
    )

    return check_prompt(prompt)


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


async def generate_background(
    project_id: str,
    era: str,
    scene_id: str,
    scene_description: str,
    birth_year: int,
) -> dict:
    """장면 설명 + 시대 DB → 시대 배경 이미지 생성.

    Args:
        project_id: 프로젝트 ID.
        era: 시기 구분 (예: '10대', '20대').
        scene_id: 장면 ID (예: 'scene_1').
        scene_description: 장면 설명 (narrative engine에서 생성된 background_prompt).
        birth_year: 사용자 출생 연도.

    Returns:
        dict with background_image_url, era_context_used, prompt_used.
    """
    # 1. Look up era context from era_db
    era_context = get_era_context(birth_year, era)
    logger.info(
        "Era context for project %s, era %s: decade=%s",
        project_id,
        era,
        era_context["decade"],
    )

    # 2. Build background prompt
    prompt = _build_background_prompt(scene_description, era_context)
    logger.info("Background prompt: %s", prompt)

    # 3. Generate background image with DALL-E 3 (wide format)
    logger.info("Generating background with DALL-E 3")
    dalle_response = await client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1792x1024",
        quality="hd",
        n=1,
    )

    generated_image_url = dalle_response.data[0].url
    revised_prompt = dalle_response.data[0].revised_prompt

    # 4. Download generated image and upload to Supabase Storage
    async with httpx.AsyncClient(timeout=60.0) as http:
        img_resp = await http.get(generated_image_url)
        img_resp.raise_for_status()
        image_bytes = img_resp.content

    era_safe = era.replace(" ", "_").replace("대", "dae")
    storage_path = f"{project_id}/{era_safe}/{scene_id}.png"
    background_url = await _upload_to_storage("backgrounds", storage_path, image_bytes)

    logger.info("Background uploaded to: %s", background_url)

    return {
        "background_image_url": background_url,
        "era_context_used": {
            "decade": era_context["decade"],
            "decade_label": era_context["decade_label"],
            "year_start": era_context["year_start"],
            "year_end": era_context["year_end"],
        },
        "prompt_used": prompt,
        "revised_prompt": revised_prompt,
    }
