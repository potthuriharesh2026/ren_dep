from datetime import datetime
from pydantic import BaseModel


class LoginRequest(BaseModel):
    phone: str | None = None
    email: str | None = None
    password: str
    role: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: dict


class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    address: str | None = None
    acres_of_land: float | None = None
    crop_address: str | None = None


class RegisterResponse(BaseModel):
    message: str
    user: dict
    token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ResolvePhoneRequest(BaseModel):
    phone: str
