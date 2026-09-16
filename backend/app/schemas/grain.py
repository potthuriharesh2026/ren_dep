from datetime import datetime
from pydantic import BaseModel


class GrainSaleResponse(BaseModel):
    id: int | None = None
    farmer_id: int | None = None
    grain_type: str | None = None
    grade: str | None = None
    raw_material_kg: float | None = None
    good_material_kg: float | None = None
    wastage_kg: float | None = None
    estimated_amount: float | None = None
    final_amount: float | None = None
    price_per_kg: float | None = None
    status: str | None = None
    payment_status: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    farmer_name: str | None = None
    farmer_phone: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    upi_id: str | None = None

    class Config:
        from_attributes = True


class SubmitGrainSaleRequest(BaseModel):
    farmer_id: int
    grain_type: str
    quantity_kg: float
    warehouse_id: int | None = None


class ProcureCropRequest(BaseModel):
    farmer_id: int
    grain_type: str
    grade: str
    raw_material_kg: float
    good_material_kg: float
    wastage_kg: float


class ReviewGrainSaleRequest(BaseModel):
    status: str
    final_amount: float | None = None


class PayGrainSaleRequest(BaseModel):
    description: str | None = None
