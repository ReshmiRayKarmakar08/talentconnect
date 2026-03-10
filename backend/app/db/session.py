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

SAMPLE_TASKS = [
    {
        "title": "Debug Python sorting assignment",
        "description": "Need help optimizing a sorting assignment with time complexity explanation.",
        "subject": "Data Structures",
        "budget": 150,
        "deadline_days": 3,
    },
    {
        "title": "Create React landing page",
        "description": "Build a responsive landing page with Tailwind and reusable components.",
        "subject": "Web Development",
        "budget": 300,
        "deadline_days": 5,
    },
    {
        "title": "SQL query practice set",
        "description": "Need help writing joins and aggregate queries for a practice set.",
        "subject": "Database",
        "budget": 200,
        "deadline_days": 4,
    },
    {
        "title": "Design a UI kit for student dashboard",
        "description": "Create a cohesive UI kit with buttons, cards, and form styles for a student platform.",
        "subject": "UI/UX Design",
        "budget": 250,
        "deadline_days": 6,
    },
    {
        "title": "Build a Node.js REST API starter",
        "description": "Need a boilerplate with auth, CRUD routes, and basic validation.",
        "subject": "Web Development",
        "budget": 350,
        "deadline_days": 5,
    },
    {
        "title": "Data cleanup for analytics report",
        "description": "Clean CSV data, remove duplicates, and summarize metrics in a short report.",
        "subject": "Data Science",
        "budget": 180,
        "deadline_days": 3,
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
        from app.models.models import Skill, User, UserSkill, VerificationStatus, SkillLevel, Wallet, Transaction, Task, UserRole, LearningSession, SessionStatus
        from datetime import datetime, timedelta

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
                wallet = Wallet(
                    user_id=mentor.id,
                    balance=float(settings.INITIAL_WALLET_CREDIT or 0),
                    total_earned=float(settings.INITIAL_WALLET_CREDIT or 0),
                )
                session.add(wallet)
                await session.flush()
                if settings.INITIAL_WALLET_CREDIT:
                    session.add(Transaction(
                        wallet_id=wallet.id,
                        amount=float(settings.INITIAL_WALLET_CREDIT),
                        transaction_type="credit",
                        description="Welcome bonus",
                        reference_id="welcome_bonus",
                    ))
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

        existing_task_result = await session.execute(select(Task))
        if existing_task_result.scalars().first() is None:
            poster = next(iter(existing_users.values()), None)
            if poster:
                tasks = []
                for item in SAMPLE_TASKS:
                    tasks.append(Task(
                        poster_id=poster.id,
                        title=item["title"],
                        description=item["description"],
                        subject=item["subject"],
                        budget=item["budget"],
                        deadline=datetime.utcnow() + timedelta(days=item["deadline_days"]),
                    ))
                session.add_all(tasks)

        # Seed sample learner + sessions
        learner_email = "learner.demo@example.com"
        learner = existing_users.get(learner_email)
        if not learner:
            learner = User(
                email=learner_email,
                username="learner_demo",
                full_name="Demo Learner",
                hashed_password=get_password_hash("12345678"),
                college="Demo University",
                reputation_score=4.1,
                is_verified=True,
            )
            session.add(learner)
            await session.flush()
            wallet = Wallet(
                user_id=learner.id,
                balance=float(settings.INITIAL_WALLET_CREDIT or 0),
                total_earned=float(settings.INITIAL_WALLET_CREDIT or 0),
            )
            session.add(wallet)
            await session.flush()
            if settings.INITIAL_WALLET_CREDIT:
                session.add(Transaction(
                    wallet_id=wallet.id,
                    amount=float(settings.INITIAL_WALLET_CREDIT),
                    transaction_type="credit",
                    description="Welcome bonus",
                    reference_id="welcome_bonus",
                ))
            existing_users[learner.email.lower()] = learner

        existing_session_result = await session.execute(select(LearningSession))
        if existing_session_result.scalars().first() is None and SAMPLE_MENTORS:
            mentor_user = existing_users.get(SAMPLE_MENTORS[0]["email"].lower())
            skill = skill_map.get(SAMPLE_MENTORS[0]["skills"][0][0].lower())
            if mentor_user and learner and skill:
                session.add_all([
                    LearningSession(
                        mentor_id=mentor_user.id,
                        learner_id=learner.id,
                        skill_id=skill.id,
                        status=SessionStatus.confirmed,
                        scheduled_at=datetime.utcnow() + timedelta(days=1),
                        duration_minutes=60,
                        meet_link="https://meet.google.com/demo-session",
                        notes="Demo confirmed session",
                    ),
                    LearningSession(
                        mentor_id=mentor_user.id,
                        learner_id=learner.id,
                        skill_id=skill.id,
                        status=SessionStatus.completed,
                        scheduled_at=datetime.utcnow() - timedelta(days=2),
                        duration_minutes=60,
                        meet_link="https://meet.google.com/demo-completed",
                        notes="Demo completed session",
                    ),
                ])

        # Ensure initial wallet credit for users who have no transactions yet
        if settings.INITIAL_WALLET_CREDIT:
            for user in existing_users.values():
                wallet_result = await session.execute(select(Wallet).where(Wallet.user_id == user.id))
                wallet = wallet_result.scalar_one_or_none()
                if not wallet:
                    wallet = Wallet(
                        user_id=user.id,
                        balance=float(settings.INITIAL_WALLET_CREDIT),
                        total_earned=float(settings.INITIAL_WALLET_CREDIT),
                    )
                    session.add(wallet)
                    await session.flush()
                    session.add(Transaction(
                        wallet_id=wallet.id,
                        amount=float(settings.INITIAL_WALLET_CREDIT),
                        transaction_type="credit",
                        description="Welcome bonus",
                        reference_id="welcome_bonus",
                    ))
                    continue

                txn_result = await session.execute(
                    select(Transaction).where(Transaction.wallet_id == wallet.id)
                )
                has_txn = txn_result.scalars().first() is not None
                if not has_txn and wallet.balance == 0:
                    wallet.balance = float(settings.INITIAL_WALLET_CREDIT)
                    wallet.total_earned = float(settings.INITIAL_WALLET_CREDIT)
                    session.add(Transaction(
                        wallet_id=wallet.id,
                        amount=float(settings.INITIAL_WALLET_CREDIT),
                        transaction_type="credit",
                        description="Welcome bonus",
                        reference_id="welcome_bonus",
                    ))

        await session.commit()

        # Ensure demo admin user exists (avoid duplicate username conflicts)
        admin_email = settings.ADMIN_DEMO_EMAIL.lower()
        admin_user = existing_users.get(admin_email)
        if not admin_user:
            admin_username_result = await session.execute(
                select(User).where(User.username == "admin")
            )
            admin_user = admin_username_result.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                email=settings.ADMIN_DEMO_EMAIL,
                username="admin",
                full_name="TalentConnect Admin",
                hashed_password=get_password_hash(settings.ADMIN_DEMO_PASSWORD),
                college="TalentConnect",
                role=UserRole.admin,
                is_verified=True,
            )
            session.add(admin_user)
            await session.flush()
            wallet = Wallet(
                user_id=admin_user.id,
                balance=float(settings.INITIAL_WALLET_CREDIT or 0),
                total_earned=float(settings.INITIAL_WALLET_CREDIT or 0),
            )
            session.add(wallet)
            await session.flush()
            if settings.INITIAL_WALLET_CREDIT:
                session.add(Transaction(
                    wallet_id=wallet.id,
                    amount=float(settings.INITIAL_WALLET_CREDIT),
                    transaction_type="credit",
                    description="Welcome bonus",
                    reference_id="welcome_bonus",
                ))
        else:
            # Ensure existing admin has admin role and correct email
            admin_user.role = UserRole.admin
            if admin_user.email != settings.ADMIN_DEMO_EMAIL:
                admin_user.email = settings.ADMIN_DEMO_EMAIL
