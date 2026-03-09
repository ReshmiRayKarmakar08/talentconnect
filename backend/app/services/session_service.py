from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
import secrets

from app.models.models import LearningSession, SessionFeedback, SessionStatus, FraudLog, User
from app.schemas.schemas import SessionCreate, SessionFeedbackCreate


def _generate_meet_link() -> str:
    code = secrets.token_urlsafe(8)
    return f"https://meet.google.com/{code[:4]}-{code[4:8]}-{code[8:]}"


async def create_session(db: AsyncSession, learner_id: int, data: SessionCreate) -> LearningSession:
    session = LearningSession(
        mentor_id=data.mentor_id,
        learner_id=learner_id,
        skill_id=data.skill_id,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        notes=data.notes,
        meet_link=_generate_meet_link(),
    )
    db.add(session)
    await db.commit()
    return await get_session_by_id(db, session.id)


async def get_session_by_id(db: AsyncSession, session_id: int) -> Optional[LearningSession]:
    result = await db.execute(
        select(LearningSession)
        .where(LearningSession.id == session_id)
        .options(
            selectinload(LearningSession.mentor),
            selectinload(LearningSession.learner),
            selectinload(LearningSession.skill),
            selectinload(LearningSession.feedback),
        )
    )
    return result.scalar_one_or_none()


async def get_user_sessions(
    db: AsyncSession, user_id: int, role: str = "both"
) -> List[LearningSession]:
    if role == "mentor":
        condition = LearningSession.mentor_id == user_id
    elif role == "learner":
        condition = LearningSession.learner_id == user_id
    else:
        from sqlalchemy import or_
        condition = or_(
            LearningSession.mentor_id == user_id,
            LearningSession.learner_id == user_id,
        )

    result = await db.execute(
        select(LearningSession)
        .where(condition)
        .options(
            selectinload(LearningSession.mentor),
            selectinload(LearningSession.learner),
            selectinload(LearningSession.skill),
            selectinload(LearningSession.feedback),
        )
        .order_by(LearningSession.scheduled_at.desc())
    )
    return result.scalars().all()


async def confirm_session(db: AsyncSession, session_id: int) -> Optional[LearningSession]:
    session = await get_session_by_id(db, session_id)
    if session:
        session.status = SessionStatus.confirmed
        await db.commit()
    return await get_session_by_id(db, session_id)


async def cancel_session(
    db: AsyncSession, session_id: int, cancelled_by_id: int, reason: str
) -> Optional[LearningSession]:
    session = await get_session_by_id(db, session_id)
    if not session:
        return None

    session.status = SessionStatus.cancelled
    session.cancellation_reason = reason
    session.cancelled_by_id = cancelled_by_id

    # Increment cancellation count
    user_result = await db.execute(select(User).where(User.id == cancelled_by_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.cancellation_count += 1
        # Flag for fraud if cancellations exceed threshold
        if user.cancellation_count >= 3:
            fraud_log = FraudLog(
                user_id=cancelled_by_id,
                event_type="repeated_cancellation",
                details=f"User has cancelled {user.cancellation_count} sessions",
                severity="medium" if user.cancellation_count < 5 else "high",
            )
            db.add(fraud_log)
            user.fraud_score = min(user.fraud_score + 0.2, 1.0)

    await db.commit()
    return await get_session_by_id(db, session_id)


async def complete_session(db: AsyncSession, session_id: int) -> Optional[LearningSession]:
    session = await get_session_by_id(db, session_id)
    if session:
        session.status = SessionStatus.completed
        await db.commit()
    return await get_session_by_id(db, session_id)


async def add_session_feedback(
    db: AsyncSession, session_id: int, data: SessionFeedbackCreate
) -> SessionFeedback:
    session = await get_session_by_id(db, session_id)

    feedback = SessionFeedback(session_id=session_id, **data.model_dump())
    db.add(feedback)

    # Update mentor reputation
    mentor_result = await db.execute(select(User).where(User.id == session.mentor_id))
    mentor = mentor_result.scalar_one_or_none()
    if mentor:
        # Simple moving average
        mentor.reputation_score = (mentor.reputation_score * 0.8) + (data.rating * 0.2)

    await db.commit()
    await db.refresh(feedback)
    return feedback


async def get_all_sessions(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[LearningSession]:
    result = await db.execute(
        select(LearningSession)
        .options(
            selectinload(LearningSession.mentor),
            selectinload(LearningSession.learner),
            selectinload(LearningSession.skill),
        )
        .order_by(LearningSession.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()
