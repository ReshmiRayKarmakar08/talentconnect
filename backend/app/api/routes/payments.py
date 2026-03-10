from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import PaymentOrderCreate, PaymentOrderOut, PaymentVerify, WalletOut, TransactionOut, TaskOut
from app.services.payment_service import (
    create_payment_order,
    get_transactions,
    get_wallet,
    payments_enabled,
    verify_payment,
)
from app.services import task_service
from app.models.models import TaskStatus

router = APIRouter(prefix="/payments", tags=["Payments"])


def ensure_payments_enabled():
    if not payments_enabled():
        raise HTTPException(
            status_code=503,
            detail="Payments are not enabled in this deployment",
        )


@router.post("/order", response_model=PaymentOrderOut)
async def create_order(
    data: PaymentOrderCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ensure_payments_enabled()
    task = await task_service.get_task_by_id(db, data.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.poster_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the task poster can pay")
    if task.status != TaskStatus.submitted:
        raise HTTPException(status_code=400, detail="Task is not ready for payment")
    try:
        return await create_payment_order(db, data.task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify", response_model=TaskOut)
async def verify(
    data: PaymentVerify,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ensure_payments_enabled()
    task = await task_service.get_task_by_id(db, data.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.poster_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the task poster can verify payment")
    if task.status != TaskStatus.submitted:
        raise HTTPException(status_code=400, detail="Task is not ready for payment")
    success = await verify_payment(
        db,
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
        data.task_id,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    completed = await task_service.complete_task(db, data.task_id)
    if not completed:
        raise HTTPException(status_code=400, detail="Unable to complete task after payment")
    return completed


@router.get("/wallet", response_model=WalletOut)
async def wallet(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_wallet(db, current_user.id)


@router.get("/transactions", response_model=List[TransactionOut])
async def transactions(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_transactions(db, current_user.id)
