from datetime import datetime
from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    status: str | None = None
    first_login: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FarmerProfileResponse(BaseModel):
    id: int | None = None
    user_id: int | None = None
    address: str | None = None
    acres_of_land: float | None = None
    crop_address: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    upi_id: str | None = None
    bank_status: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FarmerListItem(BaseModel):
    id: int | None = None
    profile_id: str | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    status: str | None = None
    created_at: datetime | None = None
    verified_at: datetime | None = None
    address: str | None = None
    acres_of_land: float | None = None
    crop_address: str | None = None
    bank_status: str | None = None


class ManagerListItem(BaseModel):
    id: int | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    status: str | None = None
    created_at: datetime | None = None
    department: str | None = None


class CreateManagerRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    department: str | None = None


class UpdateManagerRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    status: str | None = None


class UpdateManagerStatusRequest(BaseModel):
    status: str


class UpdateFarmerProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    address: str | None = None
    acres_of_land: float | None = None
    crop_address: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    upi_id: str | None = None


class ApproveFarmerRequest(BaseModel):
    status: str | None = "active"
    notes: str | None = None
