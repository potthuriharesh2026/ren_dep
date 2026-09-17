from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Profile, FarmerProfile
from app.models.crop import Crop
from app.models.seed import Seed, SeedWarehouse, SeedPurchase
from app.models.grain import GrainSale
from app.models.warehouse import Warehouse, WarehouseSlot, WarehouseInventory
from app.models.booking import BookingSlot
from app.models.transaction import Transaction
from app.models.visit import FarmVisit
from app.models.notification import Notification
from app.models.market import MarketRate
from app.models.bank import BankChangeRequest


async def get_profile(db: AsyncSession, user_id: int) -> dict:
    # Try profiles table first
    profile_result = await db.execute(select(Profile).where(Profile.app_user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    # If no profile row exists, fall back to the users table
    user_data = None
    if profile:
        user_data = {k: v for k, v in profile.__dict__.items() if not k.startswith("_")}
    else:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user_data = {
                "id": user.id, "name": user.name, "email": user.email,
                "phone": user.phone, "role": user.role, "status": user.status,
                "first_login": user.first_login,
            }

    fp_result = await db.execute(select(FarmerProfile).where(FarmerProfile.user_id == user_id))
    fp = fp_result.scalar_one_or_none()

    return {
        "user": user_data,
        "profile": {k: v for k, v in fp.__dict__.items() if not k.startswith("_")} if fp else None,
    }


async def update_profile(db: AsyncSession, user_id: int, data: dict) -> None:
    name = data.get("name")
    email = data.get("email")

    if name or email:
        await db.execute(
            text("UPDATE profiles SET name = COALESCE(:name, name), email = COALESCE(:email, email), updated_at = now() WHERE app_user_id = :uid"),
            {"name": name, "email": email, "uid": user_id},
        )
        await db.execute(
            text("UPDATE users SET name = COALESCE(:name, name), email = COALESCE(:email, email), updated_at = now() WHERE id = :uid"),
            {"name": name, "email": email, "uid": user_id},
        )

    fp_fields = {k: v for k, v in data.items() if k not in ("name", "email") and v is not None}
    if fp_fields:
        set_clause = ", ".join(f"{k} = :{k}" for k in fp_fields)
        fp_fields["uid"] = user_id
        fp_fields["now"] = datetime.now(timezone.utc)
        await db.execute(text(f"UPDATE farmer_profiles SET {set_clause}, updated_at = :now WHERE user_id = :uid"), fp_fields)


async def request_bank_change(db: AsyncSession, farmer_id: int, bank_name: str | None, account_number: str | None, ifsc_code: str | None, upi_id: str | None) -> int:
    bcr = BankChangeRequest(farmer_id=farmer_id, bank_name=bank_name, account_number=account_number, ifsc_code=ifsc_code, upi_id=upi_id)
    db.add(bcr)
    await db.flush()

    await db.execute(text("UPDATE farmer_profiles SET bank_status = 'pending' WHERE user_id = :uid"), {"uid": farmer_id})

    admins_result = await db.execute(select(User.id).where(User.role.in_(["admin", "manager", "super_admin"])))
    admin_ids = [r[0] for r in admins_result.all()]

    farmer_result = await db.execute(select(User.name).where(User.id == farmer_id))
    farmer_name = farmer_result.scalar_one_or_none() or "A farmer"

    for aid in admin_ids:
        db.add(Notification(user_id=aid, title="Bank Change Request", message=f"{farmer_name} has requested to change their bank details.", type="info", reference_type="bank_request", reference_id=bcr.id))

    return bcr.id


async def get_dashboard(db: AsyncSession, farmer_id: int) -> dict:
    """Build farmer dashboard data from direct queries instead of a stored procedure."""
    from sqlalchemy import func as sqla_func

    # Get user info
    user_result = await db.execute(select(User).where(User.id == farmer_id))
    user = user_result.scalar_one_or_none()

    # Get farmer profile
    fp_result = await db.execute(select(FarmerProfile).where(FarmerProfile.user_id == farmer_id))
    fp = fp_result.scalar_one_or_none()

    # Count crops
    crops_result = await db.execute(
        select(sqla_func.count(Crop.id)).where(Crop.farmer_id == farmer_id)
    )
    total_crops = crops_result.scalar() or 0

    # Count bookings by status
    bookings_result = await db.execute(
        select(BookingSlot.status, sqla_func.count(BookingSlot.id))
        .where(BookingSlot.farmer_id == farmer_id)
        .group_by(BookingSlot.status)
    )
    bookings_by_status = dict(bookings_result.all())
    total_bookings = sum(bookings_by_status.values())
    pending_bookings = bookings_by_status.get("pending", 0)
    confirmed_bookings = bookings_by_status.get("confirmed", 0)

    # Count grain sales by status
    grain_result = await db.execute(
        select(GrainSale.status, sqla_func.count(GrainSale.id))
        .where(GrainSale.farmer_id == farmer_id)
        .group_by(GrainSale.status)
    )
    grain_by_status = dict(grain_result.all())
    total_grain_sales = sum(grain_by_status.values())
    pending_grain_sales = grain_by_status.get("pending", 0)

    # Sum transactions
    tx_result = await db.execute(
        select(sqla_func.coalesce(sqla_func.sum(Transaction.amount), 0))
        .where(Transaction.farmer_id == farmer_id, Transaction.status == "completed")
    )
    total_earnings = float(tx_result.scalar() or 0)

    # Count unread notifications
    notif_result = await db.execute(
        select(sqla_func.count(Notification.id))
        .where(Notification.user_id == farmer_id, Notification.is_read == False)
    )
    unread_notifications = notif_result.scalar() or 0

    return {
        "farmer_name": user.name if user else "",
        "status": user.status if user else "",
        "acres_of_land": float(fp.acres_of_land) if fp else 0,
        "total_crops": total_crops,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_grain_sales": total_grain_sales,
        "pending_grain_sales": pending_grain_sales,
        "total_earnings": total_earnings,
        "unread_notifications": unread_notifications,
    }


async def get_crops(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(select(Crop).where(Crop.farmer_id == farmer_id).order_by(Crop.created_at.desc()))
    return [{k: v for k, v in c.__dict__.items() if not k.startswith("_")} for c in result.scalars().all()]


async def register_crop(db: AsyncSession, farmer_id: int, crop_type: str, acres: float, sowing_date: str | None = None, notes: str | None = None, harvest_date: str | None = None) -> int:
    from datetime import date as dt_date

    # Parse sowing_date
    parsed_sowing_date = dt_date.today()
    if sowing_date:
        try:
            parsed_sowing_date = dt_date.fromisoformat(str(sowing_date)[:10])
        except (ValueError, TypeError):
            parsed_sowing_date = dt_date.today()

    parsed_harvest_date = None
    if harvest_date:
        try:
            parsed_harvest_date = dt_date.fromisoformat(str(harvest_date)[:10])
        except (ValueError, TypeError):
            parsed_harvest_date = None

    crop = Crop(
        farmer_id=farmer_id,
        crop_type=crop_type or "General Crop",
        acres=float(acres or 1.0),
        sowing_date=parsed_sowing_date,
        harvest_date=parsed_harvest_date,
        notes=notes,
    )
    db.add(crop)
    await db.flush()
    return crop.id


async def get_seeds(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Seed, SeedWarehouse, Warehouse)
        .join(SeedWarehouse, Seed.id == SeedWarehouse.seed_id, isouter=True)
        .join(Warehouse, SeedWarehouse.warehouse_id == Warehouse.id, isouter=True)
        .where(Seed.is_active == True, Seed.stock_kg > 0)
        .order_by(Seed.name)
    )
    rows = result.all()

    seed_map: dict[int, dict] = {}
    for seed, sw, wh in rows:
        if seed.id not in seed_map:
            seed_map[seed.id] = {**{k: v for k, v in seed.__dict__.items() if not k.startswith("_")}, "warehouses": []}
        if wh:
            seed_map[seed.id]["warehouses"].append({"id": wh.id, "name": wh.name, "address": wh.address})
    return list(seed_map.values())


async def purchase_seeds(db: AsyncSession, farmer_id: int, seed_id: int | str | None = None, quantity_kg: float = 0, payment_method: str | None = None, upi_id: str | None = None, transaction_id: str | None = None, warehouse_id: int | None = None, pickup_date: str | None = None, seed_name: str | None = None) -> dict:
    from datetime import date as dt_date
    from sqlalchemy import or_

    seed = None
    # 1. Look up by integer ID
    if seed_id is not None:
        try:
            numeric_id = int(seed_id)
            result = await db.execute(select(Seed).where(Seed.id == numeric_id))
            seed = result.scalar_one_or_none()
        except (ValueError, TypeError):
            pass

    # 2. Look up by name or variety if not found by ID
    query_name = seed_name or (str(seed_id) if isinstance(seed_id, str) and not str(seed_id).isdigit() else None)
    if not seed and query_name:
        clean_name = query_name.strip()
        # Try exact or partial match
        result = await db.execute(
            select(Seed).where(
                or_(
                    Seed.name.ilike(f"%{clean_name}%"),
                    Seed.variety.ilike(f"%{clean_name}%")
                ),
                Seed.is_active == True,
            )
        )
        seed = result.scalars().first()
        
        # If words in query (like "IR64 Paddy"), try matching each word
        if not seed:
            for word in clean_name.split():
                if len(word) >= 2:
                    result = await db.execute(
                        select(Seed).where(
                            or_(
                                Seed.name.ilike(f"%{word}%"),
                                Seed.variety.ilike(f"%{word}%")
                            ),
                            Seed.is_active == True,
                        )
                    )
                    seed = result.scalars().first()
                    if seed:
                        break

    # 3. If still not found, fallback to first active seed in stock
    if not seed:
        result = await db.execute(select(Seed).where(Seed.is_active == True, Seed.stock_kg > 0).order_by(Seed.id.asc()))
        seed = result.scalars().first()

    if not seed:
        raise ValueError("No active seeds found in the inventory")

    effective_qty = float(quantity_kg or 1.0)
    if float(seed.stock_kg or 0) < effective_qty:
        raise ValueError(f"Insufficient stock for {seed.name}. Only {seed.stock_kg}kg available.")

    seed.stock_kg = float(seed.stock_kg) - effective_qty
    total_amount = float(seed.price_per_kg) * effective_qty
    target_warehouse_id = warehouse_id or seed.warehouse_id or 1

    parsed_pickup = dt_date.today()
    if pickup_date:
        try:
            parsed_pickup = dt_date.fromisoformat(str(pickup_date)[:10])
        except (ValueError, TypeError):
            parsed_pickup = dt_date.today()

    payment_status = "paid" if payment_method == "upi" and transaction_id else "pending"
    inv_num = f"INV-SEED-{int(datetime.now(timezone.utc).timestamp())}-{farmer_id}"

    purchase = SeedPurchase(
        farmer_id=farmer_id,
        seed_id=seed.id,
        warehouse_id=target_warehouse_id,
        quantity_kg=effective_qty,
        price_per_kg=float(seed.price_per_kg),
        total_amount=total_amount,
        payment_status=payment_status,
        invoice_number=inv_num,
        pickup_date=parsed_pickup,
    )
    db.add(purchase)
    await db.flush()

    # Record transaction
    tx = Transaction(
        farmer_id=farmer_id,
        reference_type="seed_purchase",
        reference_id=purchase.id,
        amount=total_amount,
        direction="debit",
        status="completed" if payment_status == "paid" else "pending",
        description=f"Purchase of {effective_qty}kg {seed.name}",
        upi_id=upi_id,
        transaction_id=transaction_id,
        invoice_number=inv_num,
    )
    db.add(tx)

    db.add(Notification(
        user_id=farmer_id,
        title="Seed Purchase Placed",
        message=f"You ordered {effective_qty}kg of {seed.name} ({seed.variety or ''}). Total: ₹{total_amount}.",
        type="success",
    ))

    return {
        "id": purchase.id,
        "seed_id": seed.id,
        "seed_name": seed.name,
        "quantity_kg": effective_qty,
        "price_per_kg": float(seed.price_per_kg),
        "total_amount": total_amount,
        "payment_status": purchase.payment_status,
        "message": f"Successfully purchased {effective_qty}kg of {seed.name}",
    }


async def get_seed_purchases(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(
        select(SeedPurchase, Seed.name.label("seed_name"), Seed.variety.label("seed_variety"))
        .join(Seed, SeedPurchase.seed_id == Seed.id)
        .where(SeedPurchase.farmer_id == farmer_id)
        .order_by(SeedPurchase.created_at.desc())
    )
    return [
        {**{k: v for k, v in sp.__dict__.items() if not k.startswith("_")}, "seed_name": sn, "seed_variety": sv}
        for sp, sn, sv in result.all()
    ]


async def submit_grain_sale(db: AsyncSession, farmer_id: int, grain_type: str, quantity_kg: float, warehouse_id: int | None) -> int:
    sale = GrainSale(
        farmer_id=farmer_id,
        grain_type=grain_type or "Paddy",
        grade="A",
        raw_material_kg=quantity_kg,
        good_material_kg=0,
        wastage_kg=0,
        price_per_kg=0,
        total_amount=0,
        status="pending",
    )
    db.add(sale)
    await db.flush()

    db.add(BookingSlot(
        farmer_id=farmer_id,
        grain_sale_id=sale.id,
        booking_date="TBD",
        delivery_address="TBD",
        grain_type=grain_type or "Paddy",
        warehouse_id=warehouse_id or 1,
        quantity_kg=quantity_kg,
        status="pending",
        procurement_status="pending_procurement",
    ))

    return sale.id


async def get_grain_sales(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(select(GrainSale).where(GrainSale.farmer_id == farmer_id).order_by(GrainSale.created_at.desc()))
    return [{k: v for k, v in g.__dict__.items() if not k.startswith("_")} for g in result.scalars().all()]


async def get_warehouses(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Warehouse, WarehouseInventory).join(WarehouseInventory, Warehouse.id == WarehouseInventory.warehouse_id, isouter=True).where(Warehouse.is_active == True).order_by(Warehouse.name))
    rows = result.all()

    wh_map: dict[int, dict] = {}
    for wh, inv in rows:
        if wh.id not in wh_map:
            wh_map[wh.id] = {**{k: v for k, v in wh.__dict__.items() if not k.startswith("_")}, "available_kg": float(wh.total_capacity_kg) - float(wh.current_load_kg), "inventory": []}
        if inv:
            wh_map[wh.id]["inventory"].append({k: v for k, v in inv.__dict__.items() if not k.startswith("_")})
    return list(wh_map.values())


async def get_warehouse_slots(db: AsyncSession, warehouse_id: int, date: str) -> list[dict]:
    from datetime import date as dt_date
    try:
        parsed_date = dt_date.fromisoformat(str(date)[:10])
    except (ValueError, TypeError):
        parsed_date = dt_date.today()

    result = await db.execute(
        select(WarehouseSlot).where(WarehouseSlot.warehouse_id == warehouse_id, WarehouseSlot.slot_date == parsed_date, WarehouseSlot.status == "active").order_by(WarehouseSlot.start_time)
    )
    return [{k: v for k, v in s.__dict__.items() if not k.startswith("_")} for s in result.scalars().all()]


async def book_delivery_slot(db: AsyncSession, farmer_id: int, booking_date: str, delivery_address: str, grain_type: str, warehouse_id: int | None, quantity_kg: float, warehouse_slot_id: int | None) -> int:
    slot = BookingSlot(
        farmer_id=farmer_id,
        booking_date=booking_date,
        delivery_address=delivery_address or "Farm Location",
        grain_type=grain_type,
        warehouse_id=warehouse_id or 1,
        quantity_kg=quantity_kg,
        warehouse_slot_id=warehouse_slot_id,
        status="pending",
        procurement_status="pending_procurement",
    )
    db.add(slot)
    await db.flush()

    if warehouse_slot_id:
        ws_res = await db.execute(select(WarehouseSlot).where(WarehouseSlot.id == warehouse_slot_id))
        ws = ws_res.scalar_one_or_none()
        if ws:
            ws.booked_capacity_kg = float(ws.booked_capacity_kg or 0) + float(quantity_kg)

    db.add(Notification(
        user_id=farmer_id,
        title="Delivery Slot Booked",
        message=f"Booking for {quantity_kg}kg of {grain_type} on {booking_date} submitted. Awaiting confirmation.",
        type="info",
    ))

    return slot.id


async def get_booking_slots(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(
        select(BookingSlot, Warehouse, WarehouseSlot)
        .join(Warehouse, BookingSlot.warehouse_id == Warehouse.id, isouter=True)
        .join(WarehouseSlot, BookingSlot.warehouse_slot_id == WarehouseSlot.id, isouter=True)
        .where(BookingSlot.farmer_id == farmer_id)
        .order_by(BookingSlot.booking_date.desc())
    )
    return [
        {
            **{k: v for k, v in bs.__dict__.items() if not k.startswith("_")},
            "warehouse_name": wh.name if wh else None,
            "warehouse_address": wh.address if wh else None,
            "start_time": ws.start_time if ws else None,
            "end_time": ws.end_time if ws else None,
        }
        for bs, wh, ws in result.all()
    ]


async def get_transactions(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(select(Transaction).where(Transaction.farmer_id == farmer_id).order_by(Transaction.created_at.desc()))
    return [{k: v for k, v in t.__dict__.items() if not k.startswith("_")} for t in result.scalars().all()]


async def get_visits(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(
        select(FarmVisit, Crop.crop_type)
        .join(Crop, FarmVisit.crop_id == Crop.id, isouter=True)
        .where(FarmVisit.farmer_id == farmer_id)
        .order_by(FarmVisit.created_at.desc())
    )
    return [
        {
            **{k: v for k, v in fv.__dict__.items() if not k.startswith("_")},
            "crop_type": ct,
            "notes": fv.report or "",
            "recommendations": fv.report or "",
        }
        for fv, ct in result.all()
    ]


async def get_notifications(db: AsyncSession, farmer_id: int) -> list[dict]:
    result = await db.execute(select(Notification).where(Notification.user_id == farmer_id).order_by(Notification.created_at.desc()).limit(50))
    return [{k: v for k, v in n.__dict__.items() if not k.startswith("_")} for n in result.scalars().all()]


async def mark_all_notifications_read(db: AsyncSession, farmer_id: int) -> None:
    await db.execute(text("UPDATE notifications SET is_read = true WHERE user_id = :uid"), {"uid": farmer_id})


async def mark_notification_read(db: AsyncSession, farmer_id: int, notif_id: int) -> None:
    await db.execute(text("UPDATE notifications SET is_read = true WHERE id = :nid AND user_id = :uid"), {"nid": notif_id, "uid": farmer_id})


async def get_market_rates(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(MarketRate).order_by(MarketRate.crop_type, MarketRate.grade))
    return [{k: v for k, v in m.__dict__.items() if not k.startswith("_")} for m in result.scalars().all()]
