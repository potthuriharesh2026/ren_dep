from datetime import datetime, timezone

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import hash_password
from app.models.user import User, Profile, FarmerProfile, Manager
from app.models.crop import Crop
from app.models.transaction import Transaction
from app.models.visit import FarmVisit
from app.models.grain import GrainSale
from app.models.seed import Seed, SeedWarehouse, SeedPurchase
from app.models.warehouse import Warehouse
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.booking import BookingSlot, CropInspection


import uuid
from sqlalchemy import func as sqla_func

async def get_dashboard(db: AsyncSession) -> dict:
    from app.models.bank import BankChangeRequest

    total_farmers = (await db.execute(select(sqla_func.count(User.id)).where(User.role == "farmer"))).scalar() or 0
    active_farmers = (await db.execute(select(sqla_func.count(User.id)).where(User.role == "farmer", User.status == "active"))).scalar() or 0
    pending_farmers = (await db.execute(select(sqla_func.count(User.id)).where(User.role == "farmer", User.status == "pending"))).scalar() or 0
    total_managers = (await db.execute(select(sqla_func.count(User.id)).where(User.role == "manager"))).scalar() or 0
    total_warehouses = (await db.execute(select(sqla_func.count(Warehouse.id)))).scalar() or 0
    total_crops = (await db.execute(select(sqla_func.count(Crop.id)))).scalar() or 0
    
    total_bookings = (await db.execute(select(sqla_func.count(BookingSlot.id)))).scalar() or 0
    pending_bookings = (await db.execute(select(sqla_func.count(BookingSlot.id)).where(BookingSlot.status == "pending"))).scalar() or 0
    
    total_grain_sales = (await db.execute(select(sqla_func.count(GrainSale.id)))).scalar() or 0
    pending_grain_sales = (await db.execute(select(sqla_func.count(GrainSale.id)).where(GrainSale.status == "pending"))).scalar() or 0
    
    pending_bank_requests = (await db.execute(select(sqla_func.count(BankChangeRequest.id)).where(BankChangeRequest.status == "pending"))).scalar() or 0
    total_seeds = (await db.execute(select(sqla_func.count(Seed.id)))).scalar() or 0
    
    tx_sum = (await db.execute(select(sqla_func.coalesce(sqla_func.sum(Transaction.amount), 0)).where(Transaction.status == "completed"))).scalar() or 0

    return {
        "total_farmers": total_farmers,
        "active_farmers": active_farmers,
        "pending_farmers": pending_farmers,
        "total_managers": total_managers,
        "total_warehouses": total_warehouses,
        "total_crops": total_crops,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "total_grain_sales": total_grain_sales,
        "pending_grain_sales": pending_grain_sales,
        "pending_bank_requests": pending_bank_requests,
        "total_seeds": total_seeds,
        "total_revenue": float(tx_sum),
    }


async def get_farmers(db: AsyncSession, status: str | None = None, search: str | None = None) -> list[dict]:
    query = (
        select(User, FarmerProfile)
        .join(FarmerProfile, User.id == FarmerProfile.user_id, isouter=True)
        .where(User.role == "farmer")
    )
    if status:
        query = query.where(User.status == status)
    if search:
        query = query.where(User.name.ilike(f"%{search}%") | User.phone.ilike(f"%{search}%"))
    query = query.order_by(User.created_at.desc())

    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": u.id, "profile_id": str(u.uuid) if u.uuid else None, "name": u.name, "email": u.email,
            "phone": u.phone, "status": u.status, "created_at": str(u.created_at) if u.created_at else None,
            "verified_at": str(u.updated_at) if u.updated_at else None,
            "address": fp.address if fp else None,
            "acres_of_land": float(fp.acres_of_land) if fp and fp.acres_of_land else None,
            "crop_address": fp.crop_address if fp else None,
            "bank_status": fp.bank_status if fp else None,
        }
        for u, fp in rows
    ]


