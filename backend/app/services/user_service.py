from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import Optional, List
from datetime import datetime
from app.models.models import User, Wallet, Notification, Transaction, UserRole
from app.core.config import settings
from app.schemas.schemas import UserRegister, UserUpdate
from app.core.security import get_password_hash, verify_password


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        college=data.college,
    )
    db.add(user)
    await db.flush()

    # Create wallet for user with initial credit
    wallet = Wallet(
        user_id=user.id,
        balance=float(settings.INITIAL_WALLET_CREDIT or 0),
        total_earned=float(settings.INITIAL_WALLET_CREDIT or 0),
    )
    db.add(wallet)
    await db.flush()
    if settings.INITIAL_WALLET_CREDIT:
        db.add(Transaction(
            wallet_id=wallet.id,
            amount=float(settings.INITIAL_WALLET_CREDIT),
            transaction_type="credit",
            description="Welcome bonus",
            reference_id="welcome_bonus",
        ))
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        await _normalize_user_fields(db, user)
    return user


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def reset_user_password(db: AsyncSession, email: str, new_password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None

    user.hashed_password = get_password_hash(new_password)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def ban_user(db: AsyncSession, user_id: int) -> Optional[User]:
    user = await get_user_by_id(db, user_id)
    if user:
        user.is_active = False
        await db.commit()
    return user


async def unban_user(db: AsyncSession, user_id: int) -> Optional[User]:
    user = await get_user_by_id(db, user_id)
    if user:
        user.is_active = True
        await db.commit()
    return user


async def delete_user(db: AsyncSession, user_id: int) -> Optional[User]:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    if user.role == "admin" or user.email.lower() == settings.ADMIN_DEMO_EMAIL.lower() or user.username == "admin":
        return None
    # Soft delete + anonymize to avoid FK issues
    user.is_active = False
    user.email = f"deleted-{user.id}@deleted.local"
    user.username = f"deleted_{user.id}"
    user.full_name = "Deleted User"
    await db.commit()
    return user


async def get_all_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    for user in users:
        await _normalize_user_fields(db, user)
    return users


async def _normalize_user_fields(db: AsyncSession, user: User) -> None:
    changed = False
    if not user.email or "@" not in user.email:
        user.email = f"deleted-{user.id}@deleted.local"
        changed = True
    if not user.full_name:
        user.full_name = user.username or "User"
        changed = True
    if user.reputation_score is None:
        user.reputation_score = 0.0
        changed = True
    if user.fraud_score is None:
        user.fraud_score = 0.0
        changed = True
    if user.cancellation_count is None:
        user.cancellation_count = 0
        changed = True
    if user.created_at is None:
        user.created_at = datetime.utcnow()
        changed = True
    if user.role is None:
        user.role = UserRole.student
        changed = True
    if changed:
        await db.commit()


async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    notif_type: str,
    metadata: dict = None,
):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notif_type=notif_type,
        extra_metadata=metadata,
    )
    db.add(notif)
    await db.commit()
    return notif


async def get_notifications(db: AsyncSession, user_id: int) -> List[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


async def mark_notifications_read(db: AsyncSession, user_id: int):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
