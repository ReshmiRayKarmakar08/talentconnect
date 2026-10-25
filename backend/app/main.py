import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import init_db
from app.api.routes import auth, users, skills, sessions, tasks, payments, ai, admin, health
from app.services.health_service import run_keep_alive_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database schema & sample seeds
    await init_db()

    # Layer 1: Start background keep-alive worker to periodically ping Supabase & Render
    keep_alive_task = None
    if settings.ENABLE_KEEP_ALIVE:
        keep_alive_task = asyncio.create_task(run_keep_alive_worker())

    yield

    # Shutdown: cleanly cancel keep-alive worker
    if keep_alive_task and not keep_alive_task.done():
        keep_alive_task.cancel()
        try:
            await keep_alive_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="TalentConnect API",
    description="Intelligent Student Collaboration & Academic Support Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

allowed_origins = {
    "http://localhost:5173",
    "http://localhost:5177",
    "https://talentconnect-web.vercel.app",
    "https://talentconnect-gamma.vercel.app",
    settings.FRONTEND_URL,
}

# ─── MIDDLEWARE ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origin for origin in allowed_origins if origin),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ROUTES ──────────────────────────────────────────────────
app.include_router(health.router, prefix="/api")
app.include_router(health.router)  # Also expose /health, /health/db, /health/ping at root level
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "status": "ok",
        "service": "TalentConnect API",
        "docs": "/api/docs",
        "health_overall": "/api/health",
        "health_server_only": "/api/health/server",
        "health_database_only": "/api/health/db",
    }
