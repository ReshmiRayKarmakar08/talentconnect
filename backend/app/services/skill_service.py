from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict
from collections import defaultdict
from app.models.models import Skill, UserSkill, SkillVerification, VerificationStatus, SessionFeedback, LearningSession
from app.schemas.schemas import SkillCreate, UserSkillCreate


async def get_all_skills(db: AsyncSession) -> List[Skill]:
    result = await db.execute(select(Skill).order_by(Skill.category, Skill.name))
    return result.scalars().all()


async def get_skill_by_id(db: AsyncSession, skill_id: int) -> Optional[Skill]:
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    return result.scalar_one_or_none()


async def create_skill(db: AsyncSession, data: SkillCreate) -> Skill:
    skill = Skill(**data.model_dump())
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill


async def add_user_skill(db: AsyncSession, user_id: int, data: UserSkillCreate) -> UserSkill:
    payload = data.model_dump()
    skill_id = payload.get("skill_id")
    skill_name = (payload.pop("skill_name", None) or "").strip()
    category = (payload.pop("category", None) or "").strip()

    if not skill_id:
        if not skill_name:
            raise ValueError("Select an existing skill or enter a custom skill name")

        existing_result = await db.execute(
            select(Skill).where(func.lower(Skill.name) == skill_name.lower())
        )
        skill = existing_result.scalar_one_or_none()

        if not skill:
            skill = Skill(
                name=skill_name,
                category=category or "General",
                tags=[skill_name.lower()],
            )
            db.add(skill)
            await db.flush()

        skill_id = skill.id

    payload["skill_id"] = skill_id
    user_skill = UserSkill(user_id=user_id, **payload)
    db.add(user_skill)
    await db.commit()
    result = await db.execute(
        select(UserSkill)
        .where(UserSkill.id == user_skill.id)
        .options(selectinload(UserSkill.skill), selectinload(UserSkill.verification))
    )
    return result.scalar_one()


async def get_user_skills(db: AsyncSession, user_id: int) -> List[UserSkill]:
    result = await db.execute(
        select(UserSkill)
        .where(UserSkill.user_id == user_id)
        .options(selectinload(UserSkill.skill), selectinload(UserSkill.verification))
    )
    return result.scalars().all()


async def get_user_skill_by_id(db: AsyncSession, user_skill_id: int) -> Optional[UserSkill]:
    result = await db.execute(
        select(UserSkill)
        .where(UserSkill.id == user_skill_id)
        .options(selectinload(UserSkill.skill), selectinload(UserSkill.verification))
    )
    return result.scalar_one_or_none()


async def get_mentors_for_skill(db: AsyncSession, skill_id: int) -> List[UserSkill]:
    """Return active users offering a specific skill, verified first."""
    from app.models.models import User
    result = await db.execute(
        select(UserSkill)
        .join(UserSkill.user)
        .where(
            UserSkill.skill_id == skill_id,
            UserSkill.is_offering == True,
            User.is_active == True,
        )
        .options(selectinload(UserSkill.skill), selectinload(UserSkill.user))
    )
    mentors = result.scalars().all()
    return sorted(
        mentors,
        key=lambda item: (
            item.verification_status != VerificationStatus.verified,
            -(item.user.reputation_score or 0),
        ),
    )


async def create_verification_quiz(
    db: AsyncSession, user_skill_id: int, questions: list
) -> SkillVerification:
    # Remove any existing
    existing = await db.execute(
        select(SkillVerification).where(SkillVerification.user_skill_id == user_skill_id)
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)

    verif = SkillVerification(user_skill_id=user_skill_id, questions=questions)
    db.add(verif)
    await db.commit()
    await db.refresh(verif)
    return verif


async def submit_verification(
    db: AsyncSession, user_skill_id: int, answers: List[int]
) -> SkillVerification:
    from datetime import datetime

    result = await db.execute(
        select(SkillVerification).where(SkillVerification.user_skill_id == user_skill_id)
    )
    verif = result.scalar_one_or_none()
    if not verif:
        raise ValueError("No quiz found for this skill")

    questions = verif.questions
    correct = sum(
        1 for i, q in enumerate(questions)
        if i < len(answers) and answers[i] == q["answer"]
    )
    score = (correct / len(questions)) * 100 if questions else 0
    passed = score >= 70

    verif.user_answers = answers
    verif.score = score
    verif.passed = passed
    verif.attempted_at = datetime.utcnow()

    # Update user_skill verification status
    us_result = await db.execute(select(UserSkill).where(UserSkill.id == user_skill_id))
    user_skill = us_result.scalar_one_or_none()
    if user_skill:
        user_skill.verification_status = (
            VerificationStatus.verified if passed else VerificationStatus.rejected
        )

    await db.commit()
    await db.refresh(verif)
    return verif


async def get_avg_rating_for_mentor(db: AsyncSession, mentor_id: int) -> Optional[float]:
    result = await db.execute(
        select(func.avg(SessionFeedback.rating))
        .join(LearningSession, LearningSession.id == SessionFeedback.session_id)
        .where(LearningSession.mentor_id == mentor_id)
    )
    return result.scalar_one_or_none()


async def get_mentor_session_count(db: AsyncSession, mentor_id: int) -> int:
    result = await db.execute(
        select(func.count(LearningSession.id)).where(LearningSession.mentor_id == mentor_id)
    )
    return result.scalar_one() or 0


async def get_all_skill_verifications(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(SkillVerification)
        .options(
            selectinload(SkillVerification.user_skill).selectinload(UserSkill.user),
            selectinload(SkillVerification.user_skill).selectinload(UserSkill.skill),
        )
        .order_by(SkillVerification.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_skill_cooccurrence_graph(db: AsyncSession) -> Dict[str, Dict[str, float]]:
    result = await db.execute(
        select(UserSkill).options(selectinload(UserSkill.skill))
    )
    user_skills = result.scalars().all()

    skills_by_user: Dict[int, set] = defaultdict(set)
    for us in user_skills:
        if us.skill and us.skill.name:
            skills_by_user[us.user_id].add(us.skill.name.lower())

    graph: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for skill_set in skills_by_user.values():
        for left in skill_set:
            for right in skill_set:
                if left != right:
                    graph[left][right] += 1.0

    return {k: dict(v) for k, v in graph.items()}
