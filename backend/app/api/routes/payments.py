from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import PaymentOrderCreate, PaymentOrderOut, PaymentVerify, WalletOut, TransactionOut
from app.services.payment_service import create_payment_order, verify_payment, get_wallet, get_transactions

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/order", response_model=PaymentOrderOut)
async def create_order(
    data: PaymentOrderCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_payment_order(db, data.task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify")
async def verify(
    data: PaymentVerify,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await verify_payment(
        db,
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
        data.task_id,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    return {"message": "Payment verified successfully"}


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
