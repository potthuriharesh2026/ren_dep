from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BookingSlot(Base):
    __tablename__ = "booking_slots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    grain_sale_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("grain_sales.id"))
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    warehouse_slot_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("warehouse_slots.id"))
    booking_date: Mapped[str] = mapped_column(String, nullable=False)
    delivery_address: Mapped[str] = mapped_column(String, nullable=False)
    grain_type: Mapped[str] = mapped_column(String, nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Numeric, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    procurement_status: Mapped[Optional[str]] = mapped_column(String, default="pending_procurement")
    grain_quality: Mapped[Optional[str]] = mapped_column(String)
    received_quantity_kg: Mapped[Optional[float]] = mapped_column(Numeric)
    procurement_remarks: Mapped[Optional[str]] = mapped_column(Text)
    procured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    moisture_pct: Mapped[Optional[float]] = mapped_column(Numeric)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    inspections: Mapped[list[CropInspection]] = relationship("CropInspection", back_populates="booking_slot")
    warehouse: Mapped[Warehouse] = relationship("Warehouse")
    warehouse_slot: Mapped[Optional[WarehouseSlot]] = relationship("WarehouseSlot")


class CropInspection(Base):
    __tablename__ = "crop_inspections"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    booking_slot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("booking_slots.id"), nullable=False)
    grain_sale_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("grain_sales.id"))
    inspector_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"))
    good_quantity_kg: Mapped[float] = mapped_column(Numeric, default=0)
    bad_quantity_kg: Mapped[float] = mapped_column(Numeric, default=0)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    booking_slot: Mapped[BookingSlot] = relationship("BookingSlot", back_populates="inspections")
