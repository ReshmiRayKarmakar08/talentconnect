from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


DEFAULT_SKILLS = [
    {"name": "Python", "category": "Programming", "tags": ["python", "backend", "automation"]},
    {"name": "Java", "category": "Programming", "tags": ["java", "oop", "spring"]},
    {"name": "C++", "category": "Programming", "tags": ["c++", "dsa", "competitive programming"]},
    {"name": "JavaScript", "category": "Programming", "tags": ["javascript", "web", "frontend"]},
    {"name": "TypeScript", "category": "Programming", "tags": ["typescript", "web", "frontend"]},
    {"name": "React", "category": "Web Development", "tags": ["react", "frontend", "spa"]},
    {"name": "Next.js", "category": "Web Development", "tags": ["next.js", "react", "ssr"]},
    {"name": "Node.js", "category": "Web Development", "tags": ["node.js", "backend", "api"]},
    {"name": "FastAPI", "category": "Web Development", "tags": ["fastapi", "python", "api"]},
    {"name": "Django", "category": "Web Development", "tags": ["django", "python", "backend"]},
    {"name": "HTML", "category": "Web Development", "tags": ["html", "web", "frontend"]},
    {"name": "CSS", "category": "Web Development", "tags": ["css", "web", "frontend"]},
    {"name": "Tailwind CSS", "category": "Web Development", "tags": ["tailwind", "css", "frontend"]},
    {"name": "SQL", "category": "Database", "tags": ["sql", "database", "querying"]},
    {"name": "PostgreSQL", "category": "Database", "tags": ["postgresql", "database", "sql"]},
    {"name": "MongoDB", "category": "Database", "tags": ["mongodb", "nosql", "database"]},
    {"name": "Data Structures", "category": "Computer Science", "tags": ["dsa", "algorithms", "problem solving"]},
    {"name": "Algorithms", "category": "Computer Science", "tags": ["algorithms", "dsa", "problem solving"]},
    {"name": "Operating Systems", "category": "Computer Science", "tags": ["os", "systems", "computer science"]},
    {"name": "DBMS", "category": "Computer Science", "tags": ["dbms", "database", "sql"]},
    {"name": "Computer Networks", "category": "Computer Science", "tags": ["networks", "cn", "systems"]},
    {"name": "Machine Learning", "category": "AI & Data", "tags": ["machine learning", "python", "ai"]},
    {"name": "Deep Learning", "category": "AI & Data", "tags": ["deep learning", "neural networks", "ai"]},
    {"name": "Data Science", "category": "AI & Data", "tags": ["data science", "pandas", "analytics"]},
    {"name": "Pandas", "category": "AI & Data", "tags": ["pandas", "python", "data"]},
    {"name": "NumPy", "category": "AI & Data", "tags": ["numpy", "python", "data"]},
    {"name": "Power BI", "category": "AI & Data", "tags": ["power bi", "dashboard", "analytics"]},
    {"name": "Excel", "category": "Productivity", "tags": ["excel", "spreadsheets", "analytics"]},
    {"name": "Figma", "category": "Design", "tags": ["figma", "ui", "ux"]},
    {"name": "UI/UX Design", "category": "Design", "tags": ["ui", "ux", "design"]},
    {"name": "Flutter", "category": "Mobile Development", "tags": ["flutter", "mobile", "dart"]},
    {"name": "Android Development", "category": "Mobile Development", "tags": ["android", "mobile", "java"]},
    {"name": "Git & GitHub", "category": "Tools", "tags": ["git", "github", "version control"]},
    {"name": "Docker", "category": "Tools", "tags": ["docker", "devops", "containers"]},
    {"name": "AWS", "category": "Cloud", "tags": ["aws", "cloud", "deployment"]},
]

SAMPLE_MENTORS = [
    {
        "email": "mentor.python@example.com",
        "username": "aarav_python",
        "full_name": "Aarav Sharma",
        "college": "IIT Delhi",
        "reputation_score": 4.8,
        "skills": [
            ("Python", "advanced", 500),
            ("FastAPI", "advanced", 650),
            ("Data Science", "intermediate", 550),
        ],
    },
    {
        "email": "mentor.web@example.com",
        "username": "riya_web",
        "full_name": "Riya Verma",
        "college": "NSUT Delhi",
        "reputation_score": 4.6,
        "skills": [
            ("React", "advanced", 600),
            ("JavaScript", "advanced", 450),
            ("UI/UX Design", "intermediate", 500),
        ],
    },
    {
        "email": "mentor.dsa@example.com",
        "username": "kabir_dsa",
        "full_name": "Kabir Singh",
        "college": "NIT Trichy",
        "reputation_score": 4.9,
        "skills": [
            ("Data Structures", "advanced", 700),
            ("Algorithms", "advanced", 700),
            ("C++", "advanced", 550),
        ],
    },
]


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.models.models import Skill

    async with AsyncSessionLocal() as session:
        from app.core.security import get_password_hash
        from app.models.models import Skill, User, UserSkill, VerificationStatus, SkillLevel, Wallet

        existing_result = await session.execute(select(Skill))
        existing_skills = {skill.name.lower() for skill in existing_result.scalars().all()}

        missing = [
            Skill(name=item["name"], category=item["category"], tags=item["tags"])
            for item in DEFAULT_SKILLS
            if item["name"].lower() not in existing_skills
        ]

        if missing:
            session.add_all(missing)
            await session.commit()

        skill_result = await session.execute(select(Skill))
        skill_map = {skill.name.lower(): skill for skill in skill_result.scalars().all()}

        existing_user_result = await session.execute(select(User))
        existing_users = {user.email.lower(): user for user in existing_user_result.scalars().all()}

        for mentor_data in SAMPLE_MENTORS:
            mentor = existing_users.get(mentor_data["email"].lower())
            if not mentor:
                mentor = User(
                    email=mentor_data["email"],
                    username=mentor_data["username"],
                    full_name=mentor_data["full_name"],
                    hashed_password=get_password_hash("12345678"),
                    college=mentor_data["college"],
                    reputation_score=mentor_data["reputation_score"],
                    is_verified=True,
                )
                session.add(mentor)
                await session.flush()
                session.add(Wallet(user_id=mentor.id))
                existing_users[mentor.email.lower()] = mentor
            else:
                mentor.reputation_score = mentor_data["reputation_score"]
                mentor.is_verified = True

            existing_user_skill_result = await session.execute(
                select(UserSkill).where(UserSkill.user_id == mentor.id)
            )
            existing_skill_ids = {
                user_skill.skill_id for user_skill in existing_user_skill_result.scalars().all()
            }

            for skill_name, level, hourly_rate in mentor_data["skills"]:
                skill = skill_map.get(skill_name.lower())
                if not skill or skill.id in existing_skill_ids:
                    continue

                session.add(
                    UserSkill(
                        user_id=mentor.id,
                        skill_id=skill.id,
                        level=SkillLevel(level),
                        verification_status=VerificationStatus.verified,
                        is_offering=True,
                        hourly_rate=hourly_rate,
                        years_experience=2.0 if level == "intermediate" else 4.0,
                    )
                )

        await session.commit()
