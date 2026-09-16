from datetime import datetime
from pydantic import BaseModel


class WarehouseResponse(BaseModel):
    id: int | None = None
    name: str | None = None
    address: str | None = None
    total_capacity_kg: float | None = None
    current_load_kg: float | None = None
    is_active: bool | None = None
    created_at: datetime | None = None
    available_kg: float | None = None
    inventory: list[dict] | None = None

    class Config:
        from_attributes = True


class CreateWarehouseRequest(BaseModel):
    name: str
    address: str
    total_capacity_kg: float
    is_active: bool = True


class WarehouseSlotResponse(BaseModel):
    id: int | None = None
    warehouse_id: int | None = None
    slot_date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    total_capacity_kg: float | None = None
    booked_capacity_kg: float | None = None
    status: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class CreateWarehouseSlotRequest(BaseModel):
    warehouse_id: int
    slot_date: str
    start_time: str
    end_time: str
    total_capacity_kg: float


class UpdateWarehouseSlotRequest(BaseModel):
    slot_date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    total_capacity_kg: float | None = None
    status: str | None = None


class AddInventoryRequest(BaseModel):
    grain_type: str
    quantity_kg: float
