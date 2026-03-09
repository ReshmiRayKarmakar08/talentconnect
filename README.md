# 🌟 TalentConnect

> An Intelligent Student Collaboration & Academic Support Platform

TalentConnect is a full-stack web application that enables peer-to-peer learning, skill exchange, task-based academic support, and AI-powered guidance — all within a secure, transparent ecosystem.

---

## 🏗 Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| **Backend**   | Python · FastAPI · SQLAlchemy (async) · Alembic |
| **Frontend**  | React 18 · Tailwind CSS · Vite · Zustand        |
| **Database**  | PostgreSQL 16                                   |
| **Auth**      | JWT (access + refresh tokens)                   |
| **Payments**  | Razorpay API                                    |
| **AI/ML**     | Scikit-learn · Cosine Similarity · Co-occurrence |
| **Cache**     | Redis (Celery tasks)                            |
| **DevOps**    | Docker · Docker Compose                         |

---

## 📁 Project Structure

```
talentconnect/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py         # Settings (pydantic-settings)
│   │   │   └── security.py       # JWT, password hashing, guards
│   │   ├── db/
│   │   │   └── session.py        # Async SQLAlchemy engine + session
│   │   ├── models/
│   │   │   └── models.py         # All SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py        # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── user_service.py   # User CRUD + notifications
│   │   │   ├── skill_service.py  # Skills + verification
│   │   │   ├── session_service.py# Learning sessions
│   │   │   ├── task_service.py   # Task marketplace
│   │   │   └── payment_service.py# Razorpay + wallet
│   │   ├── ai/
│   │   │   └── ai_services.py    # Skill matching, recommendations,
│   │   │                         # fraud detection, quiz gen, chatbot
│   │   └── api/routes/
│   │       ├── auth.py           # POST /auth/register, /login, /refresh
│   │       ├── users.py          # GET/PATCH /users
│   │       ├── skills.py         # Skill exchange + verification
│   │       ├── sessions.py       # Learning session management
│   │       ├── tasks.py          # Task marketplace
│   │       ├── payments.py       # Razorpay orders + wallet
│   │       ├── ai.py             # Chatbot + fraud check
│   │       └── admin.py          # System controller (admin only)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Router + protected routes
│   │   ├── store/
│   │   │   └── authStore.js      # Zustand auth state
│   │   ├── utils/
│   │   │   └── api.js            # Axios instance + all API helpers
│   │   ├── components/layout/
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   └── AppLayout.jsx     # Main layout wrapper
│   │   ├── pages/
│   │   │   ├── Auth.jsx          # Login + Register
│   │   │   ├── Dashboard.jsx     # Home dashboard
│   │   │   ├── Skills.jsx        # Skill exchange + verification
│   │   │   ├── Marketplace.jsx   # Task marketplace
│   │   │   ├── Sessions.jsx      # Learning sessions
│   │   │   ├── Wallet.jsx        # Wallet + transactions
│   │   │   ├── AIAssistant.jsx   # AI chatbot
│   │   │   └── Admin.jsx         # System controller panel
│   │   └── styles/
│   │       └── globals.css       # Tailwind + custom design tokens
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## 🚀 Getting Started

This project can be deployed with **Vercel** for the frontend and **Render** for the backend.

### Frontend on Vercel

Use these settings when importing the repo into Vercel:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Set this environment variable in Vercel before deploying:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
```

This repo includes [`frontend/vercel.json`](/d:/Desktop/talentconnect/frontend/vercel.json) so direct refreshes on routes like `/dashboard` and `/skills` resolve correctly in Vercel.

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone and enter project
cd talentconnect

# 2. Copy and configure backend env
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 3. Start everything
docker compose up --build

# App runs at:
# Frontend → http://localhost:5173
# Backend API → http://localhost:8000/api/docs
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL URL and API keys

# Run (auto-creates tables on startup)
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**PostgreSQL:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE talentconnect;"
```

---

## 🔑 Environment Variables

```env
# backend/.env

DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/talentconnect
SECRET_KEY=your-super-secret-key
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
OPENAI_API_KEY=sk-xxxx          # Optional (for enhanced chatbot)
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Endpoints

