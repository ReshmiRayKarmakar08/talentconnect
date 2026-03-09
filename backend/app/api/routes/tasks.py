import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import TaskCreate, TaskOut, TaskSubmit, TaskFeedbackCreate, TaskFeedbackOut
from app.services import task_service
from app.services.user_service import create_notification

router = APIRouter(prefix="/tasks", tags=["Tasks"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[TaskOut])
async def list_tasks(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await task_service.get_open_tasks(db, skip, limit)


@router.post("/", response_model=TaskOut)
async def create_task(
    data: TaskCreate,
    request: Request,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "create_task auth_header_present=%s user_id=%s",
        bool(request.headers.get("authorization")),
        getattr(current_user, "id", None),
    )
    return await task_service.create_task(db, current_user.id, data)


@router.get("/my", response_model=List[TaskOut])
async def my_tasks(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.get_user_tasks(db, current_user.id)


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/accept", response_model=TaskOut)
async def accept_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.poster_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot accept your own task")
    updated = await task_service.accept_task(db, task_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=400, detail="Task is no longer available")
    await create_notification(
        db, task.poster_id,
        title="Task Accepted!",
        message=f"{current_user.full_name} has accepted your task: {task.title}",
        notif_type="task",
        metadata={"task_id": task_id},
    )
    return updated


@router.post("/{task_id}/submit", response_model=TaskOut)
async def submit_task(
    task_id: int,
    data: TaskSubmit,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task_by_id(db, task_id)
    if not task or task.acceptor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = await task_service.submit_task(
        db, task_id,
        submission_url="",  # Would come from file upload in production
        submission_notes=data.submission_notes or "",
    )
    await create_notification(
        db, task.poster_id,
        title="Task Submitted",
        message=f"Your task '{task.title}' has been submitted for review.",
        notif_type="task",
        metadata={"task_id": task_id},
    )
    return updated


@router.post("/{task_id}/complete", response_model=TaskOut)
async def complete_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task_by_id(db, task_id)
    if not task or task.poster_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the task poster can mark as complete")
    updated = await task_service.complete_task(db, task_id)
    if task.acceptor_id:
        await create_notification(
            db, task.acceptor_id,
            title="Payment Released!",
            message=f"₹{task.budget} has been credited to your wallet for task: {task.title}",
            notif_type="payment",
            metadata={"task_id": task_id},
        )
    return updated


@router.post("/{task_id}/feedback", response_model=TaskFeedbackOut)
async def task_feedback(
    task_id: int,
    data: TaskFeedbackCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task_by_id(db, task_id)
    if not task or task.poster_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the poster can leave feedback")
    return await task_service.add_task_feedback(db, task_id, data)
