from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/")
async def get_notifications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50))
    return [{k: v for k, v in n.__dict__.items() if not k.startswith("_")} for n in result.scalars().all()]


@router.put("/read-all")
async def mark_all_read(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE notifications SET is_read = true WHERE user_id = :uid"), {"uid": user.id})
    return {"message": "All notifications marked as read"}


@router.put("/{notif_id}/read")
async def mark_read(notif_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE notifications SET is_read = true WHERE id = :nid AND user_id = :uid"), {"nid": notif_id, "uid": user.id})
    return {"message": "Notification marked as read"}
