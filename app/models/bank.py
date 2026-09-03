from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BankChangeRequest(Base):
    __tablename__ = "bank_change_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    bank_name: Mapped[Optional[str]] = mapped_column(String)
    account_number: Mapped[Optional[str]] = mapped_column(String)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String)
    upi_id: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")
    admin_notes: Mapped[Optional[str]] = mapped_column(Text)
    reviewed_by: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"))
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
