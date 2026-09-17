from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GrainSale(Base):
    __tablename__ = "grain_sales"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    crop_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("crops.id"))
    grain_type: Mapped[str] = mapped_column(String, nullable=False)
    grade: Mapped[str] = mapped_column(String, default="A")
    raw_material_kg: Mapped[float] = mapped_column(Numeric, default=0)
    wastage_kg: Mapped[float] = mapped_column(Numeric, default=0)
    good_material_kg: Mapped[float] = mapped_column(Numeric, default=0)
    price_per_kg: Mapped[Optional[float]] = mapped_column(Numeric, default=0)
    total_amount: Mapped[float] = mapped_column(Numeric, default=0)
    status: Mapped[str] = mapped_column(String, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
