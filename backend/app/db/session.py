from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from uuid import uuid4
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    },
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
        "email": "aarav.sharma.dev@gmail.com",
        "username": "aarav_sharma",
        "full_name": "Aarav Sharma",
        "college": "IIT Delhi",
        "bio": "Full-stack engineer & Python specialist. 3+ years experience mentoring students in backend architectures and machine learning basics.",
        "reputation_score": 4.9,
        "skills": [
            ("Python", "advanced", 450),
            ("FastAPI", "advanced", 550),
            ("Django", "advanced", 500),
            ("Git & GitHub", "intermediate", 350),
            ("Docker", "intermediate", 450),
            ("Data Science", "intermediate", 500),
            ("NumPy", "intermediate", 350),
        ],
    },
    {
        "email": "riya.verma.code@gmail.com",
        "username": "riya_verma",
        "full_name": "Riya Verma",
        "college": "NSUT Delhi",
        "bio": "Frontend developer specializing in React, Next.js, and sleek UI engineering with Tailwind CSS.",
        "reputation_score": 4.8,
        "skills": [
            ("React", "advanced", 550),
            ("Next.js", "advanced", 600),
            ("JavaScript", "advanced", 400),
            ("TypeScript", "advanced", 500),
            ("HTML", "advanced", 250),
            ("CSS", "advanced", 250),
            ("Tailwind CSS", "advanced", 350),
            ("UI/UX Design", "intermediate", 450),
            ("Figma", "intermediate", 400),
        ],
    },
    {
        "email": "kabir.singh.tech@gmail.com",
        "username": "kabir_singh",
        "full_name": "Kabir Singh",
        "college": "NIT Trichy",
        "bio": "Competitive programmer & DSA mentor. 1000+ problems solved on LeetCode/Codeforces with focus on graph theory and dynamic programming.",
        "reputation_score": 4.9,
        "skills": [
            ("Data Structures", "advanced", 600),
            ("Algorithms", "advanced", 650),
            ("C++", "advanced", 500),
            ("Java", "advanced", 500),
            ("DBMS", "intermediate", 400),
            ("Android Development", "intermediate", 450),
        ],
    },
    {
        "email": "ananya.patel.ai@gmail.com",
        "username": "ananya_patel",
        "full_name": "Ananya Patel",
        "college": "BITS Pilani",
        "bio": "AI & Deep Learning researcher. Mentoring students in neural network architectures, computer vision, and data analysis pipelines.",
        "reputation_score": 4.8,
        "skills": [
            ("Machine Learning", "advanced", 650),
            ("Deep Learning", "advanced", 750),
            ("Data Science", "advanced", 600),
            ("Pandas", "advanced", 400),
            ("NumPy", "advanced", 400),
            ("Python", "advanced", 450),
        ],
    },
    {
        "email": "rohan.iyer.cloud@gmail.com",
        "username": "rohan_iyer",
        "full_name": "Rohan Iyer",
        "college": "IIT Bombay",
        "bio": "Cloud architect & DevOps enthusiast. Guiding students in AWS cloud services, containerization, and modern backend infrastructure.",
        "reputation_score": 4.7,
        "skills": [
            ("AWS", "advanced", 650),
            ("Docker", "advanced", 550),
            ("Node.js", "advanced", 500),
            ("PostgreSQL", "advanced", 450),
            ("Git & GitHub", "advanced", 400),
            ("FastAPI", "intermediate", 450),
            ("Computer Networks", "intermediate", 400),
        ],
    },
    {
        "email": "neha.gupta.design@gmail.com",
        "username": "neha_gupta",
        "full_name": "Neha Gupta",
        "college": "DTU Delhi",
        "bio": "UI/UX & Product Designer. Passionate about design systems, Figma workflows, accessible user interfaces, and responsive web aesthetics.",
        "reputation_score": 4.9,
        "skills": [
            ("UI/UX Design", "advanced", 500),
            ("Figma", "advanced", 500),
            ("HTML", "intermediate", 300),
            ("CSS", "intermediate", 300),
            ("Tailwind CSS", "intermediate", 350),
        ],
    },
    {
        "email": "aditya.kumar.db@gmail.com",
        "username": "aditya_kumar",
        "full_name": "Aditya Kumar",
        "college": "IIIT Hyderabad",
        "bio": "Database administrator and backend developer. Expert in query optimization, indexing, distributed SQL, and MongoDB schemas.",
        "reputation_score": 4.8,
        "skills": [
            ("SQL", "advanced", 450),
            ("PostgreSQL", "advanced", 500),
            ("MongoDB", "advanced", 500),
            ("DBMS", "advanced", 450),
            ("Operating Systems", "intermediate", 400),
            ("Django", "intermediate", 450),
            ("Power BI", "intermediate", 400),
        ],
    },
    {
        "email": "priya.nair.app@gmail.com",
        "username": "priya_nair",
        "full_name": "Priya Nair",
        "college": "VIT Vellore",
        "bio": "Mobile app engineer with published Flutter and native Android applications on Google Play Store.",
        "reputation_score": 4.7,
        "skills": [
            ("Flutter", "advanced", 550),
            ("Android Development", "advanced", 550),
            ("Java", "intermediate", 400),
            ("JavaScript", "intermediate", 350),
            ("Excel", "intermediate", 300),
        ],
    },
    {
        "email": "siddharth.joshi.core@gmail.com",
        "username": "siddharth_joshi",
        "full_name": "Siddharth Joshi",
        "college": "IIT Roorkee",
        "bio": "Core computer science mentor focusing on low-level systems, Operating Systems internals, Computer Networks, and C++ performance.",
        "reputation_score": 4.8,
        "skills": [
            ("Computer Networks", "advanced", 450),
            ("Operating Systems", "advanced", 500),
            ("Data Structures", "advanced", 550),
            ("C++", "advanced", 450),
            ("Algorithms", "intermediate", 500),
            ("AWS", "intermediate", 500),
        ],
    },
    {
        "email": "sneha.reddy.data@gmail.com",
        "username": "sneha_reddy",
        "full_name": "Sneha Reddy",
        "college": "IIT Madras",
        "bio": "Business intelligence consultant and data analyst. Specializes in Power BI enterprise dashboards, advanced Excel models, and SQL analytics.",
        "reputation_score": 4.8,
        "skills": [
            ("Power BI", "advanced", 450),
            ("Excel", "advanced", 350),
            ("SQL", "intermediate", 400),
            ("Data Science", "intermediate", 500),
            ("Pandas", "intermediate", 350),
            ("Deep Learning", "intermediate", 600),
        ],
    },
    {
        "email": "vikram.malhotra.dev@gmail.com",
        "username": "vikram_malhotra",
        "full_name": "Vikram Malhotra",
        "college": "Thapar University",
        "bio": "Full-stack JavaScript engineer. Expert in Next.js App Router, SSR, RESTful APIs with Node.js, and full-stack TypeScript apps.",
        "reputation_score": 4.7,
        "skills": [
            ("Next.js", "advanced", 550),
            ("Node.js", "advanced", 500),
            ("TypeScript", "intermediate", 450),
            ("React", "intermediate", 450),
            ("MongoDB", "intermediate", 400),
            ("Flutter", "intermediate", 450),
        ],
    },
]

