from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import SessionCreate, SessionOut, SessionCancel, SessionFeedbackCreate, SessionFeedbackOut
from app.services import session_service
from app.services.user_service import create_notification

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/", response_model=SessionOut)
async def book_session(
    data: SessionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.mentor_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book a session with yourself")
    session = await session_service.create_session(db, current_user.id, data)
    await create_notification(
        db, data.mentor_id,
        title="New Session Request",
        message=f"{current_user.full_name} wants to book a learning session with you.",
        notif_type="session",
        metadata={"session_id": session.id},
    )
    return session


@router.get("/my", response_model=List[SessionOut])
async def my_sessions(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await session_service.get_user_sessions(db, current_user.id)


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await session_service.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/confirm", response_model=SessionOut)
async def confirm_session(
    session_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session_by_id(db, session_id)
    if not session or session.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can confirm this session")
    updated = await session_service.confirm_session(db, session_id)
    await create_notification(
        db, session.learner_id,
        title="Session Confirmed!",
        message=f"Your session has been confirmed. Meet link: {updated.meet_link}",
        notif_type="session",
        metadata={"session_id": session_id, "meet_link": updated.meet_link},
    )
    return updated


@router.post("/{session_id}/cancel", response_model=SessionOut)
async def cancel_session(
    session_id: int,
    data: SessionCancel,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != current_user.id and session.learner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await session_service.cancel_session(db, session_id, current_user.id, data.reason)


@router.post("/{session_id}/complete", response_model=SessionOut)
async def complete_session(
    session_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session_by_id(db, session_id)
    if not session or session.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can mark as complete")
    return await session_service.complete_session(db, session_id)


@router.post("/{session_id}/feedback", response_model=SessionFeedbackOut)
async def add_feedback(
    session_id: int,
    data: SessionFeedbackCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session_by_id(db, session_id)
    if not session or session.learner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the learner can leave feedback")
    if session.feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    return await session_service.add_session_feedback(db, session_id, data)
