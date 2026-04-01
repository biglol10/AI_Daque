# Design Ref: §6 — FastAPI JWT 검증 (Supabase Auth 토큰)
# Plan SC: FR-09 사용자 인증, FR-12 가드레일
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings

security = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = settings.supabase_jwt_secret


async def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Supabase JWT 토큰 검증. 인증된 사용자 정보 반환."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다",
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다",
            )
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 만료되었거나 유효하지 않습니다",
        )
