from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.models.models import Task, TaskFeedback, TaskStatus, Payment, Wallet, Transaction, User, FraudLog
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskFeedbackCreate


async def create_task(db: AsyncSession, poster_id: int, data: TaskCreate) -> Task:
    task = Task(poster_id=poster_id, **data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_task_by_id(db: AsyncSession, task_id: int) -> Optional[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.poster),
            selectinload(Task.acceptor),
            selectinload(Task.payment),
            selectinload(Task.feedback),
        )
    )
    return result.scalar_one_or_none()


async def get_open_tasks(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.status == TaskStatus.open, Task.is_flagged == False)
        .options(selectinload(Task.poster))
        .order_by(Task.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_user_tasks(db: AsyncSession, user_id: int) -> List[Task]:
    from sqlalchemy import or_
    result = await db.execute(
        select(Task)
        .where(or_(Task.poster_id == user_id, Task.acceptor_id == user_id))
        .options(selectinload(Task.poster), selectinload(Task.acceptor))
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()


async def accept_task(db: AsyncSession, task_id: int, acceptor_id: int) -> Optional[Task]:
    task = await get_task_by_id(db, task_id)
    if not task or task.status != TaskStatus.open:
        return None
    task.acceptor_id = acceptor_id
    task.status = TaskStatus.assigned
    await db.commit()
    await db.refresh(task)
    return task


async def submit_task(
    db: AsyncSession, task_id: int, submission_url: str, submission_notes: str
) -> Optional[Task]:
    task = await get_task_by_id(db, task_id)
    if not task:
        return None
    task.submission_url = submission_url
    task.submission_notes = submission_notes
    task.status = TaskStatus.submitted
    await db.commit()
    await db.refresh(task)
    return task


async def complete_task(db: AsyncSession, task_id: int) -> Optional[Task]:
    task = await get_task_by_id(db, task_id)
    if not task:
        return None
    task.status = TaskStatus.completed

    # Transfer payment to acceptor wallet
    if task.acceptor_id:
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == task.acceptor_id)
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            wallet.balance += task.budget
            wallet.total_earned += task.budget
            txn = Transaction(
                wallet_id=wallet.id,
                amount=task.budget,
                transaction_type="credit",
                description=f"Payment for task: {task.title}",
                reference_id=str(task_id),
            )
            db.add(txn)

    await db.commit()
    await db.refresh(task)
    return task


async def flag_task(db: AsyncSession, task_id: int, reason: str) -> Optional[Task]:
    task = await get_task_by_id(db, task_id)
    if task:
        task.is_flagged = True
        task.flag_reason = reason
        task.status = TaskStatus.flagged
        await db.commit()
    return task


async def add_task_feedback(
    db: AsyncSession, task_id: int, data: TaskFeedbackCreate
) -> TaskFeedback:
    task = await get_task_by_id(db, task_id)
    feedback = TaskFeedback(task_id=task_id, **data.model_dump())
    db.add(feedback)

    if task and task.acceptor_id:
        acceptor_result = await db.execute(select(User).where(User.id == task.acceptor_id))
        acceptor = acceptor_result.scalar_one_or_none()
        if acceptor:
            acceptor.reputation_score = (acceptor.reputation_score * 0.8) + (data.rating * 0.2)

    await db.commit()
    await db.refresh(feedback)
    return feedback


async def get_all_tasks(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Task]:
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.poster), selectinload(Task.acceptor))
        .order_by(Task.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


async def delete_task(db: AsyncSession, task_id: int) -> bool:
    task = await get_task_by_id(db, task_id)
    if not task:
        return False
    await db.delete(task)
    await db.commit()
    return True
