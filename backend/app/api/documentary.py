# Design Ref: §4.3 — Documentary API Contract (Composition + Export)
import logging
import uuid
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import verify_token

from app.services.composition_service import compose_documentary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documentary", tags=["documentary"])


# ---------------------------------------------------------------------------
# In-memory task store (MVP — Redis 불필요)
# ---------------------------------------------------------------------------


class TaskStatus(str, Enum):
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskRecord(BaseModel):
    task_id: str
    project_id: str
    status: TaskStatus = TaskStatus.GENERATING
    progress: int = 0
    step: str = "preparing"
    video_url: str | None = None
    duration_sec: float | None = None
    file_size_mb: float | None = None
    error: str | None = None
    created_at: str = ""
    updated_at: str = ""


# 프로세스 내 태스크 저장소
_tasks: dict[str, TaskRecord] = {}


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------


class SceneInput(BaseModel):
    scene_id: str = Field(description="장면 ID (예: scene_1)")
    character_image_url: str = Field(description="캐릭터 이미지 URL")
    background_image_url: str = Field(description="배경 이미지 URL")
    description: str = Field(
        max_length=200,
        description="장면 설명 (자막으로 표시됨)",
    )
    duration_sec: float = Field(
        default=15.0,
        ge=3.0,
        le=120.0,
        description="장면 지속 시간 (초)",
    )


class ComposeRequest(BaseModel):
    project_id: str
    scenes: list[SceneInput] = Field(min_length=1, max_length=20)
    narration_audio_url: str = Field(description="나레이션 오디오 URL")


class ComposeResponse(BaseModel):
    task_id: str
    status: str


class StatusResponse(BaseModel):
    task_id: str
    status: str
    progress: int
    step: str
    video_url: str | None = None
    duration_sec: float | None = None
    file_size_mb: float | None = None
    error: str | None = None


class DownloadResponse(BaseModel):
    video_url: str
    project_id: str


# ---------------------------------------------------------------------------
# Background task runner
# ---------------------------------------------------------------------------


async def _run_composition(task_id: str, project_id: str, scenes: list[dict], narration_audio_url: str) -> None:
    """백그라운드에서 다큐멘터리 합성을 실행합니다."""
    task = _tasks.get(task_id)
    if not task:
        return

    def on_progress(step: str, pct: int) -> None:
        task.step = step
        task.progress = pct
        task.updated_at = datetime.now(timezone.utc).isoformat()

    try:
        result = await compose_documentary(
            project_id=project_id,
            scenes=scenes,
            narration_audio_url=narration_audio_url,
            on_progress=on_progress,
        )
        task.status = TaskStatus.COMPLETED
        task.progress = 100
        task.step = "completed"
        task.video_url = result["video_url"]
        task.duration_sec = result["duration_sec"]
        task.file_size_mb = result["file_size_mb"]

    except Exception as e:
        logger.exception("다큐멘터리 합성 실패: task_id=%s, project_id=%s", task_id, project_id)
        task.status = TaskStatus.FAILED
        task.step = "failed"
        task.error = str(e)[:500]

    task.updated_at = datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/compose", response_model=ComposeResponse)
async def compose_documentary_endpoint(
    req: ComposeRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_token),
):
    """다큐멘터리 합성을 시작합니다.

    백그라운드에서 FFmpeg 합성 작업을 실행하고
    task_id를 반환합니다. 상태는 /status/{task_id}에서 조회할 수 있습니다.
    """
    task_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    task = TaskRecord(
        task_id=task_id,
        project_id=req.project_id,
        status=TaskStatus.GENERATING,
        progress=0,
        step="preparing",
        created_at=now,
        updated_at=now,
    )
    _tasks[task_id] = task

    scenes_raw = [scene.model_dump() for scene in req.scenes]

    background_tasks.add_task(
        _run_composition,
        task_id=task_id,
        project_id=req.project_id,
        scenes=scenes_raw,
        narration_audio_url=req.narration_audio_url,
    )

    return ComposeResponse(task_id=task_id, status=TaskStatus.GENERATING)


@router.get("/status/{task_id}", response_model=StatusResponse)
async def get_composition_status(task_id: str, user: dict = Depends(verify_token)):
    """합성 작업의 현재 상태를 조회합니다."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    return StatusResponse(
        task_id=task.task_id,
        status=task.status,
        progress=task.progress,
        step=task.step,
        video_url=task.video_url,
        duration_sec=task.duration_sec,
        file_size_mb=task.file_size_mb,
        error=task.error,
    )


@router.get("/{project_id}/download", response_model=DownloadResponse)
async def get_download_url(project_id: str, user: dict = Depends(verify_token)):
    """프로젝트의 다큐멘터리 다운로드 URL을 반환합니다."""
    from app.core.supabase import get_supabase_admin

    supabase = get_supabase_admin()
    storage_path = f"{project_id}/documentary.mp4"

    try:
        url = supabase.storage.from_("documentaries").get_public_url(storage_path)
    except Exception as e:
        logger.error("다운로드 URL 생성 실패: %s", str(e))
        raise HTTPException(
            status_code=404,
            detail="다큐멘터리 파일을 찾을 수 없습니다.",
        )

    return DownloadResponse(video_url=url, project_id=project_id)
