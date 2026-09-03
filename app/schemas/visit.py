from datetime import datetime
from pydantic import BaseModel


class FarmVisitResponse(BaseModel):
    id: int | None = None
    crop_id: int | None = None
    farmer_id: int | None = None
    admin_id: int | None = None
    visit_month: int | None = None
    scheduled_date: str | None = None
    actual_date: str | None = None
    status: str | None = None
    verified_acres: float | None = None
    report: str | None = None
    created_at: datetime | None = None
    farmer_name: str | None = None
    farmer_phone: str | None = None
    manager_name: str | None = None
    manager_phone: str | None = None
    crop_type: str | None = None
    sowing_date: str | None = None
    description: str | None = None
    crop_address: str | None = None

    class Config:
        from_attributes = True


class ScheduleVisitRequest(BaseModel):
    crop_id: int
    farmer_id: int
    visit_month: int
    scheduled_date: str
    admin_id: int | None = None


class UpdateVisitRequest(BaseModel):
    status: str | None = None
    actual_date: str | None = None
    verified_acres: float | None = None
    report: str | None = None
    scheduled_date: str | None = None
    admin_id: int | None = None
