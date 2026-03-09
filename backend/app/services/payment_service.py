import hmac
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.models import Payment, Task, Wallet, Transaction
from app.schemas.schemas import PaymentOrderOut

try:
    import razorpay
except ImportError:
    razorpay = None


def payments_enabled() -> bool:
    return bool(
        razorpay
        and settings.RAZORPAY_KEY_ID
        and settings.RAZORPAY_KEY_SECRET
    )


def get_razorpay_client():
    if not payments_enabled():
        raise RuntimeError("Payments are not enabled")
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


async def create_payment_order(db: AsyncSession, task_id: int) -> PaymentOrderOut:
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")

    client = get_razorpay_client()
    amount_paise = int(task.budget * 100)  # Razorpay expects paise

    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"task_{task_id}",
        "notes": {"task_id": str(task_id)},
    })

    payment = Payment(
        task_id=task_id,
        razorpay_order_id=order["id"],
        amount=task.budget,
        currency="INR",
        status="created",
    )
    db.add(payment)
    await db.commit()

    return PaymentOrderOut(
        order_id=order["id"],
        amount=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
    )


async def verify_payment(
    db: AsyncSession,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    task_id: int,
) -> bool:
    # Verify signature
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, razorpay_signature):
        return False

    # Update payment record
    payment_result = await db.execute(
        select(Payment).where(Payment.razorpay_order_id == razorpay_order_id)
    )
    payment = payment_result.scalar_one_or_none()
    if payment:
        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = "paid"

    # Deduct from poster wallet
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task:
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == task.poster_id)
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            wallet.total_spent += task.budget
            txn = Transaction(
                wallet_id=wallet.id,
                amount=task.budget,
                transaction_type="debit",
                description=f"Payment for task: {task.title}",
                reference_id=razorpay_payment_id,
            )
            db.add(txn)

    await db.commit()
    return True


async def get_wallet(db: AsyncSession, user_id: int) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    return wallet


async def get_transactions(db: AsyncSession, user_id: int):
    wallet = await get_wallet(db, user_id)
    result = await db.execute(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
