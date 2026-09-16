from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User

router = APIRouter(prefix="/api/ledger", tags=["ledger"])


@router.get("/")
async def get_transactions(user: User = Depends(require_role(["admin", "super_admin", "farmer"])), db: AsyncSession = Depends(get_db)):
    if user.role == "farmer":
        result = await db.execute(select(Transaction).where(Transaction.farmer_id == user.id).order_by(Transaction.created_at.desc()))
    else:
        result = await db.execute(select(Transaction).order_by(Transaction.created_at.desc()))
    return [{k: v for k, v in t.__dict__.items() if not k.startswith("_")} for t in result.scalars().all()]


@router.post("/")
async def create_transaction(data: dict, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    tx = Transaction(
        farmer_id=data.get("farmer_id"), amount=data.get("amount", 0),
        direction=data.get("direction"), description=data.get("description"),
        reference_type=data.get("reference_type", "other"), reference_id=data.get("reference_id"),
    )
    db.add(tx)
    await db.flush()
    return {"id": tx.id, "message": "Transaction created"}


@router.put("/{tx_id}")
async def update_transaction(tx_id: int, data: dict, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for key in ("amount", "direction", "status", "description"):
        if key in data and data[key] is not None:
            setattr(tx, key, data[key])
    return {"message": "Transaction updated"}


@router.put("/{tx_id}/process")
async def process_payment(tx_id: int, user: User = Depends(require_role(["admin", "super_admin"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.status = "completed"
    return {"message": "Payment processed"}