| Method | Endpoint                          | Description                     |
|--------|-----------------------------------|---------------------------------|
| POST   | `/api/auth/register`              | Register new student            |
| POST   | `/api/auth/login`                 | Get JWT tokens                  |
| GET    | `/api/auth/me`                    | Current user info               |
| GET    | `/api/skills/`                    | List all skills                 |
| POST   | `/api/skills/my`                  | Add skill to profile            |
| GET    | `/api/skills/mentors/{skill_id}`  | AI-ranked mentors for skill     |
| GET    | `/api/skills/verify/{id}/quiz`    | Get verification quiz           |
| POST   | `/api/skills/verify/submit`       | Submit quiz answers             |
| GET    | `/api/skills/recommendations`     | AI skill recommendations        |
| POST   | `/api/sessions/`                  | Book learning session           |
| POST   | `/api/sessions/{id}/confirm`      | Mentor confirms session         |
| POST   | `/api/sessions/{id}/complete`     | Mark session complete           |
| POST   | `/api/sessions/{id}/feedback`     | Learner leaves rating/review    |
| GET    | `/api/tasks/`                     | Browse open tasks               |
| POST   | `/api/tasks/`                     | Post a new task                 |
| POST   | `/api/tasks/{id}/accept`          | Accept a task                   |
| POST   | `/api/tasks/{id}/complete`        | Release payment                 |
| POST   | `/api/payments/order`             | Create Razorpay order           |
| POST   | `/api/payments/verify`            | Verify payment signature        |
| POST   | `/api/ai/chat`                    | AI chatbot message              |
| GET    | `/api/admin/stats`                | Platform statistics (admin)     |
| POST   | `/api/admin/users/{id}/ban`       | Ban user (admin)                |

Full interactive docs: **http://localhost:8000/api/docs**

---

## 🤖 AI Features

| Feature | Implementation |
|---------|---------------|
| **Smart Skill Matching** | Cosine similarity on skill tag vectors |
| **Skill Recommendations** | Co-occurrence graph analysis |
| **Fraud Detection** | Behavioral analytics (cancellation rate, reputation score) |
| **Skill Verification** | Auto-generated quizzes per skill (70% pass threshold) |
| **AI Chatbot** | Rule-based NLP with roadmaps for DSA, Web Dev, ML, Flutter |

---

## 👤 User Roles

| Role | Permissions |
|------|------------|
| **Student** | List skills, book sessions, post/accept tasks, use chatbot |
| **Admin** | All student permissions + ban users, flag tasks, view fraud logs, platform stats |

To create an admin user, update the `role` field in the database directly:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 🗄 Database Models

- `users` – Profiles, roles, reputation, fraud score
- `skills` – Skill catalog with categories and tags
- `user_skills` – Skills claimed by users with verification status
- `skill_verifications` – Quiz questions, answers, scores
- `learning_sessions` – Booked sessions with meet links
- `session_feedbacks` – Ratings and reviews per session
- `tasks` – Task marketplace listings
- `task_feedbacks` – Task completion ratings
- `payments` – Razorpay order/payment records
- `wallets` – Per-user balance and totals
- `transactions` – Credit/debit ledger
- `notifications` – In-app notification system
- `fraud_logs` – Behavioral anomaly records

---

## 📸 Screenshots
> Frontend runs on dark mode with a custom deep-navy + indigo design system

- **Dashboard** — Stats, session summary, AI recommendations
- **Skills Exchange** — Browse skills by category, view AI-ranked mentors, verification quiz
- **Task Marketplace** — Post/accept tasks with secure payment flow
- **Sessions** — Confirm, cancel, complete with Google Meet links
- **AI Assistant** — Conversational learning guidance with suggested prompts
- **Admin Panel** — User management, task flagging, fraud log review

---

## 🛣 Roadmap

- [ ] WebSocket real-time notifications
- [ ] File upload for task submissions (S3/Cloudinary)
- [ ] Google Calendar integration for session scheduling
- [ ] Email notifications via SMTP
- [ ] OpenAI-powered chatbot upgrade
- [ ] Mobile app (React Native)
