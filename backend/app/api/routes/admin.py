from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.db.session import get_db
from app.core.security import get_current_admin
from app.schemas.schemas import (
    UserPublic,
    AdminUserAction,
    AdminTaskAction,
    FraudLogOut,
    PlatformStats,
    TaskOut,
    SessionOut,
    SessionFeedbackOut,
    TaskFeedbackOut,
    SkillVerificationAdminOut,
)
from app.services import user_service, task_service, session_service, skill_service
from app.models.models import User, Task, LearningSession, Payment, FraudLog, SessionFeedback, TaskFeedback, SkillVerification, UserSkill
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=PlatformStats)
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar_one()
    total_sessions = (await db.execute(select(func.count(LearningSession.id)))).scalar_one()
    total_tasks = (await db.execute(select(func.count(Task.id)))).scalar_one()
    total_revenue = (await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "paid"))).scalar_one() or 0
    fraud_alerts = (await db.execute(select(func.count(FraudLog.id)).where(FraudLog.is_reviewed == False))).scalar_one()

    return PlatformStats(
        total_users=total_users,
        active_users=active_users,
        total_sessions=total_sessions,
        total_tasks=total_tasks,
        total_revenue=float(total_revenue),
        fraud_alerts=fraud_alerts,
    )


@router.get("/users", response_model=List[UserPublic])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await user_service.get_all_users(db, skip, limit)


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    data: AdminUserAction,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = await user_service.ban_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user.username} banned successfully"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = await user_service.unban_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user.username} unbanned successfully"}


@router.get("/tasks", response_model=List[TaskOut])
async def list_tasks(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await task_service.get_all_tasks(db, skip, limit)


@router.get("/sessions", response_model=List[SessionOut])
async def list_sessions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await session_service.get_all_sessions(db, skip, limit)


@router.get("/session-feedback", response_model=List[SessionFeedbackOut])
async def list_session_feedback(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(SessionFeedback)
        .order_by(SessionFeedback.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.get("/task-feedback", response_model=List[TaskFeedbackOut])
async def list_task_feedback(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(TaskFeedback)
        .order_by(TaskFeedback.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.get("/skill-verifications", response_model=List[SkillVerificationAdminOut])
async def list_skill_verifications(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(SkillVerification)
        .options(
            selectinload(SkillVerification.user_skill).selectinload(UserSkill.user),
            selectinload(SkillVerification.user_skill).selectinload(UserSkill.skill),
        )
        .order_by(SkillVerification.created_at.desc())
        .limit(100)
    )
    verifications = result.scalars().all()
    response = []
    for v in verifications:
        if not v.user_skill or not v.user_skill.user or not v.user_skill.skill:
            continue
        response.append(
            SkillVerificationAdminOut(
                id=v.id,
                user_skill_id=v.user_skill_id,
                score=v.score,
                passed=v.passed,
                attempted_at=v.attempted_at,
                created_at=v.created_at,
                user=v.user_skill.user,
                skill=v.user_skill.skill,
            )
        )
    return response


@router.post("/tasks/{task_id}/flag")
async def flag_task(
    task_id: int,
    data: AdminTaskAction,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    task = await task_service.flag_task(db, task_id, data.reason)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task flagged successfully"}


@router.get("/fraud-logs", response_model=List[FraudLogOut])
async def get_fraud_logs(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(FraudLog).order_by(FraudLog.created_at.desc()).limit(100)
    )
    return result.scalars().all()


@router.post("/fraud-logs/{log_id}/review")
async def review_fraud_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(FraudLog).where(FraudLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    log.is_reviewed = True
    await db.commit()
    return {"message": "Marked as reviewed"}
