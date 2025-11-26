-- Minimal Production V1 Database Schema
-- Run this once to initialize the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (one per wallet)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(66) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Auth nonces (for wallet signature challenge)
CREATE TABLE auth_nonces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(66) NOT NULL,
    nonce VARCHAR(255) NOT NULL UNIQUE,
    message TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nonces_wallet ON auth_nonces(wallet_address);
CREATE INDEX idx_nonces_nonce ON auth_nonces(nonce);
CREATE INDEX idx_nonces_expires ON auth_nonces(expires_at);

-- Uploads table (CSV files per user)
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    column_mapping JSONB,
    row_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_uploads_user ON uploads(user_id, created_at DESC);

-- Forecasts table (ML results per user)
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    params JSONB,
    results JSONB,
    processing_time_seconds DECIMAL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forecasts_user ON forecasts(user_id, created_at DESC);

-- Audit logs (basic traceability)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
