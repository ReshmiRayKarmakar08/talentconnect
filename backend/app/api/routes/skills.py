from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user, get_current_admin
from app.schemas.schemas import (
    SkillCreate, SkillOut, UserSkillCreate, UserSkillOut,
    VerificationQuizOut, VerificationSubmit, VerificationResult, MentorCard
)
from app.services import skill_service
from app.ai.ai_services import get_quiz_for_skill, skill_matcher, skill_recommender

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("/", response_model=List[SkillOut])
async def list_skills(db: AsyncSession = Depends(get_db)):
    return await skill_service.get_all_skills(db)


@router.post("/", response_model=SkillOut, dependencies=[Depends(get_current_admin)])
async def create_skill(data: SkillCreate, db: AsyncSession = Depends(get_db)):
    return await skill_service.create_skill(db, data)


@router.get("/my", response_model=List[UserSkillOut])
async def my_skills(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await skill_service.get_user_skills(db, current_user.id)


@router.post("/my", response_model=UserSkillOut)
async def add_skill(
    data: UserSkillCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await skill_service.add_user_skill(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/mentors/{skill_id}", response_model=List[MentorCard])
async def get_mentors(skill_id: int, db: AsyncSession = Depends(get_db)):
    skill = await skill_service.get_skill_by_id(db, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    user_skills = await skill_service.get_mentors_for_skill(db, skill_id)
    cards = []
    for us in user_skills:
        avg = await skill_service.get_avg_rating_for_mentor(db, us.user_id)
        count = await skill_service.get_mentor_session_count(db, us.user_id)
        cards.append(MentorCard(
            user=us.user,
            user_skill=us,
            avg_rating=avg,
            total_sessions=count,
        ))

    # AI: rank mentors by cosine similarity with skill tags
    skill_tags = skill.tags or [skill.name, skill.category]
    profiles = [{"user_skill": c, "tags": (c.user_skill.skill.tags or []) + [c.user_skill.skill.name]} for c in cards]
    if profiles:
        ranked = skill_matcher.rank_mentors(skill_tags, profiles)
        cards = [p["user_skill"] for p, _ in ranked]

    return cards


@router.get("/verify/{user_skill_id}/quiz", response_model=VerificationQuizOut)
async def get_verification_quiz(
    user_skill_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_skill = await skill_service.get_user_skill_by_id(db, user_skill_id)
    if not user_skill or user_skill.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="User skill not found")

    questions = get_quiz_for_skill(user_skill.skill.name)
    # Strip answers before sending to client
    client_questions = [{"question": q["question"], "options": q["options"]} for q in questions]

    await skill_service.create_verification_quiz(db, user_skill_id, questions)
    return VerificationQuizOut(user_skill_id=user_skill_id, questions=client_questions)


@router.post("/verify/submit", response_model=VerificationResult)
async def submit_verification(
    data: VerificationSubmit,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await skill_service.submit_verification(db, data.user_skill_id, data.answers)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return VerificationResult(
        score=result.score,
        passed=result.passed,
        message="✅ Skill verified!" if result.passed else f"❌ Score: {result.score:.0f}%. Need 70% to pass. You can retry.",
    )


@router.get("/recommendations", response_model=List[dict])
async def get_recommendations(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_skills = await skill_service.get_user_skills(db, current_user.id)
    all_skills = await skill_service.get_all_skills(db)

    user_skill_names = [us.skill.name for us in user_skills]
    all_skill_names = [s.name for s in all_skills]

    recommendations = skill_recommender.recommend(user_skill_names, all_skill_names)
    all_skills_map = {s.name.lower(): s for s in all_skills}

    result = []
    for name, confidence in recommendations:
        skill = all_skills_map.get(name.lower())
        if skill:
            result.append({
                "skill": {"id": skill.id, "name": skill.name, "category": skill.category},
                "reason": f"Complements your existing skills",
                "confidence": round(confidence / 5, 2),
            })
    return result
