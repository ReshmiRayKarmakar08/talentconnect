import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import AsyncSessionLocal

logger = logging.getLogger("talentconnect.health")


async def check_database_health(db: Optional[AsyncSession] = None) -> Dict[str, Any]:
    """
    Executes a lightweight query (SELECT 1) to verify database connectivity
    and ensure activity is registered on Supabase so it does not pause.
    """
    start_time = time.perf_counter()
    try:
        if db is not None:
            result = await db.execute(text("SELECT 1"))
            val = result.scalar()
        else:
            async with AsyncSessionLocal() as session:
                result = await session.execute(text("SELECT 1"))
                val = result.scalar()

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        if val == 1:
            return {
                "status": "connected",
                "latency_ms": latency_ms,
                "message": "Database is active and responding.",
            }
        return {
            "status": "unexpected_result",
            "latency_ms": latency_ms,
            "message": f"Unexpected response from database query: {val}",
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"Database health check failed ({latency_ms}ms): {exc}")
        return {
            "status": "unreachable",
            "latency_ms": latency_ms,
            "error": str(exc),
            "message": "Database connection failed. If using Supabase, check whether the project is paused.",
        }


async def get_system_health(db: Optional[AsyncSession] = None) -> Dict[str, Any]:
    """
    Returns unified health report covering both Render API and Supabase database.
    """
    db_health = await check_database_health(db)
    is_healthy = db_health.get("status") == "connected"

    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_health,
        "keep_alive": {
            "enabled": settings.ENABLE_KEEP_ALIVE,
            "interval_minutes": settings.KEEP_ALIVE_INTERVAL_MINUTES,
        },
    }


async def run_keep_alive_worker():
    """
    Background worker that runs every N minutes to:
    1. Send a query to Supabase (keeps Supabase from pausing due to inactivity).
    2. Self-ping Render web service URL (keeps Render instance warm).
    """
    interval_seconds = max(settings.KEEP_ALIVE_INTERVAL_MINUTES, 1) * 60
    logger.info(
        f"[Keep-Alive] Worker started. Running every {settings.KEEP_ALIVE_INTERVAL_MINUTES} minutes ({interval_seconds}s)."
    )

    # Initial delay to let the app fully initialize
    await asyncio.sleep(15)

    while True:
        try:
            # 1. Ping Supabase Database
            db_res = await check_database_health()
            if db_res.get("status") == "connected":
                logger.info(
                    f"[Keep-Alive] Supabase DB keep-alive ping successful (latency: {db_res.get('latency_ms')}ms)"
                )
            else:
                logger.warning(
                    f"[Keep-Alive] Supabase DB keep-alive ping failed: {db_res.get('message')} - {db_res.get('error')}"
                )

            # 2. Self-ping Render URL
            target_base_url = settings.RENDER_EXTERNAL_URL or settings.BACKEND_URL
            if target_base_url:
                clean_url = target_base_url.rstrip("/")
                ping_endpoint = f"{clean_url}/api/health"
                try:
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        resp = await client.get(ping_endpoint)
                        logger.info(
                            f"[Keep-Alive] Self-ping to Render ({ping_endpoint}) returned HTTP {resp.status_code}"
                        )
                except Exception as net_err:
                    logger.warning(f"[Keep-Alive] Self-ping to Render failed: {net_err}")

        except asyncio.CancelledError:
            logger.info("[Keep-Alive] Worker task was cancelled during shutdown.")
            break
        except Exception as loop_err:
            logger.error(f"[Keep-Alive] Unexpected error in keep-alive worker: {loop_err}")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            break
