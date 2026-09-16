from __future__ import annotations

from datetime import datetime
from typing import Optional
import uuid
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, unique=True)
    phone: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="farmer")
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    first_login: Mapped[bool] = mapped_column(Boolean, default=True)
    uuid: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    farmer_profile: Mapped["FarmerProfile | None"] = relationship("FarmerProfile", back_populates="user", uselist=False)
    manager: Mapped["Manager | None"] = relationship("Manager", back_populates="user", uselist=False)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    app_user_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    name: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    role: Mapped[str | None] = mapped_column(String)
    status: Mapped[str | None] = mapped_column(String)
    first_login: Mapped[bool | None] = mapped_column(Boolean)
    address: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    acres_of_land: Mapped[float] = mapped_column(default=0)
    crop_address: Mapped[str | None] = mapped_column(Text)
    bank_name: Mapped[str | None] = mapped_column(String)
    account_number: Mapped[str | None] = mapped_column(String)
    ifsc_code: Mapped[str | None] = mapped_column(String)
    upi_id: Mapped[str | None] = mapped_column(String)
    bank_status: Mapped[str] = mapped_column(String, default="approved")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="farmer_profile")


class Manager(Base):
    __tablename__ = "managers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department: Mapped[str | None] = mapped_column(String)

    user: Mapped["User"] = relationship("User", back_populates="manager")
