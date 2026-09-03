from __future__ import annotations

from datetime import datetime, date
from typing import Optional
from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Seed(Base):
    __tablename__ = "seeds"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    variety: Mapped[Optional[str]] = mapped_column(String)
    price_per_kg: Mapped[float] = mapped_column(Numeric, nullable=False)
    stock_kg: Mapped[float] = mapped_column(Numeric, nullable=False, default=0)
    on_hold_kg: Mapped[float] = mapped_column(Numeric, default=0)
    description: Mapped[Optional[str]] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    warehouse_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("warehouses.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    warehouses: Mapped[list[SeedWarehouse]] = relationship("SeedWarehouse", back_populates="seed")


class SeedWarehouse(Base):
    __tablename__ = "seed_warehouses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    seed_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("seeds.id", ondelete="CASCADE"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)

    seed: Mapped[Seed] = relationship("Seed", back_populates="warehouses")
    warehouse: Mapped[Warehouse] = relationship("Warehouse")


class SeedPurchase(Base):
    __tablename__ = "seed_purchases"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    seed_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("seeds.id"), nullable=False)
    warehouse_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("warehouses.id"))
    quantity_kg: Mapped[float] = mapped_column(Numeric, nullable=False)
    price_per_kg: Mapped[Optional[float]] = mapped_column(Numeric)
    total_amount: Mapped[Optional[float]] = mapped_column(Numeric)
    payment_status: Mapped[str] = mapped_column(String, default="pending")
    invoice_number: Mapped[Optional[str]] = mapped_column(String)
    pickup_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    seed: Mapped[Seed] = relationship("Seed")

