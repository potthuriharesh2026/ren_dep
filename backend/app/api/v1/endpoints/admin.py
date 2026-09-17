from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.user import User
from app.schemas.user import CreateManagerRequest, UpdateManagerRequest, UpdateManagerStatusRequest
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def get_dashboard(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_dashboard(db)


@router.get("/farmers")
async def get_farmers(
    status: str | None = None,
    search: str | None = None,
    user: User = Depends(require_role(["admin", "super_admin", "manager"])),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.get_farmers(db, status, search)


@router.get("/farmers/{farmer_id}")
async def get_farmer_details(farmer_id: int, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        return await admin_service.get_farmer_details(db, farmer_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/farmers/{farmer_id}")
async def delete_farmer(farmer_id: int, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    await admin_service.delete_farmer(db, farmer_id, user.id, user.name)
    return {"message": "Farmer deleted"}


@router.get("/managers")
async def get_managers(user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_managers(db)


@router.post("/managers")
async def create_manager(data: CreateManagerRequest, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    try:
        return await admin_service.create_manager(db, data.name, data.email, data.phone, data.password, data.department)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/managers/{manager_id}/status")
async def update_manager_status(manager_id: int, data: UpdateManagerStatusRequest, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    try:
        await admin_service.update_manager_status(db, manager_id, data.status, user.id)
        return {"message": "Manager updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/managers/{manager_id}")
async def update_manager(manager_id: int, data: UpdateManagerRequest, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    try:
        await admin_service.update_manager(db, manager_id, data.name, data.email, data.phone, data.status, user.id)
        return {"message": "Manager updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/audit-logs")
async def get_audit_logs(user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_audit_logs(db)


@router.get("/reports/monthly")
async def get_reports_monthly(month: str | None = None, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_reports_monthly(db, month)


from app.schemas.seed import CreateSeedRequest, UpdateSeedRequest, UpdateSeedPurchaseStatusRequest


@router.get("/seeds")
async def get_seeds(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_seeds(db)


@router.post("/seeds")
async def create_seed(data: CreateSeedRequest, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    seed_id = await admin_service.create_seed(
        db, data.name, data.variety, data.price_per_kg or 0,
        data.stock_kg or 0, data.description, data.image_url,
        data.is_active, data.warehouse_ids,
    )
    return {"id": seed_id, "message": "Seed created"}


@router.put("/seeds/{seed_id}")
async def update_seed(seed_id: int, data: UpdateSeedRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await admin_service.update_seed(
            db, seed_id, data.name, data.variety, data.price_per_kg,
            data.stock_kg, data.description, data.image_url,
            data.is_active, data.warehouse_ids, user.role,
        )
        return {"message": "Seed updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/seeds/{seed_id}")
async def delete_seed(seed_id: int, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    try:
        await admin_service.delete_seed(db, seed_id)
        return {"message": "Seed deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/seed-purchases")
async def get_seed_purchases(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_seed_purchases(db)


@router.put("/seed-purchases/{purchase_id}/status")
async def update_seed_purchase_status(purchase_id: int, data: UpdateSeedPurchaseStatusRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await admin_service.update_seed_purchase_status(db, purchase_id, data.status or "pending", user.id)
        return {"message": "Purchase updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/warehouses")
async def get_warehouses(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await admin_service.get_warehouses(db)
