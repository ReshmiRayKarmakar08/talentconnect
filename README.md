# <div align="center"><img src="./frontend/public/favicon.svg" alt="TalentConnect logo" width="72" /></div>

# <div align="center">TalentConnect</div>

<p align="center">
  Intelligent student collaboration and academic support platform
</p>

<p align="center">
  <a href="https://talentconnect-web.vercel.app">Live Frontend</a>
  ·
  <a href="https://talentconnect-backend-qu3k.onrender.com/api/docs">API Docs</a>
  ·
  <a href="https://talentconnect-backend-qu3k.onrender.com/api/health">Backend Health</a>
</p>

## Overview

TalentConnect is a full-stack platform for peer learning, skill exchange, academic task collaboration, session booking, and AI-assisted guidance. Students can build reputation through verified skills, connect with mentors, and manage collaborative academic work from a single dashboard.

## Core Features

- Skill exchange between students who want to teach and learn from each other
- Learning session booking with peer mentors
- Task marketplace for academic help and collaboration
- Wallet and transaction tracking
- AI assistant for study guidance and recommendations
- Admin controls for platform monitoring and moderation

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy Async, Pydantic |
| Database | PostgreSQL |
| Authentication | JWT access and refresh tokens |
| AI/ML | scikit-learn, cosine similarity, recommendation logic |
| Deployment | Vercel frontend, Render backend |

## Project Structure

```text
talentconnect/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── ai/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── styles/
│   │   └── utils/
│   ├── package.json
│   └── vercel.json
└── docker-compose.yml
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

Create a PostgreSQL database and point the backend environment variables to it.

## Environment Variables

Example backend configuration:

```env
APP_NAME=TalentConnect
APP_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/talentconnect
SYNC_DATABASE_URL=postgresql://postgres:password@localhost:5432/talentconnect
FRONTEND_URL=https://talentconnect-web.vercel.app
```

Frontend production configuration:

```env
VITE_API_BASE_URL=https://talentconnect-backend-qu3k.onrender.com/api
```

## Deployment

### Frontend on Vercel

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Required environment variable:

```env
VITE_API_BASE_URL=https://talentconnect-backend-qu3k.onrender.com/api
```

### Backend on Render

- Service Type: Web Service
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Required backend environment variable:

```env
FRONTEND_URL=https://talentconnect-web.vercel.app
```

## API Surface

Main route groups:

- `/api/auth`
- `/api/users`
- `/api/skills`
- `/api/sessions`
- `/api/tasks`
- `/api/payments`
- `/api/ai`
- `/api/admin`

Interactive docs:

- `https://talentconnect-backend-qu3k.onrender.com/api/docs`

## Screenshots

### Landing Page

![Landing Page](./.github/screenshots/landing-page.png)

### Login

![Login](./.github/screenshots/login.png)

### Dashboard

![Dashboard](./.github/screenshots/dashboard.png)

## Roadmap

- Real-time notifications
- File uploads for task submissions
- Calendar integration
- Email notifications
- stronger AI assistant capabilities
- mobile app support
