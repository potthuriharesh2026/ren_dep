from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.market import MarketRate
from app.models.user import User

from app.schemas.market import CreateMarketRateRequest, UpdateMarketRateRequest

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/")
async def get_rates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MarketRate).order_by(MarketRate.crop_type, MarketRate.grade))
    return [{k: v for k, v in m.__dict__.items() if not k.startswith("_")} for m in result.scalars().all()]


@router.post("/")
async def set_rate(data: CreateMarketRateRequest, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    rate = MarketRate(
        crop_type=data.crop_type, grade=data.grade,
        price_per_kg=data.price_per_kg or 0, effective_date=data.effective_date,
        set_by=user.id,
    )
    db.add(rate)
    await db.flush()
    return {"id": rate.id, "message": "Rate set"}


@router.put("/{rate_id}")
async def update_rate(rate_id: int, data: UpdateMarketRateRequest, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MarketRate).where(MarketRate.id == rate_id))
    rate = result.scalar_one_or_none()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(rate, key, value)
    return {"message": "Rate updated"}


@router.delete("/{rate_id}")
async def delete_rate(rate_id: int, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MarketRate).where(MarketRate.id == rate_id))
    rate = result.scalar_one_or_none()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    await db.delete(rate)
    return {"message": "Rate deleted"}
