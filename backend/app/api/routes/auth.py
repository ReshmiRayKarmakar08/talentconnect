from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshRequest,
    PasswordResetRequest,
    UserPublic,
)
from app.core.security import (
    create_access_token, create_refresh_token,
    decode_token, get_current_user
)
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import User, UserRole, Wallet, Transaction
from app.services.user_service import (
    create_user, get_user_by_email, get_user_by_username, authenticate_user, reset_user_password
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = await create_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Demo admin auto-provision
    if (
        data.email.lower() == settings.ADMIN_DEMO_EMAIL.lower()
        and data.password == settings.ADMIN_DEMO_PASSWORD
    ):
        admin = await get_user_by_email(db, settings.ADMIN_DEMO_EMAIL)
        if not admin:
            admin = User(
                email=settings.ADMIN_DEMO_EMAIL,
                username="admin",
                full_name="TalentConnect Admin",
                hashed_password=get_password_hash(settings.ADMIN_DEMO_PASSWORD),
                college="TalentConnect",
                role=UserRole.admin,
                is_verified=True,
            )
            db.add(admin)
            await db.flush()
            wallet = Wallet(
                user_id=admin.id,
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
        else:
            admin.role = UserRole.admin
            admin.hashed_password = get_password_hash(settings.ADMIN_DEMO_PASSWORD)
        await db.commit()
        return TokenResponse(
            access_token=create_access_token({"sub": str(admin.id), "role": admin.role}),
            refresh_token=create_refresh_token({"sub": str(admin.id)}),
        )

    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")
    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id), "role": user.role}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    from app.services.user_service import get_user_by_id
    user = await get_user_by_id(db, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id), "role": user.role}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
    )


@router.get("/me", response_model=UserPublic)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    user = await reset_user_password(db, data.email, data.new_password)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Password updated successfully"}
