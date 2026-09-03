from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    reference_type: Mapped[str] = mapped_column(String, nullable=False)
    reference_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    farmer_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric, nullable=False)
    direction: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    description: Mapped[Optional[str]] = mapped_column(Text)
    upi_id: Mapped[Optional[str]] = mapped_column(String)
    transaction_id: Mapped[Optional[str]] = mapped_column(String)
    invoice_number: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
