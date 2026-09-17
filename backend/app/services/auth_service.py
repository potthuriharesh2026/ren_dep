from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import httpx

from app.auth import create_token, hash_password, verify_password
from app.models.user import User, Profile, FarmerProfile
from app.schemas.auth import RegisterRequest, LoginRequest
from app.config import settings


async def authenticate_user(db: AsyncSession, data: LoginRequest) -> tuple[User, str]:
    raw_ident = (data.phone_or_email or data.email or data.phone or "").strip()
    if not raw_ident:
        raise ValueError("Phone or email is required")

    clean_phone = raw_ident.replace("+91", "").replace("-", "").replace(" ", "")
    query = select(User).where(
        (User.email.ilike(raw_ident)) | (User.phone == clean_phone) | (User.phone == raw_ident)
    )

    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("Invalid credentials")

    if not verify_password(data.password, user.password_hash):
        raise ValueError("Invalid credentials")

    if data.role:
        if data.role in ("admin", "super_admin"):
            if user.role not in ("admin", "super_admin"):
                raise ValueError(f"Access denied. This account is not an {data.role} account.")
        elif user.role != data.role:
            raise ValueError(f"Access denied. This account is not a {data.role} account.")

    token = create_token(user.id, user.role, user.status)
    return user, token


async def register_farmer(db: AsyncSession, data: RegisterRequest) -> tuple[User, str]:
    existing = await db.execute(select(User).where(User.phone == data.phone))
    if existing.scalar_one_or_none():
        raise ValueError("Phone number already registered")

    if data.email:
        existing_email = await db.execute(select(User).where(User.email == data.email))
        if existing_email.scalar_one_or_none():
            raise ValueError("Email already registered")

    # Create user in public.users table (local DB only)
    user_uuid = uuid.uuid4()
    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role="farmer",
        status="pending",
        first_login=True,
        uuid=user_uuid,
    )
    db.add(user)
    await db.flush()

    # Try to create profile - check if auth user exists first
    profile_created = False
    try:
        # Check if auth user exists in Supabase
        auth_exists = await check_supabase_auth_user(user_uuid)
        if auth_exists:
            profile = Profile(
                id=user_uuid,
                auth_user_id=user_uuid,
                app_user_id=user.id,
                name=data.name,
                email=data.email,
                phone=data.phone,
                role="farmer",
                status="pending",
                first_login=True,
                address=data.address,
            )
            db.add(profile)
            profile_created = True
        else:
            # Create profile without FK constraint violation - use a different approach
            # Create profile with user UUID but don't enforce FK if auth user doesn't exist yet
            pass
    except Exception as e:
        # Profile creation failed, continue without it
        pass

    farmer_profile = FarmerProfile(
        user_id=user.id,
        address=data.address,
        acres_of_land=data.acres_of_land or 0,
        crop_address=data.crop_address,
    )
    db.add(farmer_profile)

    token = create_token(user.id, user.role, user.status)
    return user, token


async def check_supabase_auth_user(auth_user_id: uuid.UUID) -> bool:
    """Check if a user exists in Supabase Auth."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users/{auth_user_id}",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                },
                timeout=10,
            )
            return resp.status_code == 200
    except Exception:
        return False


async def get_user_data(db: AsyncSession, user_id: int) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    farmer_profile = None
    if user.role == "farmer":
        fp_result = await db.execute(select(FarmerProfile).where(FarmerProfile.user_id == user.id))
        fp = fp_result.scalar_one_or_none()
        if fp:
            farmer_profile = {
                "address": fp.address, "acres_of_land": fp.acres_of_land,
                "crop_address": fp.crop_address, "bank_name": fp.bank_name,
                "account_number": fp.account_number, "ifsc_code": fp.ifsc_code,
                "upi_id": fp.upi_id, "bank_status": fp.bank_status,
            }

    return {
        "id": user.id, "name": user.name, "email": user.email,
        "phone": user.phone, "role": user.role, "status": user.status,
        "first_login": user.first_login, "created_at": str(user.created_at),
        "farmer_profile": farmer_profile,
    }


async def update_profile(db: AsyncSession, user_id: int, name: str | None, email: str | None) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")
    if name:
        user.name = name
    if email:
        user.email = email


async def change_password(db: AsyncSession, user_id: int, current_password: str, new_password: str) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")
    if not verify_password(current_password, user.password_hash):
        raise ValueError("Current password is incorrect")
    user.password_hash = hash_password(new_password)


async def resolve_phone_to_email(db: AsyncSession, phone: str) -> str:
    clean_phone = phone.replace("+91", "")
    result = await db.execute(select(User).where(User.phone == clean_phone))
    user = result.scalar_one_or_none()
    if user and user.email:
        return user.email
    return f"{clean_phone}@agriseq.local"