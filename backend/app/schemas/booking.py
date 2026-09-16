from datetime import datetime
from pydantic import BaseModel


class BookingSlotResponse(BaseModel):
    id: int | None = None
    farmer_id: int | None = None
    grain_sale_id: int | None = None
    warehouse_id: int | None = None
    warehouse_slot_id: int | None = None
    booking_date: str | None = None
    delivery_address: str | None = None
    grain_type: str | None = None
    quantity_kg: float | None = None
    status: str | None = None
    good_quantity_kg: float | None = None
    bad_quantity_kg: float | None = None
    admin_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    farmer_name: str | None = None
    phone: str | None = None
    warehouse_name: str | None = None
    warehouse_address: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    inspection_id: int | None = None
    rejection_reason: str | None = None
    inspection_notes: str | None = None
    inspection_date: datetime | None = None
    inspector_name: str | None = None

    class Config:
        from_attributes = True


class CreateBookingRequest(BaseModel):
    farmer_id: int
    booking_date: str
    delivery_address: str = "TBD"
    grain_type: str
    warehouse_id: int | None = None
    quantity_kg: float
    warehouse_slot_id: int | None = None


class EditYieldRequest(BaseModel):
    good_qty: float
    bad_qty: float


class UpdateBookingStatusRequest(BaseModel):
    status: str
    warehouse_slot_id: int | None = None


class ProcureGrainRequest(BaseModel):
    slot_id: int
    received_qty_kg: float
    moisture_pct: float | None = None
    remarks: str | None = None
    quality: str | None = None
    procurement_status: str | None = None


class InspectCropRequest(BaseModel):
    good_qty: float
    bad_qty: float
    rejection_reason: str | None = None
    notes: str | None = None


class CropInspectionResponse(BaseModel):
    id: int | None = None
    booking_slot_id: int | None = None
    good_quantity_kg: float | None = None
    bad_quantity_kg: float | None = None
    rejection_reason: str | None = None
    notes: str | None = None
    inspector_id: int | None = None
    inspector_name: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
