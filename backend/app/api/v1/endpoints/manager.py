from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.user import User
from app.schemas.user import ApproveFarmerRequest
from app.schemas.bank import ReviewBankRequestInput
from app.schemas.visit import ScheduleVisitRequest, UpdateVisitRequest
from app.schemas.booking import EditYieldRequest, UpdateBookingStatusRequest, ProcureGrainRequest, InspectCropRequest
from app.schemas.grain import ProcureCropRequest, ReviewGrainSaleRequest, PayGrainSaleRequest
from app.services import manager_service

router = APIRouter(prefix="/manager", tags=["manager"])


@router.post("/farmers/{farmer_id}/approve")
async def approve_farmer(farmer_id: int, data: ApproveFarmerRequest = None, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    data = data or ApproveFarmerRequest()
    try:
        status = data.status or "active"
        await manager_service.approve_farmer(db, farmer_id, status, data.notes, user.id)
        return {"message": f"Farmer account {status}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/bank-requests")
async def get_bank_requests(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await manager_service.get_bank_requests(db)


@router.put("/bank-requests/{request_id}")
async def review_bank_request(request_id: int, data: ReviewBankRequestInput, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    try:
        await manager_service.review_bank_request(db, request_id, data.status, data.notes, user.id)
        return {"message": f"Bank request {data.status}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/visits")
async def get_visits(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await manager_service.get_visits(db, user.id, user.role)


@router.get("/crops/active")
async def get_active_crops(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await manager_service.get_active_crops(db)


@router.post("/visits")
async def schedule_visit(data: ScheduleVisitRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        visit_id = await manager_service.schedule_visit(
            db, data.crop_id, data.farmer_id, data.visit_month,
            data.scheduled_date, data.admin_id, user.role, user.id,
        )
        return {"id": visit_id, "message": "Visit scheduled"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/visits/{visit_id}")
async def update_visit(visit_id: int, data: UpdateVisitRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await manager_service.update_visit(db, visit_id, data.model_dump(exclude_unset=True), user.id)
        return {"message": "Visit updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/visits/notifications")
async def trigger_visit_notifications(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    msg = await manager_service.trigger_visit_notifications(db)
    return {"message": msg}


@router.get("/bookings")
async def get_booking_slots(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await manager_service.get_booking_slots(db)


@router.put("/bookings/{slot_id}/yield")
async def edit_yield(slot_id: int, data: EditYieldRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await manager_service.edit_yield(db, slot_id, data.good_qty, data.bad_qty, user.name or "admin", user.id)
        return {"message": "Yield updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/bookings/{slot_id}/status")
async def update_booking_status(slot_id: int, data: UpdateBookingStatusRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await manager_service.update_booking_status(
            db, slot_id, data.status, data.warehouse_slot_id,
            user.name or "admin", user.id,
        )
        return {"message": f"Slot {data.status}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bookings/procure")
async def procure_grain_booking(data: ProcureGrainRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        return await manager_service.procure_grain_booking(
            db, data.slot_id, data.received_qty_kg,
            data.moisture_pct, data.remarks, data.quality,
            data.procurement_status, user.id, user.name or "admin",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bookings/{slot_id}/inspect")
async def inspect_crop(slot_id: int, data: InspectCropRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        return await manager_service.inspect_crop(
            db, slot_id, data.good_qty, data.bad_qty,
            data.rejection_reason, data.notes, user.id, user.name or "admin",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/grain-sales")
async def get_grain_sales(user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    return await manager_service.get_grain_sales(db)


@router.post("/grain-sales/procure")
async def procure_crop(data: ProcureCropRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        sale_id = await manager_service.procure_crop(
            db, data.farmer_id, data.grain_type, data.grade,
            data.raw_material_kg, data.good_material_kg,
            data.wastage_kg, user.id,
        )
        return {"message": "Crop procured successfully", "id": sale_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/grain-sales/{sale_id}/review")
async def review_grain_sale(sale_id: int, data: ReviewGrainSaleRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await manager_service.review_grain_sale(db, sale_id, data.status, data.final_amount, user.id)
        return {"message": f"Sale {data.status}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/grain-sales/{sale_id}/pay")
async def pay_grain_sale(sale_id: int, data: PayGrainSaleRequest, user: User = Depends(require_role(["admin", "super_admin", "manager"])), db: AsyncSession = Depends(get_db)):
    try:
        await manager_service.pay_grain_sale(db, sale_id, data.description, user.id)
        return {"message": "Farmer paid successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
