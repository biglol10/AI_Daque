# Design Ref: §4.2 — FastAPI narrative endpoints
# Plan SC: FR-02 템플릿 작성, FR-03 서사 구조화
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import verify_token

from app.services.narrative_engine import structure_narrative, generate_narration_script

router = APIRouter(prefix="/narrative", tags=["narrative"])


class StructureRequest(BaseModel):
    era: str
    raw_text: str
    birth_year: int


class ScriptRequest(BaseModel):
    era: str
    structured_narrative: dict


@router.post("/structure")
async def create_structure(req: StructureRequest, user: dict = Depends(verify_token)):
    """서사 구조화: 원본 텍스트 → 장면 분해"""
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="텍스트를 입력해주세요")

    result = await structure_narrative(
        era=req.era,
        raw_text=req.raw_text,
        birth_year=req.birth_year,
    )
    return {"structured_narrative": result}


@router.post("/script")
async def create_script(req: ScriptRequest, user: dict = Depends(verify_token)):
    """나레이션 스크립트 생성: 구조화된 서사 → TTS용 스크립트"""
    script = await generate_narration_script(
        era=req.era,
        structured_narrative=req.structured_narrative,
    )
    return {"narration_script": script}
