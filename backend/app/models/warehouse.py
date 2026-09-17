from __future__ import annotations

from datetime import datetime, date, time
from typing import Optional
from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Numeric, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    total_capacity_kg: Mapped[float] = mapped_column(Numeric, nullable=False)
    current_load_kg: Mapped[float] = mapped_column(Numeric, default=0)
    manager_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    inventory: Mapped[list[WarehouseInventory]] = relationship("WarehouseInventory", back_populates="warehouse")
    slots: Mapped[list[WarehouseSlot]] = relationship("WarehouseSlot", back_populates="warehouse")


class WarehouseSlot(Base):
    __tablename__ = "warehouse_slots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    total_capacity_kg: Mapped[float] = mapped_column(Numeric, nullable=False)
    booked_capacity_kg: Mapped[float] = mapped_column(Numeric, default=0)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    warehouse: Mapped[Warehouse] = relationship("Warehouse", back_populates="slots")


class WarehouseInventory(Base):
    __tablename__ = "warehouse_inventory"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id"), nullable=False)
    grain_type: Mapped[str] = mapped_column(String, nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Numeric, default=0)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    warehouse: Mapped[Warehouse] = relationship("Warehouse", back_populates="inventory")
