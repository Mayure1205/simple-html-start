# ChainSight Database ERD

The warehouse schema is chain-scoped so the project can support Ethereum first and add other chains later without redesigning primary analytical tables.

```mermaid
erDiagram
    CHAINS ||--o{ BLOCKS : has
    CHAINS ||--o{ TRANSACTIONS : has
    CHAINS ||--o{ WALLETS : has
    CHAINS ||--o{ TOKEN_CONTRACTS : has
    CHAINS ||--o{ INGESTION_JOBS : has
    CHAINS ||--o{ INGESTION_CHECKPOINTS : has
    CHAINS ||--o{ FAILED_BLOCKS : has
    CHAINS ||--o{ DAILY_NETWORK_METRICS : has

    BLOCKS ||--o{ TRANSACTIONS : contains
    BLOCKS ||--o{ TOKEN_TRANSFERS : contains
    BLOCKS ||--o{ WALLET_BALANCE_SNAPSHOTS : snapshots

    TRANSACTIONS ||--o{ TOKEN_TRANSFERS : emits
    TRANSACTIONS ||--o{ WHALE_ALERTS : triggers

    TOKEN_CONTRACTS ||--o{ TOKEN_TRANSFERS : emits
    WALLETS ||--o{ WALLET_BALANCE_SNAPSHOTS : owns
    WALLETS ||--o{ DAILY_WALLET_METRICS : aggregates

    CHAINS {
        bigint chain_id UK
        varchar name
    }

    BLOCKS {
        bigint chain_id FK
        bigint block_number
        varchar block_hash
        timestamptz block_timestamp
        numeric base_fee_per_gas_wei
    }

    TRANSACTIONS {
        bigint chain_id FK
        bigint block_number FK
        varchar transaction_hash
        varchar from_address
        varchar to_address
        numeric value_wei
        timestamptz block_timestamp
    }

    TOKEN_CONTRACTS {
        bigint chain_id FK
        varchar contract_address
        varchar symbol
        int decimals
        boolean is_active
    }

    TOKEN_TRANSFERS {
        bigint chain_id FK
        varchar token_address FK
        varchar transaction_hash FK
        int log_index
        numeric value_raw
        timestamptz block_timestamp
    }

    WALLETS {
        bigint chain_id FK
        varchar address
        timestamptz first_seen_at
        timestamptz last_seen_at
    }

    DAILY_NETWORK_METRICS {
        bigint chain_id FK
        date metric_date
        bigint block_count
        bigint transaction_count
        numeric total_value_wei
    }

    DAILY_WALLET_METRICS {
        bigint chain_id FK
        varchar wallet_address FK
        date metric_date
        bigint sent_count
        bigint received_count
        numeric sent_value_wei
        numeric received_value_wei
    }
```

## Key Constraints

| Table | Constraint | Purpose |
|---|---|---|
| `blocks` | `UNIQUE (chain_id, block_number)` | Prevent duplicate block ingestion |
| `blocks` | `UNIQUE (chain_id, block_hash)` | Preserve block identity |
| `transactions` | `UNIQUE (chain_id, transaction_hash)` | Make transaction ingestion idempotent |
| `token_contracts` | `UNIQUE (chain_id, contract_address)` | Track selected tokens per chain |
| `token_transfers` | `UNIQUE (chain_id, token_address, transaction_hash, log_index)` | Prevent duplicate ERC-20 logs |
| `ingestion_checkpoints` | `UNIQUE (chain_id)` | One checkpoint per chain |
| `failed_blocks` | `UNIQUE (chain_id, block_number)` | Durable retry state per failed block |

## Indexing Strategy

The initial indexes support the MVP query shapes:

- Wallet transaction history: `chain_id`, wallet address, timestamp.
- Token transfer activity: `chain_id`, token address, timestamp.
- Daily charts: chain-scoped dates and timestamps.
- Largest transfers: chain-scoped descending value indexes.
- Operational views: job status and failed-block status.

Benchmark evidence will be added later with `EXPLAIN ANALYZE` before and after index usage.
