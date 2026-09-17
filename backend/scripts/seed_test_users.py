"""
Seed script to create default test users for all roles in AgriFlow.
Run from backend directory with:
    python scripts/seed_test_users.py
"""
import asyncio
import os
import sys
import uuid

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.user import User, FarmerProfile, Manager
from app.core.security import hash_password


TEST_USERS = [
    {
        "name": "Super Admin",
        "email": "admin@agriflow.local",
        "phone": "9999999999",
        "password": "AdminPassword123!",
        "role": "admin",
        "status": "active",
        "first_login": False,
    },
    {
        "name": "Warehouse Manager",
        "email": "manager@agriflow.local",
        "phone": "8888888888",
        "password": "ManagerPassword123!",
        "role": "manager",
        "status": "active",
        "first_login": False,
        "department": "Operations",
    },
    {
        "name": "Test Farmer",
        "email": "farmer@agriflow.local",
        "phone": "7777777777",
        "password": "FarmerPassword123!",
        "role": "farmer",
        "status": "active",
        "first_login": False,
        "address": "Sector 5, Green Valley",
        "acres_of_land": 10.5,
        "crop_address": "Farm Plot #42",
    },
]


async def seed_users():
    print("Connecting to database and seeding test users...")
    async with async_session_factory() as session:
        for user_data in TEST_USERS:
            # Check if user already exists
            query = select(User).where(
                (User.phone == user_data["phone"]) | (User.email == user_data["email"])
            )
            result = await session.execute(query)
            existing_user = result.scalar_one_or_none()

            hashed_pw = hash_password(user_data["password"])

            if existing_user:
                print(f"Updating existing user: {user_data['email']} ({user_data['role']})")
                existing_user.name = user_data["name"]
                existing_user.password_hash = hashed_pw
                existing_user.role = user_data["role"]
                existing_user.status = user_data["status"]
                existing_user.first_login = user_data["first_login"]
                user = existing_user
            else:
                print(f"Creating user: {user_data['email']} ({user_data['role']})")
                user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    phone=user_data["phone"],
                    password_hash=hashed_pw,
                    role=user_data["role"],
                    status=user_data["status"],
                    first_login=user_data["first_login"],
                    uuid=uuid.uuid4(),
                )
                session.add(user)
                await session.flush()

            # Ensure related profile records exist
            if user.role == "farmer":
                fp_res = await session.execute(select(FarmerProfile).where(FarmerProfile.user_id == user.id))
                fp = fp_res.scalar_one_or_none()
                if not fp:
                    session.add(
                        FarmerProfile(
                            user_id=user.id,
                            address=user_data.get("address"),
                            acres_of_land=user_data.get("acres_of_land", 0),
                            crop_address=user_data.get("crop_address"),
                        )
                    )
            elif user.role == "manager":
                mgr_res = await session.execute(select(Manager).where(Manager.user_id == user.id))
                mgr = mgr_res.scalar_one_or_none()
                if not mgr:
                    session.add(
                        Manager(
                            user_id=user.id,
                            department=user_data.get("department", "Operations"),
                        )
                    )

        await session.commit()
        print("\nSeed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_users())
