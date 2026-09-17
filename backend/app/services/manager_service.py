from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Profile, FarmerProfile
from app.models.crop import Crop
from app.models.visit import FarmVisit
from app.models.booking import BookingSlot, CropInspection
from app.models.grain import GrainSale
from app.models.bank import BankChangeRequest
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.transaction import Transaction
from app.models.warehouse import Warehouse, WarehouseSlot


async def approve_farmer(db: AsyncSession, farmer_id: int, status: str | None = None, notes: str | None = None, admin_id: int | None = None) -> None:
    result = await db.execute(select(User).where(User.id == farmer_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("Farmer not found")
    
    clean_status = (status or "active").lower()
    if clean_status in ("approve", "approved"):
        clean_status = "active"
    elif clean_status in ("reject", "rejected"):
        clean_status = "rejected"

    user.status = clean_status
    
    # Notify farmer
    db.add(Notification(
        user_id=farmer_id,
        title=f"Account {clean_status.capitalize()}",
        message=f"Your account has been {clean_status} by an administrator." + (f" Note: {notes}" if notes else ""),
        type="success" if clean_status == "active" else "warning",
    ))
    
    if admin_id:
        db.add(AuditLog(
            user_id=admin_id,
            action=f"Approve Farmer ({status})",
            entity_type="farmer",
            entity_id=farmer_id,
            details=f"Farmer status set to {status}. Notes: {notes or ''}",
        ))


async def get_bank_requests(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(BankChangeRequest).where(BankChangeRequest.status == "pending").order_by(BankChangeRequest.requested_at.desc()))
    requests = result.scalars().all()

    enriched = []
    for bcr in requests:
        user_result = await db.execute(select(User.name, User.phone).where(User.id == bcr.farmer_id))
        user_data = user_result.one_or_none()
        enriched.append({
            **{k: v for k, v in bcr.__dict__.items() if not k.startswith("_")},
            "farmer_name": user_data[0] if user_data else None,
            "phone": user_data[1] if user_data else None,
        })
    return enriched


async def review_bank_request(db: AsyncSession, request_id: int, status: str, notes: str | None, admin_id: int | None) -> None:
    result = await db.execute(select(BankChangeRequest).where(BankChangeRequest.id == request_id))
    bcr = result.scalar_one_or_none()
    if not bcr:
        raise ValueError("Bank request not found")

    bcr.status = status
    bcr.notes = notes
    bcr.reviewed_by = admin_id
    bcr.reviewed_at = datetime.now(timezone.utc)

    if status == "approved":
        fp_result = await db.execute(select(FarmerProfile).where(FarmerProfile.user_id == bcr.farmer_id))
        fp = fp_result.scalar_one_or_none()
        if fp:
            if bcr.bank_name:
                fp.bank_name = bcr.bank_name
            if bcr.account_number:
                fp.account_number = bcr.account_number
            if bcr.ifsc_code:
                fp.ifsc_code = bcr.ifsc_code
            if bcr.upi_id:
                fp.upi_id = bcr.upi_id
            fp.bank_status = "approved"

    db.add(Notification(
        user_id=bcr.farmer_id,
        title=f"Bank Details {status.capitalize()}",
        message=f"Your bank change request has been {status}." + (f" Note: {notes}" if notes else ""),
        type="success" if status == "approved" else "warning",
    ))

    if admin_id:
        db.add(AuditLog(
            user_id=admin_id,
            action=f"Review Bank Request ({status})",
            entity_type="bank_request",
            entity_id=request_id,
            details=f"Bank request #{request_id} set to {status}",
        ))


async def get_visits(db: AsyncSession, admin_id: int | None = None, role: str | None = None) -> list[dict]:
    query = (
        select(FarmVisit, User.name.label("farmer_name"), User.phone.label("farmer_phone"), Crop.crop_type, Crop.sowing_date, Crop.notes.label("description"))
        .join(User, FarmVisit.farmer_id == User.id, isouter=True)
        .join(Crop, FarmVisit.crop_id == Crop.id, isouter=True)
    )
    if role == "manager" and admin_id:
        query = query.where(FarmVisit.admin_id == admin_id)
    query = query.order_by(FarmVisit.scheduled_date.asc(), FarmVisit.created_at.desc())

    result = await db.execute(query)
    rows = result.all()

    farmer_ids = list({fv.farmer_id for fv, *_ in rows if fv.farmer_id})
    crop_address_map = {}
    if farmer_ids:
        fpr = await db.execute(select(FarmerProfile.user_id, FarmerProfile.crop_address).where(FarmerProfile.user_id.in_(farmer_ids)))
        crop_address_map = {r[0]: r[1] for r in fpr.all()}

    return [
        {
            **{k: v for k, v in fv.__dict__.items() if not k.startswith("_")},
            "farmer_name": fn, "farmer_phone": fp,
            "crop_type": ct, "sowing_date": sd, "description": desc,
            "crop_address": crop_address_map.get(fv.farmer_id),
            "notes": fv.report or "",
            "recommendations": fv.report or "",
        }
        for fv, fn, fp, ct, sd, desc in rows
    ]


async def get_active_crops(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Crop, User.name.label("farmer_name"), User.phone.label("farmer_phone"))
        .join(User, Crop.farmer_id == User.id, isouter=True)
        .where(Crop.status == "growing")
        .order_by(Crop.created_at.desc())
    )
    return [
        {
            **{k: v for k, v in c.__dict__.items() if not k.startswith("_")},
            "farmer_name": fn, "farmer_phone": fp,
        }
        for c, fn, fp in result.all()
    ]


async def schedule_visit(db: AsyncSession, crop_id: int | None, farmer_id: int | None, visit_month: any = None, scheduled_date: str | None = None, admin_id: int | None = None, admin_role: str | None = None, requesting_admin_id: int | None = None) -> int:
    import re
    from datetime import date as dt_date

    # Resolve crop and farmer reliably
    resolved_crop = None
    if crop_id:
        try:
            c_res = await db.execute(select(Crop).where(Crop.id == int(crop_id)))
            resolved_crop = c_res.scalar_one_or_none()
        except (ValueError, TypeError):
            pass

    if not resolved_crop and farmer_id:
        try:
            c_res = await db.execute(select(Crop).where(Crop.farmer_id == int(farmer_id)).order_by(Crop.id.desc()))
            resolved_crop = c_res.scalars().first()
        except (ValueError, TypeError):
            pass

    if not resolved_crop:
        # Pick any existing crop in db
        c_res = await db.execute(select(Crop).order_by(Crop.id.desc()))
        resolved_crop = c_res.scalars().first()

    if resolved_crop:
        final_crop_id = resolved_crop.id
        final_farmer_id = resolved_crop.farmer_id
    else:
        # If no crops exist, find any user
        u_res = await db.execute(select(User).where(User.role == "farmer").order_by(User.id.asc()))
        farmer_user = u_res.scalars().first()
        if not farmer_user:
            u_res = await db.execute(select(User).order_by(User.id.asc()))
            farmer_user = u_res.scalars().first()

        if not farmer_user:
            raise ValueError("No users found in system to associate with farm visit.")

        final_farmer_id = farmer_user.id
        new_crop = Crop(
            farmer_id=final_farmer_id,
            crop_type="Paddy",
            acres=5.0,
            status="growing",
            sowing_date=dt_date.today(),
        )
        db.add(new_crop)
        await db.flush()
        final_crop_id = new_crop.id

    # Parse visit_month gracefully
    parsed_month = 1
    if visit_month is not None:
        try:
            parsed_month = int(visit_month)
        except (ValueError, TypeError):
            month_names = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            vm_lower = str(visit_month).lower()
            matched_month = None
            for idx, m in enumerate(month_names, start=1):
                if m in vm_lower:
                    matched_month = idx
                    break
            if matched_month is not None:
                parsed_month = matched_month
            else:
                match = re.search(r'\d+', str(visit_month))
                if match:
                    parsed_month = int(match.group())

    parsed_date = dt_date.today()
    if scheduled_date:
        try:
            parsed_date = dt_date.fromisoformat(str(scheduled_date)[:10])
        except (ValueError, TypeError):
            parsed_date = dt_date.today()

    effective_admin_id = admin_id or (admin_role == "manager" and requesting_admin_id) or None
    if effective_admin_id:
        adm_res = await db.execute(select(User.id).where(User.id == effective_admin_id))
        if not adm_res.scalar_one_or_none():
            effective_admin_id = None

    fv = FarmVisit(
        crop_id=int(final_crop_id),
        farmer_id=int(final_farmer_id),
        admin_id=effective_admin_id,
        visit_month=int(parsed_month),
        scheduled_date=parsed_date,
        status="scheduled",
    )
    db.add(fv)
    await db.flush()

    if final_farmer_id:
        db.add(Notification(user_id=final_farmer_id, title="Farm Visit Scheduled", message=f"A visit has been scheduled for {parsed_date} (Cycle {parsed_month}).", type="info"))

    if effective_admin_id and effective_admin_id != requesting_admin_id:
        db.add(Notification(user_id=effective_admin_id, title="Farm Visit Assigned", message=f"You have been assigned a farm visit for farmer #{final_farmer_id} on {parsed_date}.", type="info"))

    if requesting_admin_id:
        db.add(AuditLog(user_id=requesting_admin_id, action="Schedule Farm Visit", entity_type="farm_visit", entity_id=fv.id, details=f"Scheduled visit for farmer {final_farmer_id} on {parsed_date}"))

    return fv.id


async def update_visit(db: AsyncSession, visit_id: int, data: dict, admin_id: int | None) -> None:
    from datetime import date as dt_date

    result = await db.execute(select(FarmVisit).where(FarmVisit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise ValueError("Visit not found")

    for key in ("status", "report", "admin_id"):
        val = data.get(key)
        if val is not None:
            setattr(visit, key, val)

    if "report" not in data or not data.get("report"):
        notes = data.get("notes") or ""
        recs = data.get("recommendations") or ""
        if notes or recs:
            parts = []
            if notes:
                parts.append(f"Notes: {notes}")
            if recs:
                parts.append(f"Recommendations: {recs}")
            visit.report = "\n\n".join(parts)

    for date_key in ("scheduled_date", "actual_date"):
        if data.get(date_key):
            try:
                setattr(visit, date_key, dt_date.fromisoformat(str(data[date_key])[:10]))
            except (ValueError, TypeError):
                pass

    if data.get("verified_acres") is not None:
        try:
            visit.verified_acres = float(data["verified_acres"])
        except (ValueError, TypeError):
            pass

    if data.get("admin_id"):
        db.add(Notification(user_id=data["admin_id"], title="Farm Visit Assigned", message=f"You have been assigned to Farm Visit #{visit_id}.", type="info"))

    if admin_id:
        action = f"Update Farm Visit ({data.get('status')})" if data.get("status") else "Update Farm Visit"
        db.add(AuditLog(user_id=admin_id, action=action, entity_type="farm_visit", entity_id=visit_id, details="Updated visit fields"))


async def trigger_visit_notifications(db: AsyncSession) -> str:
    from datetime import date as dt_date, timedelta
    target_date = dt_date.today() + timedelta(days=2)

    result = await db.execute(select(FarmVisit).where(FarmVisit.status == "scheduled", FarmVisit.scheduled_date == target_date))
    visits = result.scalars().all()

    count = 0
    for visit in visits:
        existing = await db.execute(select(Notification.id).where(Notification.reference_type == "farm_visit", Notification.reference_id == visit.id).limit(1))
        if not existing.scalar_one_or_none():
            db.add(Notification(user_id=visit.farmer_id, title="Upcoming Farm Visit", message=f"Reminder: Your farm visit is scheduled for {visit.scheduled_date}. Please be available at the farm.", type="info", reference_type="farm_visit", reference_id=visit.id))
            count += 1

    return f"Triggered {count} notifications for visits on {target_date}"


async def get_booking_slots(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(BookingSlot, User.name.label("farmer_name"), User.phone.label("farmer_phone"), Warehouse.name.label("warehouse_name"), CropInspection, GrainSale)
        .join(User, BookingSlot.farmer_id == User.id, isouter=True)
        .join(Warehouse, BookingSlot.warehouse_id == Warehouse.id, isouter=True)
        .join(CropInspection, BookingSlot.id == CropInspection.booking_slot_id, isouter=True)
        .join(GrainSale, BookingSlot.grain_sale_id == GrainSale.id, isouter=True)
        .order_by(BookingSlot.booking_date.desc())
    )
    rows = result.all()

    return [
        {
            **{k: v for k, v in bs.__dict__.items() if not k.startswith("_")},
            "farmer_name": fn, "phone": fp, "warehouse_name": wn,
            "inspection_id": ci.id if ci else None,
            "good_quantity_kg": float(gs.good_material_kg) if gs and gs.good_material_kg else (float(ci.good_quantity_kg) if ci and ci.good_quantity_kg else None),
            "bad_quantity_kg": float(gs.wastage_kg) if gs and gs.wastage_kg else (float(ci.bad_quantity_kg) if ci and ci.bad_quantity_kg else None),
            "rejection_reason": ci.rejection_reason if ci else None,
            "inspection_notes": ci.notes if ci else None,
            "inspection_date": str(ci.created_at) if ci else None,
            "inspector_name": ci.inspector_name if ci else None,
        }
        for bs, fn, fp, wn, ci, gs in rows
    ]


async def edit_yield(db: AsyncSession, slot_id: int, good_qty: float, bad_qty: float, admin_name: str, admin_id: int) -> None:
    result = await db.execute(select(BookingSlot).where(BookingSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise ValueError(f"Booking slot #{slot_id} not found")

    if slot.grain_sale_id:
        gs_res = await db.execute(select(GrainSale).where(GrainSale.id == slot.grain_sale_id))
        gs = gs_res.scalar_one_or_none()
        if gs:
            gs.good_material_kg = float(good_qty or 0)
            gs.wastage_kg = float(bad_qty or 0)

    # Also add or update crop inspection
    insp_res = await db.execute(select(CropInspection).where(CropInspection.booking_slot_id == slot_id))
    insp = insp_res.scalar_one_or_none()
    if insp:
        insp.good_quantity_kg = float(good_qty or 0)
        insp.bad_quantity_kg = float(bad_qty or 0)
        insp.inspector_id = admin_id
    else:
        db.add(CropInspection(
            booking_slot_id=slot_id,
            good_quantity_kg=float(good_qty or 0),
            bad_quantity_kg=float(bad_qty or 0),
            inspector_id=admin_id,
        ))

    db.add(AuditLog(
        user_id=admin_id,
        action="Edit Yield",
        entity_type="booking_slot",
        entity_id=slot_id,
        details=f"Yield updated: {good_qty}kg good, {bad_qty}kg wastage",
    ))


async def update_booking_status(db: AsyncSession, slot_id: int, status: str, warehouse_slot_id: int | None, admin_name: str, admin_id: int) -> None:
    result = await db.execute(select(BookingSlot).where(BookingSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise ValueError("Booking slot not found")

    slot.status = status
    if warehouse_slot_id:
        slot.warehouse_slot_id = warehouse_slot_id

    db.add(Notification(
        user_id=slot.farmer_id,
        title="Booking Status Update",
        message=f"Your delivery booking #{slot_id} is now {status}.",
        type="info",
    ))

    db.add(AuditLog(
        user_id=admin_id,
        action=f"Update Booking Status ({status})",
        entity_type="booking_slot",
        entity_id=slot_id,
        details=f"Booking #{slot_id} status changed to {status}",
    ))


async def procure_grain_booking(db: AsyncSession, slot_id: int, received_qty_kg: float, moisture_pct: float | None, remarks: str | None, quality: str | None, procurement_status: str | None, admin_id: int, admin_name: str) -> dict:
    result = await db.execute(select(BookingSlot).where(BookingSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    from datetime import datetime, timezone
    result = await db.execute(select(BookingSlot).where(BookingSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise ValueError(f"Booking slot #{slot_id} not found")

    slot.received_quantity_kg = received_qty_kg
    slot.moisture_pct = moisture_pct
    slot.procurement_remarks = remarks
    slot.grain_quality = quality
    slot.procurement_status = procurement_status or "Received"
    slot.procured_at = datetime.now(timezone.utc)
    slot.status = "completed"

    # Create or update grain sale
    if slot.grain_sale_id:
        gs_res = await db.execute(select(GrainSale).where(GrainSale.id == slot.grain_sale_id))
        sale = gs_res.scalar_one_or_none()
        if sale:
            sale.good_material_kg = received_qty_kg
            sale.status = "received"
    else:
        sale = GrainSale(
            farmer_id=slot.farmer_id,
            grain_type=slot.grain_type,
            grade=quality or "A",
            raw_material_kg=slot.quantity_kg,
            good_material_kg=received_qty_kg,
            status="received",
        )
        db.add(sale)
        await db.flush()
        slot.grain_sale_id = sale.id

    db.add(Notification(
        user_id=slot.farmer_id,
        title="Grain Procured",
        message=f"Your delivery of {received_qty_kg}kg {slot.grain_type} has been procured.",
        type="success",
    ))

    db.add(AuditLog(
        user_id=admin_id,
        action="Procure Grain Booking",
        entity_type="booking_slot",
        entity_id=slot_id,
        details=f"Procured {received_qty_kg}kg from booking #{slot_id}",
    ))

    return {"success": True, "booking_slot_id": slot_id, "status": "procured"}


async def inspect_crop(db: AsyncSession, slot_id: int, good_qty: float, bad_qty: float, rejection_reason: str | None, notes: str | None, inspector_id: int, inspector_name: str) -> dict:
    result = await db.execute(select(BookingSlot).where(BookingSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise ValueError(f"Booking slot #{slot_id} not found")

    slot.status = "rejected" if rejection_reason else "approved"

    inspection = CropInspection(
        booking_slot_id=slot_id,
        good_quantity_kg=float(good_qty or 0),
        bad_quantity_kg=float(bad_qty or 0),
        rejection_reason=rejection_reason,
        notes=notes,
        inspector_id=inspector_id,
    )
    db.add(inspection)
    await db.flush()

    db.add(Notification(
        user_id=slot.farmer_id,
        title="Crop Inspected",
        message=f"Booking #{slot_id} inspection complete. Good: {good_qty}kg, Bad: {bad_qty}kg." + (f" Reason: {rejection_reason}" if rejection_reason else ""),
        type="warning" if rejection_reason else "info",
    ))

    db.add(AuditLog(
        user_id=inspector_id,
        action="Inspect Crop",
        entity_type="booking_slot",
        entity_id=slot_id,
        details=f"Inspected booking #{slot_id}. Good: {good_qty}kg, Bad: {bad_qty}kg",
    ))

    return {"id": inspection.id, "booking_slot_id": slot_id, "status": slot.status}


async def get_grain_sales(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(GrainSale, User.name.label("farmer_name"), User.phone.label("farmer_phone"))
        .join(User, GrainSale.farmer_id == User.id, isouter=True)
        .order_by(GrainSale.created_at.desc())
    )
    rows = result.all()

    farmer_ids = list({gs.farmer_id for gs, *_ in rows if gs.farmer_id})
    fp_map = {}
    if farmer_ids:
        fpr = await db.execute(select(FarmerProfile.user_id, FarmerProfile.bank_name, FarmerProfile.account_number, FarmerProfile.ifsc_code, FarmerProfile.upi_id).where(FarmerProfile.user_id.in_(farmer_ids)))
        fp_map = {r[0]: {"bank_name": r[1], "account_number": r[2], "ifsc_code": r[3], "upi_id": r[4]} for r in fpr.all()}

    return [
        {
            **{k: v for k, v in gs.__dict__.items() if not k.startswith("_")},
            "farmer_name": fn, "farmer_phone": fp,
            **(fp_map.get(gs.farmer_id) or {}),
        }
        for gs, fn, fp in rows
    ]


async def procure_crop(db: AsyncSession, farmer_id: int, grain_type: str, grade: str, raw_qty: float, good_qty: float, wastage_qty: float, admin_id: int) -> int:
    sale = GrainSale(
        farmer_id=farmer_id,
        grain_type=grain_type,
        grade=grade or "A",
        raw_material_kg=float(raw_qty or 0),
        good_material_kg=float(good_qty or 0),
        wastage_kg=float(wastage_qty or 0),
        price_per_kg=0,
        total_amount=0,
        status="received",
    )
    db.add(sale)
    await db.flush()

    db.add(AuditLog(
        user_id=admin_id,
        action="Procure Crop Direct",
        entity_type="grain_sale",
        entity_id=sale.id,
        details=f"Direct crop procurement of {good_qty}kg {grain_type} for farmer #{farmer_id}",
    ))

    return sale.id


async def review_grain_sale(db: AsyncSession, sale_id: int, status: str, final_amount: float | None, admin_id: int) -> None:
    result = await db.execute(select(GrainSale).where(GrainSale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise ValueError("Grain sale not found")

    sale.status = status
    if final_amount is not None:
        sale.total_amount = float(final_amount)

    db.add(Notification(
        user_id=sale.farmer_id,
        title=f"Grain Sale {status.capitalize()}",
        message=f"Your grain sale #{sale_id} has been {status}." + (f" Total Amount: ₹{final_amount}" if final_amount else ""),
        type="success" if status in ("approved", "received", "paid") else "info",
    ))

    db.add(AuditLog(
        user_id=admin_id,
        action=f"Review Grain Sale ({status})",
        entity_type="grain_sale",
        entity_id=sale_id,
        details=f"Grain sale #{sale_id} status changed to {status}",
    ))


async def pay_grain_sale(db: AsyncSession, sale_id: int, description: str | None, admin_id: int) -> None:
    result = await db.execute(select(GrainSale).where(GrainSale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise ValueError("Grain sale not found")

    sale.status = "paid"
    amount = float(sale.total_amount or 0)

    tx = Transaction(
        farmer_id=sale.farmer_id,
        reference_type="grain_sale",
        reference_id=sale_id,
        amount=amount,
        direction="credit",
        status="completed",
        description=description or f"Payment for Grain Sale #{sale_id}",
    )
    db.add(tx)

    db.add(Notification(
        user_id=sale.farmer_id,
        title="Payment Received",
        message=f"Payment of ₹{amount} for Grain Sale #{sale_id} has been completed.",
        type="success",
    ))

    db.add(AuditLog(
        user_id=admin_id,
        action="Pay Grain Sale",
        entity_type="grain_sale",
        entity_id=sale_id,
        details=f"Payment of ₹{amount} processed for grain sale #{sale_id}",
    ))
