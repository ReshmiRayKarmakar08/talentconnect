from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.session import get_db
from app.services.health_service import check_database_health, get_system_health, get_server_health

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(response: Response, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    1. Overall Health Check (Render Server + Supabase DB)
    Verifies both FastAPI on Render and PostgreSQL on Supabase (via SELECT 1).
    """
    report = await get_system_health(db)
    if report.get("status") != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return report


@router.get("/health/server")
async def server_health() -> Dict[str, Any]:
    """
    2. Render Server Only Health Check (No DB query)
    Fast, lightweight ping that keeps Render container awake 24/7 without touching the database.
    """
    return get_server_health()


@router.get("/health/db")
async def database_health(response: Response, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Dedicated database health check endpoint.
    Directly executes a query against Supabase to ensure the project remains active.
    """
    db_res = await check_database_health(db)
    if db_res.get("status") != "connected":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "service": "talentconnect-db",
        "database": db_res,
    }


@router.get("/health/ping")
async def ping() -> Dict[str, str]:
    """
    Fastest ping endpoint for basic uptime checks.
    """
    return {"status": "ok", "message": "pong"}
