from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    crops,
    farmer,
    ledger,
    manager,
    market,
    notifications,
    public,
    storage,
    warehouse,
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(farmer.router)
api_router.include_router(manager.router)
api_router.include_router(public.router)
api_router.include_router(crops.router)
api_router.include_router(market.router)
api_router.include_router(warehouse.router)
api_router.include_router(ledger.router)
api_router.include_router(notifications.router)
api_router.include_router(storage.router)
