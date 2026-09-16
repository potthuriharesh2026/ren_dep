from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.warehouse import Warehouse, WarehouseSlot, WarehouseInventory
from app.models.user import User

router = APIRouter(prefix="/api/warehouse", tags=["warehouse"])


@router.get("/")
async def list_warehouses(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).order_by(Warehouse.name))
    return [{k: v for k, v in w.__dict__.items() if not k.startswith("_")} for w in result.scalars().all()]


@router.post("/")
async def create_warehouse(data: dict, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    wh = Warehouse(name=data.get("name"), address=data.get("address"), total_capacity_kg=data.get("total_capacity_kg", 0), is_active=data.get("is_active", True))
    db.add(wh)
    await db.flush()
    return {"id": wh.id, "message": "Warehouse created"}


@router.post("/{warehouse_id}/inventory")
async def add_inventory(warehouse_id: int, data: dict, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseInventory).where(WarehouseInventory.warehouse_id == warehouse_id, WarehouseInventory.grain_type == data.get("grain_type")))
    inv = result.scalar_one_or_none()
    if inv:
        inv.quantity_kg = float(inv.quantity_kg or 0) + float(data.get("quantity_kg", 0))
    else:
        inv = WarehouseInventory(warehouse_id=warehouse_id, grain_type=data.get("grain_type"), quantity_kg=data.get("quantity_kg", 0))
        db.add(inv)
    return {"message": "Inventory updated"}


@router.get("/{warehouse_id}/slots")
async def get_slots(warehouse_id: int, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseSlot).where(WarehouseSlot.warehouse_id == warehouse_id).order_by(WarehouseSlot.slot_date, WarehouseSlot.start_time))
    return [{k: v for k, v in s.__dict__.items() if not k.startswith("_")} for s in result.scalars().all()]


@router.get("/slots/list")
async def list_all_slots(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseSlot).order_by(WarehouseSlot.slot_date, WarehouseSlot.start_time))
    return [{k: v for k, v in s.__dict__.items() if not k.startswith("_")} for s in result.scalars().all()]


@router.post("/slots")
async def create_slot(data: dict, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    from datetime import date as dt_date, time as dt_time

    raw_date = data.get("slot_date")
    try:
        parsed_date = dt_date.fromisoformat(str(raw_date)[:10]) if raw_date else dt_date.today()
    except (ValueError, TypeError):
        parsed_date = dt_date.today()

    raw_start = data.get("start_time")
    try:
        parsed_start = dt_time.fromisoformat(str(raw_start)) if raw_start else dt_time(9, 0)
    except (ValueError, TypeError):
        parsed_start = dt_time(9, 0)

    raw_end = data.get("end_time")
    try:
        parsed_end = dt_time.fromisoformat(str(raw_end)) if raw_end else dt_time(17, 0)
    except (ValueError, TypeError):
        parsed_end = dt_time(17, 0)

    slot = WarehouseSlot(
        warehouse_id=data.get("warehouse_id", 1),
        slot_date=parsed_date,
        start_time=parsed_start,
        end_time=parsed_end,
        total_capacity_kg=float(data.get("total_capacity_kg", 50000)),
        status="active",
    )
    db.add(slot)
    try:
        await db.flush()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="A warehouse slot for this date and time range already exists.")

    return {"id": slot.id, "message": "Slot created"}


@router.put("/slots/{slot_id}")
async def update_slot(slot_id: int, data: dict, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseSlot).where(WarehouseSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    for key in ("slot_date", "start_time", "end_time", "total_capacity_kg", "status"):
        if key in data and data[key] is not None:
            setattr(slot, key, data[key])
    return {"message": "Slot updated"}
