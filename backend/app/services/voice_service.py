# Design Ref: §5.2 — TTS Generation Flow (ElevenLabs TTS + Voice Cloning)
import io

import httpx
from elevenlabs import AsyncElevenLabs

from app.core.config import settings
from app.core.supabase import get_supabase_admin

client = AsyncElevenLabs(api_key=settings.elevenlabs_api_key)

# Pre-defined Korean-appropriate ElevenLabs sample voices
SAMPLE_VOICES = [
    {
        "id": "21m00Tcm4TlvDq8ikWAM",
        "name": "남성 - 따뜻한 아버지",
        "gender": "male",
        "preview_url": None,
    },
    {
        "id": "EXAVITQu4vr4xnSDxMaL",
        "name": "여성 - 부드러운 어머니",
        "gender": "female",
        "preview_url": None,
    },
    {
        "id": "MF3mGyEYCl7XYWbV9V6O",
        "name": "남성 - 청년 내레이터",
        "gender": "male",
        "preview_url": None,
    },
    {
        "id": "jBpfAFnaylnKdtnKV0nZ",
        "name": "여성 - 밝은 내레이터",
        "gender": "female",
        "preview_url": None,
    },
]


async def get_sample_voices() -> list[dict]:
    """샘플 보이스 목록 반환."""
    return SAMPLE_VOICES


async def clone_voice(project_id: str, audio_file_url: str, voice_name: str) -> dict:
    """음성 파일 URL로부터 ElevenLabs 보이스 클로닝 수행.

    1. Supabase Storage에서 오디오 파일 다운로드
    2. ElevenLabs voice cloning API 호출
    3. 클로닝된 voice_id 반환
    """
    # 1. Download audio from URL
    async with httpx.AsyncClient() as http:
        response = await http.get(audio_file_url)
        response.raise_for_status()
        audio_bytes = response.content

    # 2. Clone voice via ElevenLabs
    cloned_voice = await client.clone(
        name=voice_name,
        description=f"프로젝트 {project_id} 사용자 클로닝 보이스",
        files=[io.BytesIO(audio_bytes)],
    )

    # 3. Save cloned voice info to Supabase
    supabase = get_supabase_admin()
    supabase.table("voices").upsert(
        {
            "project_id": project_id,
            "voice_id": cloned_voice.voice_id,
            "voice_name": voice_name,
            "voice_type": "cloned",
            "consent_given": True,
        }
    ).execute()

    return {
        "cloned_voice_id": cloned_voice.voice_id,
        "name": voice_name,
    }


def _preprocess_script(script: str) -> str:
    """[pause] 마커를 SSML break 태그로 변환."""
    processed = script.replace("[pause]", '<break time="0.5s"/>')
    processed = processed.replace("[long_pause]", '<break time="1.0s"/>')
    return processed


async def generate_tts(
    project_id: str, narration_script: str, voice_id: str
) -> dict:
    """나레이션 스크립트를 TTS 음성으로 생성.

    1. 스크립트 전처리 ([pause] -> SSML breaks)
    2. ElevenLabs TTS 호출 (eleven_multilingual_v2)
    3. 오디오 청크 수집
    4. Supabase Storage 업로드 (voices/{project_id}/narration.mp3)
    5. {audio_url, duration_estimate} 반환
    """
    # 1. Preprocess script
    processed_script = _preprocess_script(narration_script)

    # 2. Call ElevenLabs TTS
    audio_iterator = await client.text_to_speech.convert(
        voice_id=voice_id,
        text=processed_script,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )

    # 3. Collect audio chunks
    chunks: list[bytes] = []
    async for chunk in audio_iterator:
        chunks.append(chunk)
    audio_bytes = b"".join(chunks)

    # 4. Upload to Supabase Storage
    storage_path = f"{project_id}/narration.mp3"
    supabase = get_supabase_admin()

    supabase.storage.from_("voices").upload(
        path=storage_path,
        file=audio_bytes,
        file_options={"content-type": "audio/mpeg", "upsert": "true"},
    )

    public_url_data = supabase.storage.from_("voices").get_public_url(storage_path)
    audio_url = public_url_data

    # 5. Estimate duration (rough: ~150 chars/min for Korean speech)
    char_count = len(narration_script)
    duration_estimate = max(1.0, (char_count / 150) * 60)

    return {
        "audio_url": audio_url,
        "duration_estimate": round(duration_estimate, 1),
    }


async def generate_tts_preview(text: str, voice_id: str) -> bytes:
    """짧은 미리듣기 TTS 생성 (Supabase 저장 안 함, 바이트 직접 반환)."""
    audio_iterator = await client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )

    chunks: list[bytes] = []
    async for chunk in audio_iterator:
        chunks.append(chunk)

    return b"".join(chunks)
