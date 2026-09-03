from datetime import datetime
from pydantic import BaseModel


class SeedResponse(BaseModel):
    id: int | None = None
    name: str | None = None
    variety: str | None = None
    price_per_kg: float | None = None
    stock_kg: float | None = None
    on_hold_kg: float | None = None
    description: str | None = None
    image_url: str | None = None
    is_active: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    warehouses: list[dict] | None = None

    class Config:
        from_attributes = True


class CreateSeedRequest(BaseModel):
    name: str
    variety: str | None = None
    price_per_kg: float
    stock_kg: float
    description: str | None = None
    image_url: str | None = None
    is_active: bool = True
    warehouse_ids: list[int] | None = None


class UpdateSeedRequest(BaseModel):
    name: str | None = None
    variety: str | None = None
    price_per_kg: float | None = None
    stock_kg: float | None = None
    description: str | None = None
    image_url: str | None = None
    is_active: bool | None = None
    warehouse_ids: list[int] | None = None


class PurchaseSeedRequest(BaseModel):
    farmer_id: int
    seed_id: int
    quantity_kg: float
    payment_method: str | None = None
    upi_id: str | None = None
    transaction_id: str | None = None
    warehouse_id: int | None = None
    pickup_date: str | None = None


class SeedPurchaseResponse(BaseModel):
    id: int | None = None
    farmer_id: int | None = None
    seed_id: int | None = None
    quantity_kg: float | None = None
    payment_method: str | None = None
    payment_status: str | None = None
    upi_id: str | None = None
    transaction_id: str | None = None
    warehouse_id: int | None = None
    pickup_date: str | None = None
    created_at: datetime | None = None
    seed_name: str | None = None
    seed_variety: str | None = None
    farmer_name: str | None = None
    farmer_phone: str | None = None

    class Config:
        from_attributes = True


class UpdateSeedPurchaseStatusRequest(BaseModel):
    status: str
