from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.session import get_db
from app.services.health_service import check_database_health, get_system_health

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(response: Response, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Main health check endpoint.
    Verifies both FastAPI on Render and PostgreSQL on Supabase (via SELECT 1).
    External monitors (Cron-job.org, UptimeRobot, etc.) should point to this URL.
    """
    report = await get_system_health(db)
    if report.get("status") != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return report


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
