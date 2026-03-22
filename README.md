# Predictive Finance Copilot

A full-stack personal finance forecasting application that helps users project their net worth, simulate financial scenarios using Monte Carlo methods, track financial goals, and receive AI-driven insights about their financial health.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, Python 3.10+ |
| Database | PostgreSQL |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Charts | Recharts (AreaChart, BarChart) |
| PWA | Web App Manifest, Apple Web App meta tags |

---

## Prerequisites

- **Node.js** 18 or higher
- **Python** 3.10 or higher
- **PostgreSQL** 14 or higher (local install, Docker, or hosted service)

---

## Backend Setup

```bash
# 1. Navigate to the backend directory
cd predictive-finance-copilot/backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy the example environment file and fill in your values
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost/predictive_finance
SECRET_KEY=your-random-secret-key-here-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Generate a secure secret key with:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

```bash
# 5. Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

---

## Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd predictive-finance-copilot/frontend

# 2. Install dependencies
npm install

# 3. Create the local environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 4. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Database Setup

### Option A — Manual (recommended for production)

```bash
# Create the database
createdb predictive_finance

# Run the schema (connects to your DB and creates all tables and indexes)
psql -d predictive_finance -f database/schema.sql
```

### Option B — Auto-create via SQLAlchemy

When the FastAPI server starts, `Base.metadata.create_all(bind=engine)` is called in `main.py`. This automatically creates all tables on the first run if they do not already exist. No manual SQL step required for local development.

---

## Accessing the App

| URL | Description |
|---|---|
| `http://localhost:3000` | Main application (redirects to login) |
| `http://localhost:3000/login` | Sign in page |
| `http://localhost:3000/register` | Create a new account |
| `http://localhost:3000/dashboard` | Financial overview, charts, profile editor |
| `http://localhost:3000/simulator` | Monte Carlo scenario simulator |
| `http://localhost:3000/goals` | Financial goal tracker |
| `http://localhost:3000/insights` | Smart financial insights |
| `http://localhost:8000/docs` | FastAPI interactive API documentation (Swagger UI) |
| `http://localhost:8000/redoc` | FastAPI ReDoc documentation |

---

## PWA Installation

The app ships with a full Web App Manifest (`/public/manifest.json`) and Apple Web App meta tags, making it installable as a Progressive Web App.

**On Desktop (Chrome/Edge):**
1. Open `http://localhost:3000` in Chrome or Edge.
2. Click the install icon in the address bar (or go to browser menu > "Install Predictive Finance Copilot").
3. The app will open in a standalone window without browser chrome.

**On iOS (Safari):**
1. Open the app in Safari.
2. Tap the Share button (box with arrow).
3. Scroll down and tap "Add to Home Screen".
4. Tap "Add" to confirm.

**On Android (Chrome):**
1. Open the app in Chrome.
2. Tap the three-dot menu.
3. Tap "Add to Home screen" or "Install app".

> Note: For full PWA offline support, add a service worker. The manifest and meta tags are already in place.

---

## Deployment

### Frontend — Vercel

```bash
# From the frontend directory
npm run build   # verify build locally first

# Deploy via Vercel CLI or connect your GitHub repo at vercel.com
vercel --prod
```

Set the following environment variable in your Vercel project settings:
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

Also update `allow_origins` in `backend/main.py` to include your Vercel domain:
```python
allow_origins=["http://localhost:3000", "https://your-app.vercel.app"]
```

### Backend — Render or Railway

**Render:**
1. Create a new Web Service.
2. Set the build command: `pip install -r requirements.txt`
3. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `.env.example`.

**Railway:**
1. Connect your GitHub repo.
2. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables via the Railway dashboard.

### Database — Neon or Supabase (Hosted PostgreSQL)

Both Neon (`neon.tech`) and Supabase (`supabase.com`) offer free-tier hosted PostgreSQL:

1. Create a new project and database.
2. Copy the connection string (format: `postgresql://user:password@host/dbname`).
3. Set `DATABASE_URL` to this value in your backend environment.
4. Run `database/schema.sql` via the platform's SQL editor, or let SQLAlchemy auto-create tables on first startup.

---

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI:** `http://localhost:8000/docs` — Try all endpoints directly in the browser.
- **ReDoc:** `http://localhost:8000/redoc` — Clean, readable API reference.

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create a new user account |
| POST | `/auth/login` | Authenticate and receive a JWT token |
| GET | `/auth/me` | Get the current authenticated user |
| GET | `/dashboard` | Get dashboard data with projections |
| PUT | `/dashboard/profile` | Update the user's financial profile |
| POST | `/simulate` | Run a Monte Carlo simulation |
| GET | `/goals` | List all financial goals |
| POST | `/goals` | Create a new goal |
| PUT | `/goals/{id}` | Update a goal |
| DELETE | `/goals/{id}` | Delete a goal |
| GET | `/insights` | Get personalized financial insights |
| GET | `/health` | Health check endpoint |

---

## Project Structure

```
predictive-finance-copilot/
├── backend/
│   ├── core/           # Config, database connection, JWT security
│   ├── models/         # SQLAlchemy ORM models
│   ├── schemas/        # Pydantic request/response schemas
│   ├── routers/        # FastAPI route handlers
│   ├── main.py         # App entrypoint, middleware, route registration
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components and charts
│   ├── lib/            # API client and auth utilities
│   ├── types/          # TypeScript type definitions
│   └── public/         # Static assets and PWA manifest
├── database/
│   └── schema.sql      # PostgreSQL schema with indexes
└── README.md
```
