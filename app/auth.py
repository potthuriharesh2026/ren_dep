from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User

# Use pbkdf2_sha256 by default, with fallbacks for bcrypt and argon2
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt", "argon2"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_token(user_id: int, role: str, status_val: str = "active") -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    payload = {"sub": str(user_id), "role": role, "status": status_val, "exp": exp}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Verify a Supabase JWT token.
    Supabase uses RS256 algorithm with JWKS endpoint.
    """
    try:
        # For now, we'll decode with the Supabase JWT secret if available
        # In production, you should fetch JWKS from Supabase
        if settings.SUPABASE_JWT_SECRET:
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
        else:
            # Fallback: decode without verification (not secure for production)
            return jwt.decode(
                token,
                "",
                algorithms=["HS256"],
                options={"verify_signature": False, "verify_aud": False}
            )
    except JWTError:
        return None
    except Exception:
        return None


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
        # Validate that sub looks like a UUID before querying
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


def require_role(allowed_roles: list[str]):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return role_checker