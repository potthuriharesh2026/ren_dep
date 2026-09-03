from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/storage", tags=["storage"])


@router.post("/upload")
async def upload_file(user: User = Depends(require_role(["admin", "super_admin", "farmer"])), db: AsyncSession = Depends(get_db)):
    return {"message": "File upload endpoint - implement with Supabase Storage or local storage", "url": None}
