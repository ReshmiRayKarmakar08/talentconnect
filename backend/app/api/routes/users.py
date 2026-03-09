from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import UserPublic, UserUpdate, NotificationOut
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile/{user_id}", response_model=UserPublic)
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserPublic)
async def update_profile(
    data: UserUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.update_user(db, current_user, data)


@router.get("/notifications", response_model=List[NotificationOut])
async def get_notifications(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.get_notifications(db, current_user.id)


@router.post("/notifications/read")
async def mark_read(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await user_service.mark_notifications_read(db, current_user.id)
    return {"message": "Notifications marked as read"}
