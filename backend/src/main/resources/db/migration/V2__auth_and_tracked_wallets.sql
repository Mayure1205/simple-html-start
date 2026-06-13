-- V2__auth_and_tracked_wallets.sql
-- Adds JWT login users and per-user wallet watchlists.

CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email)
);

CREATE TABLE user_tracked_wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    wallet_address VARCHAR(42) NOT NULL,
    label VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, chain_id, wallet_address)
);

CREATE INDEX idx_user_tracked_wallets_user
    ON user_tracked_wallets (user_id, created_at DESC);

CREATE INDEX idx_user_tracked_wallets_wallet
    ON user_tracked_wallets (chain_id, wallet_address);
