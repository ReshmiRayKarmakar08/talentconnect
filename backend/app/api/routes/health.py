from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.session import get_db
from app.services.health_service import check_database_health, get_system_health, get_server_health

router = APIRouter(tags=["Health"])


@router.api_route("/health", methods=["GET", "HEAD"])
async def health_check(response: Response, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    1. Overall Health Check (Render Server + Supabase DB)
    Verifies both FastAPI on Render and PostgreSQL on Supabase (via SELECT 1).
    Accepts both GET and HEAD (used by UptimeRobot).
    """
    report = await get_system_health(db)
    if report.get("status") != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return report


@router.api_route("/health/server", methods=["GET", "HEAD"])
async def server_health() -> Dict[str, Any]:
    """
    2. Render Server Only Health Check (No DB query)
    Fast, lightweight ping that keeps Render container awake 24/7 without touching the database.
    Accepts both GET and HEAD (used by UptimeRobot).
    """
    return get_server_health()


@router.api_route("/health/db", methods=["GET", "HEAD"])
async def database_health(response: Response, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    3. Dedicated database health check endpoint.
    Directly executes a query against Supabase to ensure the project remains active.
    Accepts both GET and HEAD (used by UptimeRobot).
    """
    db_res = await check_database_health(db)
    if db_res.get("status") != "connected":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "service": "talentconnect-db",
        "database": db_res,
    }


@router.api_route("/health/ping", methods=["GET", "HEAD"])
async def ping() -> Dict[str, str]:
    """
    Fastest ping endpoint for basic uptime checks.
    Accepts both GET and HEAD (used by UptimeRobot).
    """
    return {"status": "ok", "message": "pong"}
