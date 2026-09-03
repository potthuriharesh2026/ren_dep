import json
from datetime import datetime, date, time
from decimal import Decimal
from uuid import UUID

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    auth, admin, farmer, manager, public,
    crops, market, warehouse, ledger, notifications, storage,
)


class CustomJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles datetime, date, time, uuid, and Decimal objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, time):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)


class CustomJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(content, cls=CustomJSONEncoder, ensure_ascii=False).encode("utf-8")


app = FastAPI(
    title="AgriFlow Backend API",
    description="FastAPI backend replacing Supabase Edge Functions",
    version="1.0.0",
    default_response_class=CustomJSONResponse,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(farmer.router)
app.include_router(manager.router)
app.include_router(public.router)
app.include_router(crops.router)
app.include_router(market.router)
app.include_router(warehouse.router)
app.include_router(ledger.router)
app.include_router(notifications.router)
app.include_router(storage.router)


@app.get("/")
async def root():
    return {"message": "AgriFlow API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
