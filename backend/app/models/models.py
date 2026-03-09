from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Integer, String, Text, Boolean, Float, DateTime, ForeignKey,
    Enum, JSON, BigInteger
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class SessionStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class TaskStatus(str, enum.Enum):
    open = "open"
    assigned = "assigned"
    submitted = "submitted"
    completed = "completed"
    disputed = "disputed"
    flagged = "flagged"


class SkillLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


# ─────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.student)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    college: Mapped[Optional[str]] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    reputation_score: Mapped[float] = mapped_column(Float, default=0.0)
    fraud_score: Mapped[float] = mapped_column(Float, default=0.0)
    cancellation_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills: Mapped[List["UserSkill"]] = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    mentor_sessions: Mapped[List["LearningSession"]] = relationship("LearningSession", foreign_keys="LearningSession.mentor_id", back_populates="mentor")
    learner_sessions: Mapped[List["LearningSession"]] = relationship("LearningSession", foreign_keys="LearningSession.learner_id", back_populates="learner")
    posted_tasks: Mapped[List["Task"]] = relationship("Task", foreign_keys="Task.poster_id", back_populates="poster")
    accepted_tasks: Mapped[List["Task"]] = relationship("Task", foreign_keys="Task.acceptor_id", back_populates="acceptor")
    wallet: Mapped[Optional["Wallet"]] = relationship("Wallet", back_populates="user", uselist=False)
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


# ─────────────────────────────────────────────
# SKILL
# ─────────────────────────────────────────────
class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[list]] = mapped_column(JSON)
    icon: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user_skills: Mapped[List["UserSkill"]] = relationship("UserSkill", back_populates="skill")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    level: Mapped[SkillLevel] = mapped_column(Enum(SkillLevel), default=SkillLevel.beginner)
    verification_status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), default=VerificationStatus.pending)
    is_offering: Mapped[bool] = mapped_column(Boolean, default=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float)
    years_experience: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_skills")
    verification: Mapped[Optional["SkillVerification"]] = relationship("SkillVerification", back_populates="user_skill", uselist=False)


# ─────────────────────────────────────────────
# SKILL VERIFICATION
# ─────────────────────────────────────────────
class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_skills.id", ondelete="CASCADE"), unique=True)
    questions: Mapped[list] = mapped_column(JSON)        # [{q, options, answer}]
    user_answers: Mapped[Optional[list]] = mapped_column(JSON)
    score: Mapped[Optional[float]] = mapped_column(Float)
    passed: Mapped[Optional[bool]] = mapped_column(Boolean)
    attempted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user_skill: Mapped["UserSkill"] = relationship("UserSkill", back_populates="verification")


# ─────────────────────────────────────────────
# LEARNING SESSION
# ─────────────────────────────────────────────
class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mentor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    learner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id"), nullable=False)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.pending)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    meet_link: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text)
    cancelled_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mentor: Mapped["User"] = relationship("User", foreign_keys=[mentor_id], back_populates="mentor_sessions")
    learner: Mapped["User"] = relationship("User", foreign_keys=[learner_id], back_populates="learner_sessions")
    skill: Mapped["Skill"] = relationship("Skill")
    feedback: Mapped[Optional["SessionFeedback"]] = relationship("SessionFeedback", back_populates="session", uselist=False)


class SessionFeedback(Base):
    __tablename__ = "session_feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("learning_sessions.id", ondelete="CASCADE"), unique=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    review: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["LearningSession"] = relationship("LearningSession", back_populates="feedback")


# ─────────────────────────────────────────────
# TASK MARKETPLACE
# ─────────────────────────────────────────────
class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    poster_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    acceptor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.open)
    attachment_url: Mapped[Optional[str]] = mapped_column(String(500))
    submission_url: Mapped[Optional[str]] = mapped_column(String(500))
    submission_notes: Mapped[Optional[str]] = mapped_column(Text)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    poster: Mapped["User"] = relationship("User", foreign_keys=[poster_id], back_populates="posted_tasks")
    acceptor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[acceptor_id], back_populates="accepted_tasks")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="task", uselist=False)
    feedback: Mapped[Optional["TaskFeedback"]] = relationship("TaskFeedback", back_populates="task", uselist=False)


class TaskFeedback(Base):
    __tablename__ = "task_feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), unique=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    review: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="feedback")


# ─────────────────────────────────────────────
# PAYMENT & WALLET
# ─────────────────────────────────────────────
class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    total_earned: Mapped[float] = mapped_column(Float, default=0.0)
    total_spent: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="wallet")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="wallet")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"), unique=True)
    razorpay_order_id: Mapped[Optional[str]] = mapped_column(String(200))
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(200))
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="payment")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    wallet_id: Mapped[int] = mapped_column(Integer, ForeignKey("wallets.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(50))  # credit / debit
    description: Mapped[str] = mapped_column(String(300))
    reference_id: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="transactions")


# ─────────────────────────────────────────────
# NOTIFICATION
# ─────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notif_type: Mapped[str] = mapped_column(String(50))  # session, task, payment, system, fraud
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    extra_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="notifications")


# ─────────────────────────────────────────────
# FRAUD / AUDIT LOG
# ─────────────────────────────────────────────
class FraudLog(Base):
    __tablename__ = "fraud_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100))   # cancellation, suspicious_activity, etc.
    details: Mapped[Optional[str]] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default="low")  # low / medium / high
    is_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
