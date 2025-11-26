"""
SQLAlchemy models for Production V1
"""
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database.connection import Base
import uuid

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address = Column(String(66), unique=True, nullable=False, index=True)
    display_name = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    last_login_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

class AuthNonce(Base):
    __tablename__ = 'auth_nonces'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address = Column(String(66), nullable=False, index=True)
    nonce = Column(String(255), unique=True, nullable=False, index=True)
    message = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Upload(Base):
    __tablename__ = 'uploads'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    original_filename = Column(String(500), nullable=False)
    storage_path = Column(Text, nullable=False)
    file_size_bytes = Column(BigInteger)
    column_mapping = Column(JSONB)
    row_count = Column(Integer)
    created_at = Column(DateTime, server_default=func.now(), index=True)

class Forecast(Base):
    __tablename__ = 'forecasts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    upload_id = Column(UUID(as_uuid=True), ForeignKey('uploads.id', ondelete='CASCADE'))
    params = Column(JSONB)
    results = Column(JSONB)
    processing_time_seconds = Column(Integer)
    created_at = Column(DateTime, server_default=func.now(), index=True)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    action = Column(String(100), nullable=False, index=True)
    metadata = Column(JSONB)
    ip_address = Column(String(45))
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    @classmethod
    def log(cls, user_id, action, metadata=None, ip_address=None):
        """Helper to create audit log entry"""
        from database.connection import db_session
        log = cls(
            user_id=user_id,
            action=action,
            metadata=metadata,
            ip_address=ip_address
        )
        db_session.add(log)
        db_session.commit()
        return log
