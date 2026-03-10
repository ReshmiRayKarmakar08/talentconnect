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
    AdminTaskOut,
    AdminUserDetailOut,
    AdminRiskUserOut,
    UserProfile,
)
from app.services import user_service, task_service, session_service, skill_service
from app.models.models import User, Task, LearningSession, Payment, FraudLog, SessionFeedback, TaskFeedback, SkillVerification, UserSkill, Skill
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
    total_skills = (await db.execute(select(func.count(Skill.id)))).scalar_one()
    completed_sessions = (await db.execute(select(func.count(LearningSession.id)).where(LearningSession.status == "completed"))).scalar_one()
    total_revenue = (await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "paid"))).scalar_one() or 0
    fraud_alerts = (await db.execute(select(func.count(FraudLog.id)).where(FraudLog.is_reviewed == False))).scalar_one()

    return PlatformStats(
        total_users=total_users,
        active_users=active_users,
        total_sessions=total_sessions,
        total_tasks=total_tasks,
        total_skills=total_skills,
        completed_sessions=completed_sessions,
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


@router.get("/tasks-detailed", response_model=List[AdminTaskOut])
async def list_tasks_detailed(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.poster), selectinload(Task.acceptor), selectinload(Task.payment))
        .order_by(Task.created_at.desc())
        .offset(skip).limit(limit)
    )
    tasks = result.scalars().all()
    detailed = []
    for t in tasks:
        payment = t.payment
        detailed.append(AdminTaskOut(
            id=t.id,
            poster=t.poster,
            acceptor=t.acceptor,
            title=t.title,
            subject=t.subject,
            budget=t.budget,
            status=t.status,
            is_flagged=t.is_flagged,
            created_at=t.created_at,
            payment_status=payment.status if payment else None,
            payment_order_id=payment.razorpay_order_id if payment else None,
            payment_id=payment.razorpay_payment_id if payment else None,
            payment_amount=payment.amount if payment else None,
        ))
    return detailed


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


@router.delete("/tasks/{task_id}/remove")
async def remove_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await task_service.delete_task(db, task_id)
    return {"message": "Task removed successfully"}


@router.get("/fraud-logs", response_model=List[FraudLogOut])
async def get_fraud_logs(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(FraudLog).order_by(FraudLog.created_at.desc()).limit(100)
    )
    return result.scalars().all()


@router.get("/risk-users", response_model=List[AdminRiskUserOut])
async def risk_users(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(User)
        .where((User.cancellation_count >= 3) | (User.fraud_score >= 0.6))
        .order_by(User.fraud_score.desc(), User.cancellation_count.desc())
        .limit(50)
    )
    users = result.scalars().all()
    return [
        AdminRiskUserOut(
            user=u,
            cancellation_count=u.cancellation_count,
            fraud_score=u.fraud_score,
        )
        for u in users
    ]


@router.get("/users/{user_id}/detail", response_model=AdminUserDetailOut)
async def user_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    skills = await skill_service.get_user_skills(db, user_id)

    tasks_posted = (await db.execute(select(func.count(Task.id)).where(Task.poster_id == user_id))).scalar_one()
    tasks_accepted = (await db.execute(select(func.count(Task.id)).where(Task.acceptor_id == user_id))).scalar_one()
    sessions_as_mentor = (await db.execute(select(func.count(LearningSession.id)).where(LearningSession.mentor_id == user_id))).scalar_one()
    sessions_as_learner = (await db.execute(select(func.count(LearningSession.id)).where(LearningSession.learner_id == user_id))).scalar_one()

    avg_session_rating = (await db.execute(
        select(func.avg(SessionFeedback.rating))
        .join(LearningSession, LearningSession.id == SessionFeedback.session_id)
        .where(LearningSession.mentor_id == user_id)
    )).scalar_one()

    avg_task_rating = (await db.execute(
        select(func.avg(TaskFeedback.rating))
        .join(Task, Task.id == TaskFeedback.task_id)
        .where(Task.acceptor_id == user_id)
    )).scalar_one()

    recent_sessions = await session_service.get_user_sessions(db, user_id)
    recent_tasks = await task_service.get_user_tasks(db, user_id)

    user_profile = UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        bio=user.bio,
        college=user.college,
        avatar_url=user.avatar_url,
        role=user.role,
        reputation_score=user.reputation_score,
        is_active=user.is_active,
        created_at=user.created_at,
        cancellation_count=user.cancellation_count,
        fraud_score=user.fraud_score,
    )

    return AdminUserDetailOut(
        user=user_profile,
        skills=skills,
        tasks_posted=tasks_posted,
        tasks_accepted=tasks_accepted,
        sessions_as_mentor=sessions_as_mentor,
        sessions_as_learner=sessions_as_learner,
        avg_session_rating=avg_session_rating,
        avg_task_rating=avg_task_rating,
        recent_sessions=recent_sessions[:5],
        recent_tasks=recent_tasks[:5],
    )


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