async def get_farmer_details(db: AsyncSession, farmer_id: int) -> dict:
    user_result = await db.execute(
        select(User).options(selectinload(User.farmer_profile)).where(User.id == farmer_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("Farmer not found")

    crops_result = await db.execute(select(Crop).where(Crop.farmer_id == farmer_id).order_by(Crop.created_at.desc()))
    crops = [{k: v for k, v in c.__dict__.items() if not k.startswith("_")} for c in crops_result.scalars().all()]

    tx_result = await db.execute(select(Transaction).where(Transaction.farmer_id == farmer_id).order_by(Transaction.created_at.desc()))
    transactions = [{k: v for k, v in t.__dict__.items() if not k.startswith("_")} for t in tx_result.scalars().all()]

    visits_result = await db.execute(select(FarmVisit).where(FarmVisit.farmer_id == farmer_id).order_by(FarmVisit.created_at.desc()))
    visits = [{k: v for k, v in v.__dict__.items() if not k.startswith("_")} for v in visits_result.scalars().all()]

    gs_result = await db.execute(select(GrainSale).where(GrainSale.farmer_id == farmer_id).order_by(GrainSale.created_at.desc()))
    grain_sales = [{k: v for k, v in g.__dict__.items() if not k.startswith("_")} for g in gs_result.scalars().all()]

    fp = user.farmer_profile
    farmer_data = {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "status": user.status,
        "address": fp.address if fp else None,
        "acres_of_land": float(fp.acres_of_land) if fp and fp.acres_of_land else None,
        "crop_address": fp.crop_address if fp else None,
        "bank_name": fp.bank_name if fp else None,
        "account_number": fp.account_number if fp else None,
        "ifsc_code": fp.ifsc_code if fp else None,
        "upi_id": fp.upi_id if fp else None,
        "bank_status": fp.bank_status if fp else None,
    }

    return {"farmer": farmer_data, "crops": crops, "transactions": transactions, "visits": visits, "grain_sales": grain_sales}


async def delete_farmer(db: AsyncSession, farmer_id: int, admin_id: int | None, admin_name: str | None) -> None:
    await db.execute(delete(Notification).where(Notification.user_id == farmer_id))
    await db.execute(delete(AuditLog).where(AuditLog.user_id == farmer_id))
    await db.execute(delete(Transaction).where(Transaction.farmer_id == farmer_id))

    slots_result = await db.execute(select(BookingSlot.id).where(BookingSlot.farmer_id == farmer_id))
    slot_ids = [r[0] for r in slots_result.all()]
    if slot_ids:
        await db.execute(delete(CropInspection).where(CropInspection.booking_slot_id.in_(slot_ids)))

    await db.execute(delete(BookingSlot).where(BookingSlot.farmer_id == farmer_id))
    await db.execute(delete(GrainSale).where(GrainSale.farmer_id == farmer_id))
    await db.execute(delete(SeedPurchase).where(SeedPurchase.farmer_id == farmer_id))
    await db.execute(delete(FarmVisit).where(FarmVisit.farmer_id == farmer_id))
    await db.execute(delete(Crop).where(Crop.farmer_id == farmer_id))
    await db.execute(delete(FarmerProfile).where(FarmerProfile.user_id == farmer_id))
    await db.execute(delete(User).where(User.id == farmer_id))

    if admin_id:
        db.add(AuditLog(user_id=admin_id, action="Delete Farmer", entity_type="farmer", entity_id=farmer_id, details=f"Deleted farmer #{farmer_id}"))


async def get_managers(db: AsyncSession) -> list[dict]:
    query = (
        select(User, Manager)
        .join(Manager, User.id == Manager.user_id, isouter=True)
        .where(User.role == "manager")
        .order_by(User.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": u.id, "name": u.name, "email": u.email, "phone": u.phone,
            "status": u.status, "created_at": str(u.created_at) if u.created_at else None,
            "department": m.department if m else None,
        }
        for u, m in rows
    ]


async def create_manager(db: AsyncSession, name: str, email: str, phone: str, password: str, department: str | None) -> dict:
    existing = await db.execute(select(User).where(User.phone == phone))
    if existing.scalar_one_or_none():
        raise ValueError("Phone number already registered")

    user_uuid = uuid.uuid4()
    user = User(name=name, email=email, phone=phone, password_hash=hash_password(password), role="manager", status="active", uuid=user_uuid)
    db.add(user)
    await db.flush()

    manager = Manager(user_id=user.id, department=department)
    db.add(manager)

    return {"id": user.id, "name": user.name, "email": user.email, "phone": user.phone, "department": department}


async def update_manager_status(db: AsyncSession, manager_id: int, status: str, admin_id: int | None) -> None:
    result = await db.execute(select(User).where(User.id == manager_id, User.role == "manager"))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("Manager not found")
    user.status = status

    if admin_id:
        db.add(AuditLog(user_id=admin_id, action=f"{'Activate' if status == 'active' else 'Deactivate'} Manager", entity_type="manager", entity_id=manager_id, details=f"Manager status changed to {status}"))


async def update_manager(db: AsyncSession, manager_id: int, name: str | None, email: str | None, phone: str | None, status: str | None, admin_id: int | None) -> None:
    result = await db.execute(select(User).where(User.id == manager_id, User.role == "manager"))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("Manager not found")
    if name:
        user.name = name
    if email:
        user.email = email
    if phone:
        user.phone = phone
    if status:
        user.status = status

    if admin_id:
        db.add(AuditLog(user_id=admin_id, action="Edit Manager", entity_type="manager", entity_id=manager_id, details=f"Manager #{manager_id} details updated"))


async def get_audit_logs(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200))
    logs = result.scalars().all()

    user_ids = list({al.user_id for al in logs if al.user_id})
    user_map = {}
    if user_ids:
        ur = await db.execute(select(User.id, User.name, User.role).where(User.id.in_(user_ids)))
        user_map = {u[0]: {"name": u[1], "role": u[2]} for u in ur.all()}

    return [
        {**{k: v for k, v in al.__dict__.items() if not k.startswith("_")}, "name": user_map.get(al.user_id, {}).get("name"), "role": user_map.get(al.user_id, {}).get("role")}
        for al in logs
    ]


async def get_reports_monthly(db: AsyncSession, month: str | None = None) -> dict:
    result = await db.execute(
        select(User.id, User.name, User.phone)
        .where(User.role == "farmer", User.status == "active")
    )
    farmers = result.all()

    formatted = []
    for app_user_id, name, phone in farmers:
        crops_result = await db.execute(select(sqla_func.count(Crop.id)).where(Crop.farmer_id == app_user_id))
        crops_count = crops_result.scalar() or 0

        sp_result = await db.execute(select(sqla_func.count(SeedPurchase.id)).where(SeedPurchase.farmer_id == app_user_id))
        sp_count = sp_result.scalar() or 0

        tx_result = await db.execute(select(sqla_func.coalesce(sqla_func.sum(Transaction.amount), 0)).where(Transaction.farmer_id == app_user_id, Transaction.status == "completed"))
        total_earned = float(tx_result.scalar() or 0)

        formatted.append({
            "id": app_user_id, "name": name, "phone": phone,
            "total_crops": crops_count, "seed_purchases": sp_count, "total_earned": total_earned,
        })

    return {"month": month, "farmers": formatted}


async def get_seeds(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Seed, SeedWarehouse, Warehouse)
        .join(SeedWarehouse, Seed.id == SeedWarehouse.seed_id, isouter=True)
        .join(Warehouse, SeedWarehouse.warehouse_id == Warehouse.id, isouter=True)
        .order_by(Seed.name)
    )
    rows = result.all()

    seed_map: dict[int, dict] = {}
    for seed, sw, wh in rows:
        if seed.id not in seed_map:
            seed_map[seed.id] = {
                **{k: v for k, v in seed.__dict__.items() if not k.startswith("_")},
                "warehouses": [],
            }
        if wh:
            seed_map[seed.id]["warehouses"].append({"id": wh.id, "name": wh.name, "address": wh.address})

    return list(seed_map.values())


