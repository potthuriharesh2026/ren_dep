from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int | None = None
    user_id: int | None = None
    title: str | None = None
    message: str | None = None
    type: str | None = None
    is_read: bool | None = None
    reference_type: str | None = None
    reference_id: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
