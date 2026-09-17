from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest, RegisterRequest, ForgotPasswordRequest,
    UpdateProfileRequest, ChangePasswordRequest, ResolvePhoneRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, token = await auth_service.authenticate_user(db, data)
        return {
            "token": token,
            "user": {
                "id": user.id, "name": user.name, "email": user.email,
                "phone": user.phone, "role": user.role, "status": user.status,
                "first_login": user.first_login,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, token = await auth_service.register_farmer(db, data)
        return {
            "message": "Registration successful. Pending admin approval.",
            "user": {"id": user.id, "name": user.name, "phone": user.phone, "role": user.role, "status": user.status},
            "token": token,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    return {"message": "If an account exists with this email, a password reset link has been sent."}


@router.get("/user-data")
async def get_user_data(auth_user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        return await auth_service.get_user_data(db, int(auth_user_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="User not found")


@router.put("/profile")
async def update_profile(data: UpdateProfileRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await auth_service.update_profile(db, user.id, data.name, data.email)
    return {"message": "Profile updated"}


@router.put("/change-password")
async def change_password(data: ChangePasswordRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        await auth_service.change_password(db, user.id, data.current_password, data.new_password)
        return {"message": "Password changed"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/resolve-phone")
async def resolve_phone(data: ResolvePhoneRequest, db: AsyncSession = Depends(get_db)):
    email = await auth_service.resolve_phone_to_email(db, data.phone)
    return {"email": email}