async def create_seed(db: AsyncSession, name: str, variety: str | None, price_per_kg: float, stock_kg: float, description: str | None, image_url: str | None, is_active: bool, warehouse_ids: list[int] | None) -> int:
    seed = Seed(name=name, variety=variety, price_per_kg=price_per_kg, stock_kg=stock_kg, on_hold_kg=0, description=description, image_url=image_url, is_active=is_active)
    db.add(seed)
    await db.flush()

    if warehouse_ids:
        for wid in warehouse_ids:
            db.add(SeedWarehouse(seed_id=seed.id, warehouse_id=wid))

    return seed.id


async def update_seed(db: AsyncSession, seed_id: int, name: str | None, variety: str | None, price_per_kg: float | None, stock_kg: float | None, description: str | None, image_url: str | None, is_active: bool | None, warehouse_ids: list[int] | None, caller_role: str | None = None) -> None:
    result = await db.execute(select(Seed).where(Seed.id == seed_id))
    seed = result.scalar_one_or_none()
    if not seed:
        raise ValueError("Seed not found")

    if name is not None:
        seed.name = name
    if variety is not None:
        seed.variety = variety
    if price_per_kg is not None and caller_role in ("super_admin", "admin"):
        seed.price_per_kg = price_per_kg
    if stock_kg is not None:
        seed.stock_kg = stock_kg
    if description is not None:
        seed.description = description
    if image_url is not None:
        seed.image_url = image_url
    if is_active is not None:
        seed.is_active = is_active

    if warehouse_ids is not None:
        await db.execute(delete(SeedWarehouse).where(SeedWarehouse.seed_id == seed_id))
        for wid in warehouse_ids:
            db.add(SeedWarehouse(seed_id=seed_id, warehouse_id=wid))


