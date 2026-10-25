from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import (
    PaymentOrderCreate, PaymentOrderOut, PaymentVerify, WalletOut,
    TransactionOut, TaskOut, PaymentDemoOut, WalletPaymentRequest,
    WalletDebitRequest, WalletTopupOrderCreate, WalletTopupVerify,
    WalletWithdrawRequest, TaskCreate, UserRegister
)
from app.services.payment_service import (
    create_payment_order,
    get_transactions,
    get_wallet,
    payments_enabled,
    verify_payment,
    wallet_pay,
    wallet_debit,
    create_topup_order,
    verify_topup,
    withdraw_wallet,
)
from app.services import task_service, user_service
from app.models.models import TaskStatus
from app.core.config import settings
from app.schemas.schemas import TaskCreate, UserRegister
from datetime import datetime, timedelta

router = APIRouter(prefix="/payments", tags=["Payments"])


def ensure_payments_enabled():
    if not payments_enabled():
        raise HTTPException(
            status_code=503,
            detail="Payments are not enabled in this deployment",
        )


def ensure_demo_enabled():
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=403,
            detail="Demo payments are disabled in this deployment",
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


@router.post("/demo", response_model=PaymentDemoOut)
async def demo_order(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ensure_payments_enabled()
    ensure_demo_enabled()

    demo_email = "demo-acceptor@talentconnect.local"
    demo_username = "demo_acceptor"

    demo_user = await user_service.get_user_by_email(db, demo_email)
    if not demo_user:
        demo_user = await user_service.create_user(
            db,
            UserRegister(
                email=demo_email,
                username=demo_username,
                full_name="Demo Acceptor",
                password="DemoPassword123",
                college="TalentConnect Demo",
            ),
        )

    demo_task = await task_service.create_task(
        db,
        current_user.id,
        TaskCreate(
            title="Demo payment task",
            description="Razorpay test transaction to verify payment flow and wallet updates.",
            subject="Demo",
            budget=1,
            deadline=datetime.utcnow() + timedelta(days=2),
        ),
    )

    demo_task.acceptor_id = demo_user.id
    demo_task.status = TaskStatus.assigned
    await db.commit()
    await db.refresh(demo_task)

    demo_task = await task_service.submit_task(db, demo_task.id, "", "Demo submission")

    order = await create_payment_order(db, demo_task.id)
    return PaymentDemoOut(
        order_id=order.order_id,
        amount=order.amount,
        currency=order.currency,
        key_id=order.key_id,
        task_id=demo_task.id,
        task_title=demo_task.title,
    )


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


@router.post("/wallet-pay", response_model=TaskOut)
async def wallet_payment(
    data: WalletPaymentRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task_by_id(db, data.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.poster_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the task poster can pay")
    if task.status != TaskStatus.submitted:
        raise HTTPException(status_code=400, detail="Task is not ready for payment")
    try:
        await wallet_pay(db, data.task_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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


@router.post("/wallet-debit", response_model=WalletOut)
async def debit_wallet(
    data: WalletDebitRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        wallet = await wallet_debit(
            db,
            current_user.id,
            data.amount,
            data.description,
            data.reference_id,
        )
        return wallet
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/config")
async def payment_config():
    return {
        "payments_enabled": payments_enabled(),
        "key_id": settings.RAZORPAY_KEY_ID,
        "payment_page_url": getattr(settings, "RAZORPAY_PAYMENT_PAGE_URL", "https://rzp.io/rzp/m0ll5SZl"),
    }


@router.post("/topup/order", response_model=PaymentOrderOut)
async def topup_order(
    data: WalletTopupOrderCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ensure_payments_enabled()
    try:
        return await create_topup_order(db, current_user.id, data.amount)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/topup/verify", response_model=WalletOut)
async def topup_verify(
    data: WalletTopupVerify,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ensure_payments_enabled()
    try:
        return await verify_topup(
            db,
            current_user.id,
            data.razorpay_order_id,
            data.razorpay_payment_id,
            data.razorpay_signature,
            data.amount,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/withdraw", response_model=WalletOut)
async def withdraw(
    data: WalletWithdrawRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await withdraw_wallet(
            db,
            current_user.id,
            data.amount,
            data.upi_or_account,
            data.notes,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
