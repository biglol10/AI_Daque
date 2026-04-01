# Design Ref: §4.2 — Generation Endpoints (Character + Background)
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import verify_token

from app.core.supabase import get_supabase_admin
from app.services.character_service import generate_character
from app.services.background_service import generate_background

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["generate"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------


class CharacterGenerateRequest(BaseModel):
    project_id: str
    era: str = Field(description="시대 구분: '10대', '20대', '30대', '40대', '50대', '60대 이상'")
    face_image_url: str = Field(description="Supabase Storage의 얼굴 사진 공개 URL")
    birth_year: int = Field(ge=1920, le=2020)


class CharacterGenerateResponse(BaseModel):
    character_image_url: str
    prompt_used: str
    revised_prompt: str | None = None
    face_description: str


class BackgroundGenerateRequest(BaseModel):
    project_id: str
    era: str = Field(description="시대 구분: '10대', '20대', '30대', '40대', '50대', '60대 이상'")
    scene_id: str = Field(description="장면 ID (예: scene_1)")
    scene_description: str = Field(description="장면 배경 설명 (영문 프롬프트)")
    birth_year: int = Field(ge=1920, le=2020)


class BackgroundGenerateResponse(BaseModel):
    background_image_url: str
    era_context_used: dict
    prompt_used: str
    revised_prompt: str | None = None


class AssetItem(BaseModel):
    name: str
    url: str
    asset_type: str
    era: str


class AssetsListResponse(BaseModel):
    project_id: str
    assets: list[AssetItem]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/character", response_model=CharacterGenerateResponse)
async def generate_character_endpoint(req: CharacterGenerateRequest, user: dict = Depends(verify_token)):
    """Generate a cartoon character from a face photo for a given era."""
    try:
        result = await generate_character(
            project_id=req.project_id,
            era=req.era,
            face_image_url=req.face_image_url,
            birth_year=req.birth_year,
        )
        return CharacterGenerateResponse(**result)
    except Exception as e:
        logger.exception("Character generation failed for project %s", req.project_id)
        raise HTTPException(
            status_code=500,
            detail=f"캐릭터 생성에 실패했습니다: {str(e)}",
        )


@router.post("/background", response_model=BackgroundGenerateResponse)
async def generate_background_endpoint(req: BackgroundGenerateRequest, user: dict = Depends(verify_token)):
    """Generate an era-appropriate background image for a scene."""
    try:
        result = await generate_background(
            project_id=req.project_id,
            era=req.era,
            scene_id=req.scene_id,
            scene_description=req.scene_description,
            birth_year=req.birth_year,
        )
        return BackgroundGenerateResponse(**result)
    except Exception as e:
        logger.exception("Background generation failed for project %s", req.project_id)
        raise HTTPException(
            status_code=500,
            detail=f"배경 생성에 실패했습니다: {str(e)}",
        )


@router.get("/{project_id}/assets", response_model=AssetsListResponse)
async def list_assets(project_id: str, user: dict = Depends(verify_token)):
    """List all generated assets (characters + backgrounds) for a project."""
    sb = get_supabase_admin()
    assets: list[AssetItem] = []

    # List character images
    try:
        char_files = sb.storage.from_("characters").list(project_id)
        for folder in char_files:
            folder_name = folder.get("name", "")
            if folder_name:
                sub_files = sb.storage.from_("characters").list(
                    f"{project_id}/{folder_name}"
                )
                for f in sub_files:
                    file_name = f.get("name", "")
                    if file_name:
                        path = f"{project_id}/{folder_name}/{file_name}"
                        url = sb.storage.from_("characters").get_public_url(path)
                        assets.append(
                            AssetItem(
                                name=file_name,
                                url=url,
                                asset_type="character",
                                era=folder_name,
                            )
                        )
    except Exception:
        logger.warning("Could not list character assets for project %s", project_id)

    # List background images
    try:
        bg_files = sb.storage.from_("backgrounds").list(project_id)
        for folder in bg_files:
            folder_name = folder.get("name", "")
            if folder_name:
                sub_files = sb.storage.from_("backgrounds").list(
                    f"{project_id}/{folder_name}"
                )
                for f in sub_files:
                    file_name = f.get("name", "")
                    if file_name:
                        path = f"{project_id}/{folder_name}/{file_name}"
                        url = sb.storage.from_("backgrounds").get_public_url(path)
                        assets.append(
                            AssetItem(
                                name=file_name,
                                url=url,
                                asset_type="background",
                                era=folder_name,
                            )
                        )
    except Exception:
        logger.warning("Could not list background assets for project %s", project_id)

    return AssetsListResponse(project_id=project_id, assets=assets)
