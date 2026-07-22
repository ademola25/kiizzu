# Ark — Dubai Tenant Cheque Reminder App

A SaaS app that reminds Dubai tenants when their next post-dated rent cheque is due — via WhatsApp, email, and SMS.

## Quick Start

```bash
docker-compose up
```

This starts everything:
- **Frontend** at http://localhost:5173
- **Backend API** at http://localhost:8000/api/v1
- **API docs** at http://localhost:8000/api/v1/docs
- **Django admin** at http://localhost:8000/admin
- PostgreSQL, Redis, Celery worker, Celery beat

## Project Structure

```
tenant-app/
├── ark-backend/                 # Django REST API
│   ├── config/                  # Settings (local, production, test)
│   ├── ark/
│   │   ├── users/               # Auth, profile, JWT
│   │   ├── leases/              # Lease CRUD + schedule generation
│   │   ├── payments/            # PaymentSchedule + status tracking
│   │   ├── reminders/           # Celery task, WhatsApp/Email services
│   │   ├── documents/           # S3 upload/download
│   │   └── billing/             # Stripe checkout + webhooks
│   ├── schedule_engine/         # Standalone calculator (zero Django imports)
│   └── requirements/
├── ark-frontend/                # React + TypeScript + Vite
│   └── src/
│       ├── api/                 # API client + TanStack Query hooks
│       ├── components/          # Layout, ProtectedRoute, StatusBadge
│       ├── features/
│       │   ├── auth/            # Login, Register
│       │   ├── onboarding/      # 4-step wizard
│       │   ├── dashboard/       # CountdownHero, PaymentList
│       │   ├── documents/       # Upload, list, view, delete
│       │   ├── notifications/   # Reminder history
│       │   └── settings/        # Preferences, billing, account
│       └── store/               # Zustand auth store
├── _bmad-output/planning-artifacts/
│   ├── product-brief.md
│   ├── prd.md                   # 42 FRs, 22 NFRs
│   ├── architecture.md
│   ├── ux-design-specification.md
│   ├── ark-wireframes.html      # Open in browser
│   └── epics.md                 # 8 epics, 20 stories
└── docker-compose.yml
```

## Tech Stack

**Backend:** Django 5.2, DRF, SimpleJWT, Celery, Redis, PostgreSQL 16
**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand
**Notifications:** Twilio (WhatsApp), SendGrid (email)
**Storage:** AWS S3 (documents)
**Billing:** Stripe (hosted checkout)

## Running Locally Without Docker

### Backend

```bash
cd ark-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/local.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd ark-frontend
npm install
npm run dev
```

## Tests

```bash
# Backend (43 tests)
cd ark-backend && pytest

# Frontend
cd ark-frontend && npm run build
```

## Environment Variables

Backend `.env` (already created with dev defaults):

```
DJANGO_SECRET_KEY=...
DATABASE_URL=postgres://ark:ark@localhost:5432/ark
CELERY_BROKER_URL=redis://localhost:6379/0

# Optional integrations (work without these for local dev)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
STRIPE_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```
