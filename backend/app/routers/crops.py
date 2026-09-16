from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models.crop import Crop
from app.models.user import User
from app.services import farmer_service

router = APIRouter(prefix="/api/crops", tags=["crops"])


@router.get("/")
async def get_crops(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role == "farmer":
        return await farmer_service.get_crops(db, user.id)
    result = await db.execute(select(Crop).order_by(Crop.created_at.desc()))
    return [{k: v for k, v in c.__dict__.items() if not k.startswith("_")} for c in result.scalars().all()]


@router.post("/")
async def register_crop(data: dict, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    crop_type = data.get("crop_type") or data.get("crop_name") or "General Crop"
    acres = data.get("acres") or data.get("acreage") or 1.0
    sowing_date = data.get("sowing_date") or data.get("planting_date")
    harvest_date = data.get("harvest_date") or data.get("expected_harvest_date")
    notes = data.get("notes") or (f"Seed: {data.get('seed_name')}" if data.get("seed_name") else None)

    crop_id = await farmer_service.register_crop(
        db, user.id, crop_type=crop_type, acres=float(acres),
        sowing_date=sowing_date, notes=notes, harvest_date=harvest_date,
    )
    return {"id": crop_id, "message": "Crop registered"}
