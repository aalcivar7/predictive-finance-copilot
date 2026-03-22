from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine
from models.models import Base
from routers import auth, dashboard, simulate, goals, insights, transactions, income_streams, plan, wealth

Base.metadata.create_all(bind=engine)

# ── Migrations ─────────────────────────────────────────────────────────────────
from sqlalchemy import text
with engine.connect() as _conn:
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE"))
    _conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))
    _conn.commit()

app = FastAPI(title="Predictive Finance Copilot API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "https://frontend-dun-nine-13.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,           prefix="/auth",           tags=["Auth"])
app.include_router(dashboard.router,      prefix="/dashboard",      tags=["Dashboard"])
app.include_router(simulate.router,       prefix="/simulate",       tags=["Simulator"])
app.include_router(goals.router,          prefix="/goals",          tags=["Goals"])
app.include_router(insights.router,       prefix="/insights",       tags=["Insights"])
app.include_router(transactions.router,   prefix="/transactions",   tags=["Transactions"])
app.include_router(income_streams.router, prefix="/income-streams", tags=["Income Streams"])
app.include_router(plan.router,           prefix="/plan",           tags=["Plan"])
app.include_router(wealth.router,         prefix="/wealth",         tags=["Wealth"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "2.0.0"}
