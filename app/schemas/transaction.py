from datetime import datetime
from pydantic import BaseModel


class TransactionResponse(BaseModel):
    id: int | None = None
    farmer_id: int | None = None
    amount: float | None = None
    direction: str | None = None
    status: str | None = None
    description: str | None = None
    reference_type: str | None = None
    reference_id: int | None = None
    upi_id: str | None = None
    transaction_id: str | None = None
    invoice_number: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class CreateTransactionRequest(BaseModel):
    farmer_id: int
    amount: float
    direction: str
    description: str | None = None
    reference_type: str = "other"
    reference_id: int | None = None


class UpdateTransactionRequest(BaseModel):
    amount: float | None = None
    direction: str | None = None
    status: str | None = None
    description: str | None = None
