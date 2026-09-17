from __future__ import annotations

from datetime import datetime, date
from typing import Optional
from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FarmVisit(Base):
    __tablename__ = "farm_visits"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    crop_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    farmer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    admin_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"))
    visit_month: Mapped[int] = mapped_column(nullable=False)
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date)
    actual_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="scheduled")
    verified_acres: Mapped[Optional[float]] = mapped_column(Numeric)
    report: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
