"""
Simple PostgreSQL connection for Production V1
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base

# Load from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/ml_analytics')

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True  # Verify connections before use
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(SessionLocal)

# Base for models
Base = declarative_base()

def get_db():
    """Get database session (for dependency injection)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database (create tables if needed)"""
    from database.models import User, AuthNonce, Upload, Forecast, AuditLog
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")
