from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models.models import UserRole, SessionStatus, TaskStatus, SkillLevel, VerificationStatus


# ─── AUTH ────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=200)
    password: str = Field(..., min_length=8)
    college: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=8)

# ─── USER ────────────────────────────────────────────────────
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    avatar_url: Optional[str] = None

class UserPublic(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    bio: Optional[str] = None
    college: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    reputation_score: float
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class UserProfile(UserPublic):
    cancellation_count: int
    fraud_score: float

class AdminRiskUserOut(BaseModel):
    user: UserPublic
    cancellation_count: int
    fraud_score: float
    model_config = {"from_attributes": True}

# ─── SKILL ───────────────────────────────────────────────────
class SkillCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class SkillOut(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    model_config = {"from_attributes": True}

class UserSkillCreate(BaseModel):
    skill_id: Optional[int] = None
    skill_name: Optional[str] = None
    category: Optional[str] = None
    level: SkillLevel
    is_offering: bool = True
    hourly_rate: Optional[float] = None
    years_experience: Optional[float] = None

class UserSkillOut(BaseModel):
    id: int
    skill: SkillOut
    level: SkillLevel
    verification_status: VerificationStatus
    is_offering: bool
    hourly_rate: Optional[float] = None
    years_experience: Optional[float] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class MentorCard(BaseModel):
    user: UserPublic
    user_skill: UserSkillOut
    avg_rating: Optional[float] = None
    total_sessions: int = 0

# ─── SKILL VERIFICATION ──────────────────────────────────────
class VerificationQuestion(BaseModel):
    question: str
    options: List[str]

class VerificationQuizOut(BaseModel):
    user_skill_id: int
    questions: List[VerificationQuestion]

class VerificationSubmit(BaseModel):
    user_skill_id: int
    answers: List[int]  # index of selected option per question

class VerificationResult(BaseModel):
    score: float
    passed: bool
    message: str

# ─── ADMIN / REVIEW ──────────────────────────────────────────
class SkillVerificationAdminOut(BaseModel):
    id: int
    user_skill_id: int
    score: Optional[float] = None
    passed: Optional[bool] = None
    attempted_at: Optional[datetime] = None
    created_at: datetime
    user: UserPublic
    skill: SkillOut
    model_config = {"from_attributes": True}

# ─── LEARNING SESSION ────────────────────────────────────────
class SessionCreate(BaseModel):
    mentor_id: int
    skill_id: int
    scheduled_at: datetime
    duration_minutes: int = Field(default=60, ge=30, le=180)
    notes: Optional[str] = None

class SessionUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class SessionCancel(BaseModel):
    reason: str

class SessionOut(BaseModel):
    id: int
    mentor: UserPublic
    learner: UserPublic
    skill: SkillOut
    status: SessionStatus
    scheduled_at: datetime
    duration_minutes: int
    meet_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class SessionFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class SessionFeedbackOut(BaseModel):
    id: int
    session_id: int
    rating: int
    review: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── TASK MARKETPLACE ────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=300)
    description: str = Field(..., min_length=20)
    subject: str
    budget: float = Field(..., gt=0)
    deadline: datetime
    attachment_url: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[datetime] = None

class TaskOut(BaseModel):
    id: int
    poster: UserPublic
    acceptor: Optional[UserPublic] = None
    title: str
    description: str
    subject: str
    budget: float
    deadline: datetime
    status: TaskStatus
    attachment_url: Optional[str] = None
    is_flagged: bool
    feedback: Optional["TaskFeedbackOut"] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class AdminTaskOut(BaseModel):
    id: int
    poster: UserPublic
    acceptor: Optional[UserPublic] = None
    title: str
    subject: str
    budget: float
    status: TaskStatus
    is_flagged: bool
    created_at: datetime
    payment_status: Optional[str] = None
    payment_order_id: Optional[str] = None
    payment_id: Optional[str] = None
    payment_amount: Optional[float] = None
    model_config = {"from_attributes": True}

class TaskSubmit(BaseModel):
    submission_notes: Optional[str] = None

class TaskFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class TaskFeedbackOut(BaseModel):
    id: int
    task_id: int
    rating: int
    review: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── PAYMENT ─────────────────────────────────────────────────
class PaymentOrderCreate(BaseModel):
    task_id: int

class PaymentOrderOut(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str

class PaymentDemoOut(PaymentOrderOut):
    task_id: int
    task_title: str

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    task_id: int

class WalletPaymentRequest(BaseModel):
    task_id: int

class WalletDebitRequest(BaseModel):
    amount: float
    description: str
    reference_id: Optional[str] = None

# ─── WALLET ──────────────────────────────────────────────────
class WalletOut(BaseModel):
    balance: float
    total_earned: float
    total_spent: float
    model_config = {"from_attributes": True}

class TransactionOut(BaseModel):
    id: int
    amount: float
    transaction_type: str
    description: str
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── AI ──────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str  # user / assistant
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str

class SkillRecommendation(BaseModel):
    skill: SkillOut
    reason: str
    confidence: float

# ─── NOTIFICATION ────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notif_type: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── ADMIN ───────────────────────────────────────────────────
class AdminUserAction(BaseModel):
    reason: Optional[str] = None

class AdminTaskAction(BaseModel):
    reason: str

class FraudLogOut(BaseModel):
    id: int
    user_id: int
    event_type: str
    details: Optional[str]
    severity: str
    is_reviewed: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_sessions: int
    total_tasks: int
    total_skills: int
    completed_sessions: int
    total_revenue: float
    fraud_alerts: int

class AdminUserDetailOut(BaseModel):
    user: UserProfile
    skills: List[UserSkillOut]
    tasks_posted: int
    tasks_accepted: int
    sessions_as_mentor: int
    sessions_as_learner: int
    avg_session_rating: Optional[float] = None
    avg_task_rating: Optional[float] = None
    recent_sessions: List[SessionOut] = []
    recent_tasks: List[TaskOut] = []
