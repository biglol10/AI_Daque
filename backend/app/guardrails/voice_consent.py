# Design Ref: §14.3 — 보이스 클로닝 동의 검증
from fastapi import HTTPException

from app.core.supabase import get_supabase_admin


class VoiceConsentGuard:
    """보이스 클로닝 동의 여부를 검증하는 가드레일."""

    async def verify(self, project_id: str, voice_type: str) -> bool:
        """voice_type이 'cloned'인 경우 consent_given=true 여부를 확인.

        샘플 보이스인 경우 동의 확인 불필요.
        클로닝 보이스인 경우 해당 프로젝트에 동의가 기록되어 있어야 함.
        """
        if voice_type != "cloned":
            return True

        supabase = get_supabase_admin()
        result = (
            supabase.table("voices")
            .select("consent_given")
            .eq("project_id", project_id)
            .eq("voice_type", "cloned")
            .eq("consent_given", True)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=403,
                detail="보이스 클로닝을 사용하려면 먼저 동의가 필요합니다.",
            )

        return True

    async def record_consent(
        self, project_id: str, consent_given: bool
    ) -> dict:
        """프로젝트에 대한 보이스 클로닝 동의를 기록."""
        supabase = get_supabase_admin()
        supabase.table("voices").upsert(
            {
                "project_id": project_id,
                "voice_type": "cloned",
                "consent_given": consent_given,
            },
            on_conflict="project_id,voice_type",
        ).execute()

        return {
            "project_id": project_id,
            "consent_given": consent_given,
        }


# Module-level singleton
voice_consent_guard = VoiceConsentGuard()