SAMPLE_TASKS = [
    {
        "title": "Debug Python sorting assignment",
        "description": "Need help optimizing a sorting assignment with time complexity explanation and quicksort implementation.",
        "subject": "Data Structures",
        "budget": 150,
        "deadline_days": 3,
        "poster_email": "rahul.verma.student@gmail.com",
    },
    {
        "title": "Create Next.js landing page with Tailwind",
        "description": "Build a responsive landing page with Next.js, modern dark mode, and reusable UI components.",
        "subject": "Web Development",
        "budget": 350,
        "deadline_days": 5,
        "poster_email": "riya.verma.code@gmail.com",
    },
    {
        "title": "SQL query practice set & index optimization",
        "description": "Need guidance writing multi-table JOINs, subqueries, and optimizing indexes on PostgreSQL database.",
        "subject": "Database",
        "budget": 200,
        "deadline_days": 4,
        "poster_email": "rahul.verma.student@gmail.com",
    },
    {
        "title": "Design a Figma UI kit for student dashboard",
        "description": "Create a clean, accessible UI design system in Figma with buttons, cards, modal dialogs, and navigation.",
        "subject": "UI/UX Design",
        "budget": 250,
        "deadline_days": 6,
        "poster_email": "neha.gupta.design@gmail.com",
    },
    {
        "title": "Build a Node.js REST API with JWT Auth",
        "description": "Need a clean Express/Node.js starter project with JWT authentication, middleware, and MongoDB integration.",
        "subject": "Web Development",
        "budget": 300,
        "deadline_days": 5,
        "poster_email": "vikram.malhotra.dev@gmail.com",
    },
    {
        "title": "Pandas data cleanup & visualization for analytics",
        "description": "Clean CSV dataset with missing values, format dates, and generate summary charts using Pandas and Matplotlib.",
        "subject": "Data Science",
        "budget": 180,
        "deadline_days": 3,
        "poster_email": "sneha.reddy.data@gmail.com",
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
        from app.models.models import (
            Skill, User, UserSkill, VerificationStatus, SkillLevel,
            Wallet, Transaction, Task, UserRole, LearningSession,
            SessionStatus, SessionFeedback, TaskStatus
        )
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

        # Migrate old demo users with @example.com to authentic Indian @gmail.com users
        legacy_migrations = {
            "mentor.python@example.com": {
                "email": "aarav.sharma.dev@gmail.com",
                "username": "aarav_sharma",
                "full_name": "Aarav Sharma",
                "college": "IIT Delhi",
            },
            "mentor.web@example.com": {
                "email": "riya.verma.code@gmail.com",
                "username": "riya_verma",
                "full_name": "Riya Verma",
                "college": "NSUT Delhi",
            },
            "mentor.dsa@example.com": {
                "email": "kabir.singh.tech@gmail.com",
                "username": "kabir_singh",
                "full_name": "Kabir Singh",
                "college": "NIT Trichy",
            },
            "learner.demo@example.com": {
                "email": "rahul.verma.student@gmail.com",
                "username": "rahul_verma",
                "full_name": "Rahul Verma",
                "college": "Delhi Technological University",
            },
        }
        for old_email, new_data in legacy_migrations.items():
            old_user = existing_users.get(old_email.lower())
            target_user = existing_users.get(new_data["email"].lower())
            if old_user and not target_user:
                old_user.email = new_data["email"]
                old_user.username = new_data["username"]
                old_user.full_name = new_data["full_name"]
                old_user.college = new_data["college"]
                old_user.is_verified = True
                existing_users[new_data["email"].lower()] = old_user
                del existing_users[old_email.lower()]
            elif old_user and target_user and old_user.id != target_user.id:
                old_user.email = f"archived_{old_user.id}@gmail.com"

        # Update any remaining @example.com accounts to @gmail.com
        for u in existing_users.values():
            if u.email.endswith("@example.com"):
                prefix = u.email.split("@")[0].replace(".", "_")
                u.email = f"{prefix}.tc@gmail.com"

        # Seed/update all mentors and their skills
        for mentor_data in SAMPLE_MENTORS:
            mentor = existing_users.get(mentor_data["email"].lower())
            if not mentor:
                mentor = User(
                    email=mentor_data["email"],
                    username=mentor_data["username"],
                    full_name=mentor_data["full_name"],
                    hashed_password=get_password_hash("12345678"),
                    college=mentor_data["college"],
                    bio=mentor_data.get("bio"),
                    reputation_score=mentor_data["reputation_score"],
                    is_verified=True,
                )
                session.add(mentor)
                await session.flush()
                wallet = Wallet(
                    user_id=mentor.id,
                    balance=float(settings.INITIAL_WALLET_CREDIT or 50),
                    total_earned=float(settings.INITIAL_WALLET_CREDIT or 50),
                )
                session.add(wallet)
                await session.flush()
                session.add(Transaction(
                    wallet_id=wallet.id,
                    amount=float(settings.INITIAL_WALLET_CREDIT or 50),
                    transaction_type="credit",
                    description="Welcome bonus",
                    reference_id="welcome_bonus",
                ))
                existing_users[mentor.email.lower()] = mentor
            else:
                mentor.reputation_score = mentor_data["reputation_score"]
                mentor.is_verified = True
                if mentor_data.get("bio") and not mentor.bio:
                    mentor.bio = mentor_data.get("bio")

            existing_user_skill_result = await session.execute(
                select(UserSkill).where(UserSkill.user_id == mentor.id)
            )
            existing_user_skills = {
                user_skill.skill_id: user_skill for user_skill in existing_user_skill_result.scalars().all()
            }

            for skill_name, level, hourly_rate in mentor_data["skills"]:
                skill = skill_map.get(skill_name.lower())
                if not skill:
                    continue

                if skill.id in existing_user_skills:
                    existing_skill = existing_user_skills[skill.id]
                    existing_skill.is_offering = True
                    existing_skill.verification_status = VerificationStatus.verified
                    if not existing_skill.hourly_rate:
                        existing_skill.hourly_rate = float(hourly_rate)
                else:
                    session.add(
                        UserSkill(
                            user_id=mentor.id,
                            skill_id=skill.id,
                            level=SkillLevel(level),
                            verification_status=VerificationStatus.verified,
                            is_offering=True,
                            hourly_rate=float(hourly_rate),
                            years_experience=2.0 if level == "intermediate" else 4.0,
                        )
                    )

        await session.flush()

        # GUARANTEE: Ensure EVERY skill in the database has at least 2 active offering mentors
        all_skills_query = await session.execute(select(Skill))
        all_db_skills = all_skills_query.scalars().all()
        active_mentor_candidates = [
            u for u in existing_users.values()
            if u.role == UserRole.student and u.is_active and u.email.endswith("@gmail.com")
        ]

        if active_mentor_candidates:
            for db_skill in all_db_skills:
                offering_query = await session.execute(
                    select(UserSkill).where(
                        UserSkill.skill_id == db_skill.id,
                        UserSkill.is_offering == True,
                    )
                )
                existing_offerings = offering_query.scalars().all()
                existing_offering_user_ids = {o.user_id for o in existing_offerings}

                # If less than 2 mentors offering this skill, assign from candidate pool
                needed = 2 - len(existing_offerings)
                if needed > 0:
                    added_count = 0
                    for candidate in active_mentor_candidates:
                        if candidate.id not in existing_offering_user_ids:
                            us_check = await session.execute(
                                select(UserSkill).where(
                                    UserSkill.user_id == candidate.id,
                                    UserSkill.skill_id == db_skill.id,
                                )
                            )
                            existing_row = us_check.scalar_one_or_none()
                            if existing_row:
                                existing_row.is_offering = True
                                existing_row.verification_status = VerificationStatus.verified
                                if not existing_row.hourly_rate:
                                    existing_row.hourly_rate = 450.0
                            else:
                                session.add(
                                    UserSkill(
                                        user_id=candidate.id,
                                        skill_id=db_skill.id,
                                        level=SkillLevel.advanced,
                                        verification_status=VerificationStatus.verified,
                                        is_offering=True,
                                        hourly_rate=450.0,
                                        years_experience=3.0,
                                    )
                                )
                            existing_offering_user_ids.add(candidate.id)
                            added_count += 1
                            if added_count >= needed:
                                break

        await session.flush()

        # Seed sample learner (Rahul Verma)
        learner_email = "rahul.verma.student@gmail.com"
        learner = existing_users.get(learner_email)
        if not learner:
            learner = User(
                email=learner_email,
                username="rahul_verma",
                full_name="Rahul Verma",
                hashed_password=get_password_hash("12345678"),
                college="Delhi Technological University",
                bio="Computer Science student passionate about full-stack web development and competitive programming.",
                reputation_score=4.5,
                is_verified=True,
            )
            session.add(learner)
            await session.flush()
            wallet = Wallet(
                user_id=learner.id,
                balance=float(settings.INITIAL_WALLET_CREDIT or 50),
                total_earned=float(settings.INITIAL_WALLET_CREDIT or 50),
            )
            session.add(wallet)
            await session.flush()
            session.add(Transaction(
                wallet_id=wallet.id,
                amount=float(settings.INITIAL_WALLET_CREDIT or 50),
                transaction_type="credit",
                description="Welcome bonus",
                reference_id="welcome_bonus",
            ))
            existing_users[learner.email.lower()] = learner

        # Seed sample marketplace tasks
        existing_task_result = await session.execute(select(Task))
        if existing_task_result.scalars().first() is None:
            tasks = []
            for item in SAMPLE_TASKS:
                poster = existing_users.get(item.get("poster_email", "").lower()) or learner or next(iter(existing_users.values()))
                tasks.append(Task(
                    poster_id=poster.id,
                    title=item["title"],
                    description=item["description"],
                    subject=item["subject"],
                    budget=item["budget"],
                    deadline=datetime.utcnow() + timedelta(days=item["deadline_days"]),
                    status=TaskStatus.open,
                ))
            session.add_all(tasks)

        # Seed sample learning sessions and reviews
        existing_session_result = await session.execute(select(LearningSession))
        if existing_session_result.scalars().first() is None and len(SAMPLE_MENTORS) >= 2:
            mentor1 = existing_users.get("aarav.sharma.dev@gmail.com")
            mentor2 = existing_users.get("riya.verma.code@gmail.com")
            skill_python = skill_map.get("python")
            skill_react = skill_map.get("react")

            if mentor1 and learner and skill_python:
                s1 = LearningSession(
                    mentor_id=mentor1.id,
                    learner_id=learner.id,
                    skill_id=skill_python.id,
                    status=SessionStatus.completed,
                    scheduled_at=datetime.utcnow() - timedelta(days=2),
                    duration_minutes=60,
                    meet_link="https://meet.google.com/tc-aarav-demo",
                    notes="Python asynchronous programming & FastAPI structure",
                )
                session.add(s1)
                await session.flush()
                session.add(SessionFeedback(
                    session_id=s1.id,
                    rating=5,
                    review="Incredible mentor! Clarified all my doubts about async FastAPI in just one hour.",
                ))

            if mentor2 and learner and skill_react:
                s2 = LearningSession(
                    mentor_id=mentor2.id,
                    learner_id=learner.id,
                    skill_id=skill_react.id,
                    status=SessionStatus.confirmed,
                    scheduled_at=datetime.utcnow() + timedelta(days=1),
                    duration_minutes=60,
                    meet_link="https://meet.google.com/tc-riya-demo",
                    notes="React state management and custom hooks best practices",
                )
                session.add(s2)

        # Ensure initial wallet credit is normalized to target_bonus (₹50) for all users in DB
        target_bonus = float(settings.INITIAL_WALLET_CREDIT or 50)
        
        # Clean up any test withdrawals executed against the previous 1000 balance
        test_withdrawals = await session.execute(
            select(Transaction).where(
                Transaction.transaction_type == "debit",
                (Transaction.reference_id.ilike("withdraw_%")) | (Transaction.description.ilike("%withdrawal%")),
            )
        )
        for tw in test_withdrawals.scalars().all():
            await session.delete(tw)

        # Remove obsolete welcome bonus topup records
        obsolete_topups = await session.execute(
            select(Transaction).where(Transaction.reference_id.ilike("welcome_bonus_topup_%"))
        )
        for t in obsolete_topups.scalars().all():
            await session.delete(t)

        await session.flush()

        # Ensure every existing user has a wallet and exactly one ₹50 welcome bonus
        all_users = (await session.execute(select(User))).scalars().all()
        for u in all_users:
            w_res = await session.execute(select(Wallet).where(Wallet.user_id == u.id))
            w = w_res.scalar_one_or_none()
            if not w:
                w = Wallet(
                    user_id=u.id,
                    balance=target_bonus,
                    total_earned=target_bonus,
                    total_spent=0.0,
                )
                session.add(w)
                await session.flush()
                session.add(Transaction(
                    wallet_id=w.id,
                    amount=target_bonus,
                    transaction_type="credit",
                    description="Welcome bonus",
                    reference_id="welcome_bonus",
                ))
            else:
                # Check for existing welcome bonus transaction
                wb_tx_res = await session.execute(
                    select(Transaction).where(
                        Transaction.wallet_id == w.id,
                        Transaction.transaction_type == "credit",
                        (Transaction.reference_id == "welcome_bonus") | (Transaction.description.ilike("%welcome bonus%")),
                    )
                )
                wb_txs = wb_tx_res.scalars().all()
                if not wb_txs:
                    session.add(Transaction(
                        wallet_id=w.id,
                        amount=target_bonus,
                        transaction_type="credit",
                        description="Welcome bonus",
                        reference_id="welcome_bonus",
                    ))
                else:
                    wb_txs[0].amount = target_bonus
                    wb_txs[0].description = "Welcome bonus"
                    wb_txs[0].reference_id = "welcome_bonus"
                    for duplicate_wb in wb_txs[1:]:
                        await session.delete(duplicate_wb)

        await session.flush()

        # Recalculate all wallet balances from actual transactions
        all_wallets = (await session.execute(select(Wallet))).scalars().all()
        for w in all_wallets:
            w_txns = (await session.execute(select(Transaction).where(Transaction.wallet_id == w.id))).scalars().all()
            total_credits = sum(t.amount for t in w_txns if t.transaction_type == "credit")
            total_debits = sum(t.amount for t in w_txns if t.transaction_type == "debit")
            w.total_earned = total_credits
            w.total_spent = total_debits
            w.balance = max(0.0, total_credits - total_debits)

        await session.commit()

        # Ensure demo admin user exists (email-only admin)
        admin_email = settings.ADMIN_DEMO_EMAIL.lower()
        admin_user = existing_users.get(admin_email)

        # Resolve username conflicts: if someone else is using "admin", rename them
        conflict_result = await session.execute(
            select(User).where(User.username == "admin", User.email != settings.ADMIN_DEMO_EMAIL)
        )
        conflict_user = conflict_result.scalar_one_or_none()
        if conflict_user:
            conflict_user.username = f"admin_user_{conflict_user.id}"
            conflict_user.role = UserRole.student

        if not admin_user:
            admin_user = User(
                email=settings.ADMIN_DEMO_EMAIL,
                username="admin",
                full_name="Admin",
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
            # Ensure existing admin has admin role, correct username/email/password
            admin_user.role = UserRole.admin
            admin_user.username = "admin"
            admin_user.full_name = "Admin"
            if admin_user.email != settings.ADMIN_DEMO_EMAIL:
                admin_user.email = settings.ADMIN_DEMO_EMAIL
            admin_user.hashed_password = get_password_hash(settings.ADMIN_DEMO_PASSWORD)

        # Enforce single-admin rule (only admin email stays admin)
        await session.execute(
            User.__table__.update()
            .where(User.email != settings.ADMIN_DEMO_EMAIL)
            .values(role=UserRole.student)
        )
        await session.commit()
