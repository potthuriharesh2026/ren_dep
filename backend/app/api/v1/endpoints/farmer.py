from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.user import User
from app.schemas.user import UpdateFarmerProfileRequest
from app.schemas.bank import BankChangeRequestInput
from app.schemas.crop import RegisterCropRequest
from app.schemas.seed import PurchaseSeedRequest
from app.schemas.grain import SubmitGrainSaleRequest
from app.schemas.booking import CreateBookingRequest
from app.services import farmer_service

router = APIRouter(prefix="/farmer", tags=["farmer"])


@router.get("/profile")
async def get_profile(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_profile(db, user.id)


@router.put("/profile")
async def update_profile(data: UpdateFarmerProfileRequest, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    await farmer_service.update_profile(db, user.id, data.model_dump(exclude_unset=True))
    return {"message": "Profile updated"}


@router.post("/bank-change")
async def request_bank_change(data: BankChangeRequestInput, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    try:
        bcr_id = await farmer_service.request_bank_change(db, user.id, data.bank_name, data.account_number, data.ifsc_code, data.upi_id)
        return {"message": "Bank change request submitted for admin approval", "id": bcr_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/dashboard")
async def get_dashboard(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_dashboard(db, user.id)


@router.get("/crops")
async def get_crops(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_crops(db, user.id)


@router.post("/crops")
async def register_crop(data: RegisterCropRequest, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    crop_type = data.crop_type or data.crop_name or "General Crop"
    acres = data.acres or data.acreage or 1.0
    sowing_date = data.sowing_date or data.planting_date
    harvest_date = data.harvest_date or data.expected_harvest_date
    notes = data.notes or (f"Seed: {data.seed_name}" if data.seed_name else None)
    
    crop_id = await farmer_service.register_crop(
        db, user.id, crop_type=crop_type, acres=float(acres),
        sowing_date=sowing_date, notes=notes, harvest_date=harvest_date,
    )
    return {"id": crop_id, "message": "Crop registered"}


@router.get("/seeds")
async def get_seeds(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_seeds(db)


@router.post("/seeds/purchase")
async def purchase_seeds(data: PurchaseSeedRequest, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    try:
        seed_id = data.seed_id
        seed_name = data.seed_name or data.name
        quantity = data.quantity_kg or data.quantity or data.qty or 1.0
        
        return await farmer_service.purchase_seeds(
            db,
            farmer_id=user.id,
            seed_id=seed_id,
            quantity_kg=float(quantity),
            payment_method=data.payment_method,
            upi_id=data.upi_id,
            transaction_id=data.transaction_id,
            warehouse_id=data.warehouse_id,
            pickup_date=data.pickup_date,
            seed_name=seed_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/seed-purchases")
async def get_seed_purchases(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_seed_purchases(db, user.id)


@router.post("/grain-sales")
async def submit_grain_sale(data: SubmitGrainSaleRequest, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    grain_type = data.grain_type or data.crop_type or data.grain_name or "Paddy"
    quantity = data.quantity_kg or data.quantity or data.raw_material_kg or 100.0
    warehouse_id = data.warehouse_id or 1
    
    sale_id = await farmer_service.submit_grain_sale(
        db, user.id, grain_type=grain_type, quantity_kg=float(quantity), warehouse_id=int(warehouse_id)
    )
    return {"id": sale_id, "message": "Grain sale request submitted"}


@router.get("/grain-sales")
async def get_grain_sales(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_grain_sales(db, user.id)


@router.get("/warehouses")
async def get_warehouses(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_warehouses(db)


@router.get("/warehouses/{warehouse_id}/slots")
async def get_warehouse_slots(warehouse_id: int, date: str, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_warehouse_slots(db, warehouse_id, date)


@router.post("/bookings")
async def book_delivery_slot(data: CreateBookingRequest, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    try:
        slot_id = await farmer_service.book_delivery_slot(
            db, user.id, data.booking_date, data.delivery_address or "TBD",
            data.grain_type, data.warehouse_id, data.quantity_kg or 0,
            data.warehouse_slot_id,
        )
        return {"id": slot_id, "message": "Booking slot created. Awaiting confirmation."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/bookings")
async def get_booking_slots(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_booking_slots(db, user.id)


@router.get("/transactions")
async def get_transactions(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_transactions(db, user.id)


@router.get("/visits")
async def get_visits(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_visits(db, user.id)


@router.get("/notifications")
async def get_notifications(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    return await farmer_service.get_notifications(db, user.id)


@router.put("/notifications/read-all")
async def mark_all_read(user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    await farmer_service.mark_all_notifications_read(db, user.id)
    return {"message": "All notifications marked as read"}


@router.put("/notifications/{notif_id}/read")
async def mark_read(notif_id: int, user: User = Depends(require_role(["farmer"])), db: AsyncSession = Depends(get_db)):
    await farmer_service.mark_notification_read(db, user.id, notif_id)
    return {"message": "Notification marked as read"}
