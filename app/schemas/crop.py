from datetime import datetime
from pydantic import BaseModel


class CropResponse(BaseModel):
    id: int | None = None
    farmer_id: int | None = None
    crop_type: str | None = None
    acres: float | None = None
    sowing_date: str | None = None
    harvest_date: str | None = None
    status: str | None = None
    current_month: int | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class RegisterCropRequest(BaseModel):
    crop_type: str
    acres: float
    sowing_date: str
    notes: str | None = None


class CropListItem(BaseModel):
    crop_id: int | None = None
    crop_type: str | None = None
    acres: float | None = None
    sowing_date: str | None = None
    farmer_id: int | None = None
    farmer_name: str | None = None
    farmer_phone: str | None = None
