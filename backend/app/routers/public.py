from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.seed import Seed
from app.models.user import User

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func as sqla_func
    from app.models.crop import Crop
    from app.models.warehouse import Warehouse
    from app.models.grain import GrainSale

    farmer_count = (await db.execute(select(sqla_func.count(User.id)).where(User.role == "farmer", User.status == "active"))).scalar() or 0
    crop_count = (await db.execute(select(sqla_func.count(Crop.id)))).scalar() or 0
    seed_count = (await db.execute(select(sqla_func.count(Seed.id)).where(Seed.is_active == True))).scalar() or 0
    warehouse_count = (await db.execute(select(sqla_func.count(Warehouse.id)).where(Warehouse.is_active == True))).scalar() or 0
    grain_sales_count = (await db.execute(select(sqla_func.count(GrainSale.id)).where(GrainSale.status.in_(["procured", "completed"])))).scalar() or 0

    return {
        "active_farmers": farmer_count,
        "registered_crops": crop_count,
        "available_seeds": seed_count,
        "active_warehouses": warehouse_count,
        "grain_procured_count": grain_sales_count,
    }


@router.get("/seeds")
async def get_seeds(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seed).where(Seed.is_active == True, Seed.stock_kg > 0).order_by(Seed.name))
    return [{k: v for k, v in s.__dict__.items() if not k.startswith("_")} for s in result.scalars().all()]
