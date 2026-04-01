# Design Ref: §5.2 — Slideshow Composition (FFmpeg)
import logging
import os
import shutil
import subprocess
import tempfile
import uuid

import httpx

from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

# Korean font path candidates (tried in order)
_KOREAN_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def _find_korean_font() -> str:
    """시스템에서 사용 가능한 한국어 폰트 경로를 탐색합니다."""
    for path in _KOREAN_FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    # FFmpeg drawtext의 기본 폰트로 폴백
    return ""


async def download_file(url: str, dest_path: str) -> str:
    """URL에서 파일을 다운로드합니다."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        with open(dest_path, "wb") as f:
            f.write(resp.content)
    return dest_path


def get_audio_duration(audio_path: str) -> float:
    """FFprobe로 오디오 길이를 측정합니다."""
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            audio_path,
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    duration_str = result.stdout.strip()
    if duration_str:
        try:
            return float(duration_str)
        except ValueError:
            pass
    return 60.0


def _build_scene_clip(
    work_dir: str,
    scene_index: int,
    background_path: str,
    character_path: str,
    description: str,
    duration_sec: float,
    font_path: str,
) -> str:
    """개별 장면 클립을 생성합니다.

    배경 위에 캐릭터를 오버레이하고 자막을 추가합니다.
    """
    output_path = os.path.join(work_dir, f"scene_{scene_index}.mp4")

    # 자막 텍스트 정리 — FFmpeg drawtext 특수문자 이스케이프
    safe_text = (
        description
        .replace("\\", "\\\\\\\\")
        .replace("'", "\u2019")
        .replace(":", "\\:")
        .replace("%", "%%")
    )
    # 50자 제한
    if len(safe_text) > 50:
        safe_text = safe_text[:47] + "..."

    # drawtext 폰트 옵션
    font_opt = f"fontfile={font_path}:" if font_path else ""

    filter_complex = (
        f"[1]scale=400:-1[char];"
        f"[0][char]overlay=(W-w)/2:H-h-100,"
        f"drawtext={font_opt}"
        f"text='{safe_text}':"
        f"fontsize=28:fontcolor=white:"
        f"borderw=2:bordercolor=black:"
        f"x=(w-text_w)/2:y=h-80,"
        f"scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"
    )

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-t", str(duration_sec), "-i", background_path,
        "-loop", "1", "-t", str(duration_sec), "-i", character_path,
        "-filter_complex", filter_complex,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-r", "24",
        "-b:v", "2M",
        "-t", str(duration_sec),
        output_path,
    ]

    logger.info("장면 %d 렌더링: %s", scene_index, " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        logger.error("FFmpeg 장면 렌더링 실패: %s", result.stderr)
        raise RuntimeError(f"장면 {scene_index} 렌더링 실패: {result.stderr[-500:]}")

    return output_path


def _concatenate_scenes(work_dir: str, scene_paths: list[str]) -> str:
    """모든 장면 클립을 하나의 비디오로 연결합니다."""
    concat_file = os.path.join(work_dir, "concat.txt")
    with open(concat_file, "w", encoding="utf-8") as f:
        for path in scene_paths:
            # concat 파일에서 경로를 이스케이프
            escaped = path.replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")

    output_path = os.path.join(work_dir, "video_only.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-c", "copy",
        output_path,
    ]

    logger.info("장면 연결 중: %d개 클립", len(scene_paths))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        logger.error("FFmpeg 연결 실패: %s", result.stderr)
        raise RuntimeError(f"장면 연결 실패: {result.stderr[-500:]}")

    return output_path


def _add_audio_track(work_dir: str, video_path: str, audio_path: str) -> str:
    """비디오에 오디오 트랙을 합성합니다."""
    output_path = os.path.join(work_dir, "final.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path,
    ]

    logger.info("오디오 트랙 합성 중")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        logger.error("FFmpeg 오디오 합성 실패: %s", result.stderr)
        raise RuntimeError(f"오디오 합성 실패: {result.stderr[-500:]}")

    return output_path


async def compose_documentary(
    project_id: str,
    scenes: list[dict],
    narration_audio_url: str,
    on_progress: callable | None = None,
) -> dict:
    """모든 에셋을 결합하여 최종 MP4 슬라이드쇼를 생성합니다.

    scenes format:
        [
            {
                "scene_id": "scene_1",
                "character_image_url": "https://...",
                "background_image_url": "https://...",
                "description": "장면 설명",
                "duration_sec": 15
            }
        ]

    Returns:
        {
            "video_url": "https://...",
            "duration_sec": float,
            "file_size_mb": float,
        }
    """
    work_dir = os.path.join(
        tempfile.gettempdir(),
        "documentary",
        f"{project_id}_{uuid.uuid4().hex[:8]}",
    )
    os.makedirs(work_dir, exist_ok=True)

    try:
        # --- 1. 에셋 다운로드 ---
        if on_progress:
            on_progress("downloading", 5)

        narration_ext = ".mp3"
        if ".wav" in narration_audio_url.lower():
            narration_ext = ".wav"
        narration_path = os.path.join(work_dir, f"narration{narration_ext}")
        await download_file(narration_audio_url, narration_path)

        scene_assets: list[dict] = []
        for i, scene in enumerate(scenes):
            bg_path = os.path.join(work_dir, f"bg_{i}.png")
            char_path = os.path.join(work_dir, f"char_{i}.png")
            await download_file(scene["background_image_url"], bg_path)
            await download_file(scene["character_image_url"], char_path)
            scene_assets.append({
                "background_path": bg_path,
                "character_path": char_path,
                "description": scene.get("description", ""),
                "duration_sec": scene.get("duration_sec", 15),
            })

        if on_progress:
            on_progress("composing", 20)

        # --- 2. 오디오 길이 측정 ---
        total_audio_duration = get_audio_duration(narration_path)

        # 장면별 duration 조정: 총 오디오 길이에 맞추기
        total_scene_duration = sum(s["duration_sec"] for s in scene_assets)
        if total_scene_duration > 0 and total_audio_duration > 0:
            scale_factor = total_audio_duration / total_scene_duration
            for s in scene_assets:
                s["duration_sec"] = max(3.0, s["duration_sec"] * scale_factor)

        # --- 3. 장면별 클립 생성 ---
        font_path = _find_korean_font()
        scene_clip_paths: list[str] = []

        for i, assets in enumerate(scene_assets):
            if on_progress:
                pct = 20 + int(50 * (i / len(scene_assets)))
                on_progress("composing", pct)

            clip_path = _build_scene_clip(
                work_dir=work_dir,
                scene_index=i,
                background_path=assets["background_path"],
                character_path=assets["character_path"],
                description=assets["description"],
                duration_sec=assets["duration_sec"],
                font_path=font_path,
            )
            scene_clip_paths.append(clip_path)

        if on_progress:
            on_progress("merging_audio", 75)

        # --- 4. 장면 연결 ---
        if len(scene_clip_paths) == 1:
            video_only_path = scene_clip_paths[0]
        else:
            video_only_path = _concatenate_scenes(work_dir, scene_clip_paths)

        # --- 5. 오디오 합성 ---
        if on_progress:
            on_progress("merging_audio", 85)

        final_path = _add_audio_track(work_dir, video_only_path, narration_path)

        # --- 6. 업로드 ---
        if on_progress:
            on_progress("uploading", 90)

        video_url = await upload_documentary(project_id, final_path)

        # 파일 크기 및 길이
        file_size_bytes = os.path.getsize(final_path)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
        final_duration = get_audio_duration(final_path)

        if on_progress:
            on_progress("completed", 100)

        return {
            "video_url": video_url,
            "duration_sec": final_duration,
            "file_size_mb": file_size_mb,
        }

    finally:
        # --- 7. 임시 파일 정리 ---
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            logger.warning("임시 디렉토리 정리 실패: %s", work_dir)


async def upload_documentary(project_id: str, file_path: str) -> str:
    """최종 MP4를 Supabase Storage에 업로드합니다."""
    supabase = get_supabase_admin()

    with open(file_path, "rb") as f:
        data = f.read()

    storage_path = f"{project_id}/documentary.mp4"

    supabase.storage.from_("documentaries").upload(
        storage_path,
        data,
        {"content-type": "video/mp4", "upsert": "true"},
    )

    return supabase.storage.from_("documentaries").get_public_url(storage_path)
