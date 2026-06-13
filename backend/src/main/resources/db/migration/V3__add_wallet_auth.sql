-- V3__add_wallet_auth.sql
-- Adds support for Web3 wallet authentication.

ALTER TABLE app_users ADD COLUMN wallet_address VARCHAR(42) UNIQUE;

-- Make email and password nullable so users can login with JUST a wallet
ALTER TABLE app_users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE app_users ALTER COLUMN password_hash DROP NOT NULL;

-- Ensure a user has at least one valid login method
ALTER TABLE app_users ADD CONSTRAINT chk_app_users_identity 
    CHECK (email IS NOT NULL OR wallet_address IS NOT NULL);
