from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from core.config import settings

engine = create_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1),
    poolclass=NullPool,  # Neon serverless: fresh connection per request, no stale SSL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
