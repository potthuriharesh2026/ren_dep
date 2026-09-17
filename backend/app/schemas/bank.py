from datetime import datetime
from pydantic import BaseModel


class BankChangeRequestInput(BaseModel):
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    upi_id: str | None = None


class ReviewBankRequestInput(BaseModel):
    status: str
    notes: str | None = None
