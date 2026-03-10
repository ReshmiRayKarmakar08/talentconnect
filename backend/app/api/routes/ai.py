from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.schemas import ChatRequest, ChatResponse
from app.ai.ai_services import chatbot, fraud_detector
from app.models.models import LearningSession

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat", response_model=ChatResponse)
async def chat(data: ChatRequest, current_user=Depends(get_current_user)):
    last_msg = data.messages[-1].content if data.messages else ""
    history = [m.model_dump() for m in data.messages[:-1]]
    reply = await chatbot.get_response(last_msg, history)
    return ChatResponse(reply=reply)


@router.get("/fraud-check/{user_id}")
async def fraud_check(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.services.user_service import get_user_by_id
    user = await get_user_by_id(db, user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    total_sessions = (await db.execute(
        select(func.count(LearningSession.id)).where(
            (LearningSession.mentor_id == user_id) | (LearningSession.learner_id == user_id)
        )
    )).scalar_one()

    result = fraud_detector.analyze_user({
        "fraud_score": user.fraud_score,
        "cancellation_count": user.cancellation_count,
        "reputation_score": user.reputation_score,
        "total_sessions": total_sessions,
    })
    return result
