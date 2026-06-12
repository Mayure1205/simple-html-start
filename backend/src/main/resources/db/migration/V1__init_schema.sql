-- V1__init_schema.sql

-- 1. Chains
CREATE TABLE chains (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Default insert for Ethereum
INSERT INTO chains (chain_id, name) VALUES (1, 'Ethereum');

-- 2. Blocks
CREATE TABLE blocks (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    base_fee_per_gas NUMERIC,
    gas_used BIGINT,
    gas_limit BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, block_number),
    UNIQUE (chain_id, block_hash)
);

-- 3. Transactions
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value NUMERIC NOT NULL, -- Stored as numeric to handle large Wei values
    gas_price NUMERIC,
    gas_used BIGINT,
    status SMALLINT, -- 1 for success, 0 for failure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, transaction_hash)
);

-- Indexes for frequent queries
CREATE INDEX idx_transactions_from_address ON transactions(from_address);
CREATE INDEX idx_transactions_to_address ON transactions(to_address);
CREATE INDEX idx_transactions_block_number ON transactions(block_number);

-- 4. Token Contracts (Tracked ERC-20s)
CREATE TABLE token_contracts (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    contract_address VARCHAR(42) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    decimals INT DEFAULT 18,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, contract_address)
);

-- 5. Token Transfers
CREATE TABLE token_transfers (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    token_address VARCHAR(42) NOT NULL REFERENCES token_contracts(contract_address),
    transaction_hash VARCHAR(66) NOT NULL REFERENCES transactions(transaction_hash),
    log_index INT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value NUMERIC NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, token_address, transaction_hash, log_index)
);

CREATE INDEX idx_token_transfers_token_address ON token_transfers(token_address);
CREATE INDEX idx_token_transfers_from_address ON token_transfers(from_address);
CREATE INDEX idx_token_transfers_to_address ON token_transfers(to_address);
CREATE INDEX idx_token_transfers_block_timestamp ON token_transfers(block_timestamp);

-- 6. Wallets (Indexed from transactions/transfers)
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    first_seen_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Ingestion Jobs
CREATE TABLE ingestion_jobs (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    start_block BIGINT NOT NULL,
    end_block BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL, -- RUNNING, COMPLETED, FAILED
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Ingestion Checkpoints
CREATE TABLE ingestion_checkpoints (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    last_processed_block BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id)
);

-- 9. Failed Blocks
CREATE TABLE failed_blocks (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    block_number BIGINT NOT NULL,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL, -- PENDING, RETRYING, SUCCESS, DEAD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, block_number)
);

-- 10. Whale Alerts
CREATE TABLE whale_alerts (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    transaction_hash VARCHAR(66) NOT NULL,
    asset_type VARCHAR(20) NOT NULL, -- 'NATIVE', 'ERC20'
    token_address VARCHAR(42),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value NUMERIC NOT NULL,
    usd_value_estimate NUMERIC,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, transaction_hash)
);
