from datetime import datetime, date
from typing import Optional
from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_type: Mapped[str] = mapped_column(String, nullable=False)
    acres: Mapped[float] = mapped_column(Numeric, nullable=False)
    sowing_date: Mapped[date] = mapped_column(Date, nullable=False)
    harvest_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="growing")
    current_month: Mapped[int] = mapped_column(default=1)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
