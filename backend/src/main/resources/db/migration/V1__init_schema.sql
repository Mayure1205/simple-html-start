-- V1__init_schema.sql
-- ChainSight warehouse baseline for Ethereum historical ETL.

CREATE TABLE chains (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO chains (chain_id, name)
VALUES (1, 'Ethereum');

CREATE TABLE blocks (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    base_fee_per_gas_wei NUMERIC(78, 0),
    gas_used BIGINT,
    gas_limit NUMERIC(78, 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, block_number),
    UNIQUE (chain_id, block_hash)
);

CREATE INDEX idx_blocks_chain_timestamp
    ON blocks (chain_id, block_timestamp);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value_wei NUMERIC(78, 0) NOT NULL,
    gas_price_wei NUMERIC(78, 0),
    gas_used BIGINT,
    status SMALLINT,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_block
        FOREIGN KEY (chain_id, block_number)
        REFERENCES blocks (chain_id, block_number),
    CONSTRAINT chk_transactions_status
        CHECK (status IS NULL OR status IN (0, 1)),
    UNIQUE (chain_id, transaction_hash)
);

CREATE INDEX idx_transactions_chain_from_timestamp
    ON transactions (chain_id, from_address, block_timestamp DESC);
CREATE INDEX idx_transactions_chain_to_timestamp
    ON transactions (chain_id, to_address, block_timestamp DESC);
CREATE INDEX idx_transactions_chain_block
    ON transactions (chain_id, block_number);
CREATE INDEX idx_transactions_chain_timestamp
    ON transactions (chain_id, block_timestamp);
CREATE INDEX idx_transactions_chain_value
    ON transactions (chain_id, value_wei DESC);

CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    address VARCHAR(42) NOT NULL,
    first_seen_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, address)
);

CREATE TABLE token_contracts (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    contract_address VARCHAR(42) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    decimals INT DEFAULT 18,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, contract_address)
);

CREATE TABLE token_transfers (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    token_address VARCHAR(42) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INT NOT NULL,
    block_number BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value_raw NUMERIC(78, 0) NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_transfers_contract
        FOREIGN KEY (chain_id, token_address)
        REFERENCES token_contracts (chain_id, contract_address),
    CONSTRAINT fk_token_transfers_transaction
        FOREIGN KEY (chain_id, transaction_hash)
        REFERENCES transactions (chain_id, transaction_hash),
    CONSTRAINT fk_token_transfers_block
        FOREIGN KEY (chain_id, block_number)
        REFERENCES blocks (chain_id, block_number),
    UNIQUE (chain_id, token_address, transaction_hash, log_index)
);

CREATE INDEX idx_token_transfers_chain_token_timestamp
    ON token_transfers (chain_id, token_address, block_timestamp DESC);
CREATE INDEX idx_token_transfers_chain_from_timestamp
    ON token_transfers (chain_id, from_address, block_timestamp DESC);
CREATE INDEX idx_token_transfers_chain_to_timestamp
    ON token_transfers (chain_id, to_address, block_timestamp DESC);
CREATE INDEX idx_token_transfers_chain_block
    ON token_transfers (chain_id, block_number);

CREATE TABLE wallet_balance_snapshots (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    wallet_address VARCHAR(42) NOT NULL,
    block_number BIGINT NOT NULL,
    balance_wei NUMERIC(78, 0) NOT NULL,
    snapshot_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_balance_snapshots_wallet
        FOREIGN KEY (chain_id, wallet_address)
        REFERENCES wallets (chain_id, address),
    CONSTRAINT fk_wallet_balance_snapshots_block
        FOREIGN KEY (chain_id, block_number)
        REFERENCES blocks (chain_id, block_number),
    UNIQUE (chain_id, wallet_address, block_number)
);

CREATE INDEX idx_wallet_balance_snapshots_wallet_timestamp
    ON wallet_balance_snapshots (chain_id, wallet_address, snapshot_timestamp DESC);

CREATE TABLE daily_network_metrics (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    metric_date DATE NOT NULL,
    block_count BIGINT NOT NULL DEFAULT 0,
    transaction_count BIGINT NOT NULL DEFAULT 0,
    total_value_wei NUMERIC(78, 0) NOT NULL DEFAULT 0,
    average_gas_price_wei NUMERIC(78, 0),
    average_gas_used NUMERIC(20, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id, metric_date)
);

CREATE INDEX idx_daily_network_metrics_chain_date
    ON daily_network_metrics (chain_id, metric_date DESC);

CREATE TABLE daily_wallet_metrics (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    wallet_address VARCHAR(42) NOT NULL,
    metric_date DATE NOT NULL,
    sent_count BIGINT NOT NULL DEFAULT 0,
    received_count BIGINT NOT NULL DEFAULT 0,
    sent_value_wei NUMERIC(78, 0) NOT NULL DEFAULT 0,
    received_value_wei NUMERIC(78, 0) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_daily_wallet_metrics_wallet
        FOREIGN KEY (chain_id, wallet_address)
        REFERENCES wallets (chain_id, address),
    UNIQUE (chain_id, wallet_address, metric_date)
);

CREATE INDEX idx_daily_wallet_metrics_wallet_date
    ON daily_wallet_metrics (chain_id, wallet_address, metric_date DESC);

CREATE TABLE ingestion_jobs (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    start_block BIGINT NOT NULL,
    end_block BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    requested_by VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    CONSTRAINT chk_ingestion_jobs_range CHECK (start_block <= end_block),
    CONSTRAINT chk_ingestion_jobs_status
        CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

CREATE INDEX idx_ingestion_jobs_chain_status
    ON ingestion_jobs (chain_id, status);

CREATE TABLE ingestion_checkpoints (
    id SERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    last_processed_block BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chain_id)
);

INSERT INTO ingestion_checkpoints (chain_id, last_processed_block)
VALUES (1, 0);

CREATE TABLE failed_blocks (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    block_number BIGINT NOT NULL,
    failure_reason TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_failed_blocks_status
        CHECK (status IN ('PENDING', 'RETRYING', 'SUCCESS', 'DEAD')),
    UNIQUE (chain_id, block_number)
);

CREATE INDEX idx_failed_blocks_chain_status
    ON failed_blocks (chain_id, status);

CREATE TABLE whale_alerts (
    id BIGSERIAL PRIMARY KEY,
    chain_id BIGINT NOT NULL REFERENCES chains(chain_id),
    transaction_hash VARCHAR(66) NOT NULL,
    asset_type VARCHAR(20) NOT NULL,
    token_address VARCHAR(42),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value_raw NUMERIC(78, 0) NOT NULL,
    usd_value_estimate NUMERIC(38, 2),
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_whale_alerts_transaction
        FOREIGN KEY (chain_id, transaction_hash)
        REFERENCES transactions (chain_id, transaction_hash),
    CONSTRAINT chk_whale_alerts_asset_type
        CHECK (asset_type IN ('NATIVE', 'ERC20'))
);

CREATE UNIQUE INDEX uq_whale_alerts_native_transaction
    ON whale_alerts (chain_id, transaction_hash)
    WHERE asset_type = 'NATIVE' AND token_address IS NULL;

CREATE UNIQUE INDEX uq_whale_alerts_token_transaction
    ON whale_alerts (chain_id, transaction_hash, token_address)
    WHERE asset_type = 'ERC20' AND token_address IS NOT NULL;

CREATE INDEX idx_whale_alerts_chain_timestamp
    ON whale_alerts (chain_id, block_timestamp DESC);
CREATE INDEX idx_whale_alerts_chain_value
    ON whale_alerts (chain_id, value_raw DESC);
