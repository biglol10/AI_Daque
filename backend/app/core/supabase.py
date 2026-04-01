# Design Ref: §1.3 — FastAPI → Supabase Storage 직접 접근 (Service Role Key)
from supabase import create_client, Client

from app.core.config import settings

_client: Client | None = None


def get_supabase_admin() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _client
