from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token, verify_supabase_token
from app.models.user import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = credentials.credentials
    
    # Try custom JWT first (our app issues these)
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            return user
    except (HTTPException, ValueError, KeyError):
        pass
    
    # Fallback to Supabase token
    supabase_payload = await verify_supabase_token(token)
    if supabase_payload and supabase_payload.get("sub"):
        supabase_user_id = supabase_payload["sub"]
        try:
            import uuid as uuid_mod
            uuid_mod.UUID(supabase_user_id)
            result = await db.execute(select(User).where(User.uuid == supabase_user_id))
            user = result.scalar_one_or_none()
            if user:
                return user
        except (ValueError, TypeError):
            pass
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def require_role(allowed_roles: List[str]):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return role_checker
