from datetime import datetime
from pydantic import BaseModel


class MarketRateResponse(BaseModel):
    id: int | None = None
    crop_type: str | None = None
    grade: str | None = None
    price_per_kg: float | None = None
    effective_date: str | None = None
    set_by: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class CreateMarketRateRequest(BaseModel):
    crop_type: str
    grade: str
    price_per_kg: float
    effective_date: str


class UpdateMarketRateRequest(BaseModel):
    crop_type: str | None = None
    grade: str | None = None
    price_per_kg: float | None = None
    effective_date: str | None = None