async def delete_seed(db: AsyncSession, seed_id: int) -> None:
    await db.execute(delete(SeedWarehouse).where(SeedWarehouse.seed_id == seed_id))
    result = await db.execute(delete(Seed).where(Seed.id == seed_id))
    if result.rowcount == 0:
        raise ValueError("Seed not found or has existing purchases")


async def get_seed_purchases(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(SeedPurchase, Seed.name.label("seed_name"), Seed.variety.label("seed_variety"))
        .join(Seed, SeedPurchase.seed_id == Seed.id)
        .order_by(SeedPurchase.created_at.desc())
    )
    rows = result.all()

    farmer_ids = list({sp.farmer_id for sp, _, _ in rows if sp.farmer_id})
    user_map = {}
    if farmer_ids:
        ur = await db.execute(select(User.id, User.name, User.phone).where(User.id.in_(farmer_ids)))
        user_map = {u[0]: {"name": u[1], "phone": u[2]} for u in ur.all()}

    return [
        {
            **{k: v for k, v in sp.__dict__.items() if not k.startswith("_")},
            "seed_name": sn, "seed_variety": sv,
            "farmer_name": user_map.get(sp.farmer_id, {}).get("name"),
            "farmer_phone": user_map.get(sp.farmer_id, {}).get("phone"),
        }
        for sp, sn, sv in rows
    ]


async def update_seed_purchase_status(db: AsyncSession, purchase_id: int, status: str, admin_id: int | None) -> None:
    result = await db.execute(select(SeedPurchase).where(SeedPurchase.id == purchase_id))
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise ValueError("Purchase not found")

    purchase.payment_status = status

    if admin_id:
        db.add(AuditLog(user_id=admin_id, action=f"Seed Purchase {'Approved' if status == 'paid' else 'Rejected' if status == 'failed' else 'Updated'}", entity_type="seed_purchase", entity_id=purchase_id, details=f"Payment status changed to {status}"))

    if purchase.farmer_id and status in ("paid", "failed"):
        db.add(Notification(
            user_id=purchase.farmer_id,
            title="Seed Purchase Approved" if status == "paid" else "Seed Purchase Rejected",
            message="Your seed purchase has been approved." if status == "paid" else "Your seed purchase payment could not be confirmed. Please contact the warehouse.",
            type="success" if status == "paid" else "error",
        ))


async def get_warehouses(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Warehouse).order_by(Warehouse.name))
    warehouses = result.scalars().all()
    return [
        {**{k: v for k, v in w.__dict__.items() if not k.startswith("_")}, "id": w.id}
        for w in warehouses
    ]
