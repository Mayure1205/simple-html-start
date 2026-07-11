# Database Interview Notes

## 30 Second Answer

PostgreSQL is used because ChainSight needs durable warehouse storage, ACID transactions, unique constraints for idempotency, indexes for analytics, and SQL features like aggregation and window functions.

## Code Mapping

Migrations:

- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `backend/src/main/resources/db/migration/V2__auth_and_tracked_wallets.sql`
- `backend/src/main/resources/db/migration/V3__add_wallet_auth.sql`

Repositories:

- `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java`
- `backend/src/main/java/com/chainsight/analytics/repository/WalletAnalyticsRepository.java`
- `backend/src/main/java/com/chainsight/auth/repository/AuthRepository.java`
- `backend/src/main/java/com/chainsight/wallet/repository/TrackedWalletRepository.java`

Tables currently used or prepared:

- `chains`
- `blocks`
- `transactions`
- `wallets`
- `ingestion_jobs`
- `ingestion_checkpoints`
- `failed_blocks`
- `app_users`
- `user_tracked_wallets`
- Additional schema tables exist for future token/metrics features.

## Concepts Used

| Concept | What it is | Why it exists | Why used here | Alternative | Trade-off |
|---|---|---|---|---|---|
| ACID transaction | Atomic database unit | Prevents partial writes | Block data and checkpoints must commit together | Eventual consistency | ACID is safer but can reduce write parallelism |
| Unique constraint | Database duplicate guard | Enforces idempotency | Prevent duplicate block/transaction rows | App-side duplicate checks | DB constraint is stronger |
| `ON CONFLICT DO NOTHING` | PostgreSQL upsert behavior | Safe replay | Re-ingesting committed data should not duplicate rows | Throw duplicate errors | Can hide unexpected duplicates if not monitored |
| B-tree index | Ordered lookup structure | Speeds equality/range lookups | Wallet/time/block queries | Hash index, no index | Indexes cost write/storage overhead |
| Window function | SQL calculation across rows | Ranking/delta analytics | `RANK()`, `LAG()` network analytics | App-side sorting | DB does work efficiently but SQL gets more complex |
| Flyway | Migration tool | Versioned schema changes | Repeatable local/prod setup | Manual SQL scripts | Requires disciplined migration history |
| JdbcTemplate | SQL execution helper | Direct SQL control | Batch ETL inserts and analytical reads | JPA/Hibernate | More manual mapping |

## Why PostgreSQL?

PostgreSQL gives one mature place for durable warehouse storage and analytics. ChainSight needs transactions, constraints, indexes, and SQL queries more than document flexibility.

## Why JdbcTemplate Instead Of JPA?

Ingestion can involve many transactions per block and many blocks per range. `JdbcTemplate.batchUpdate` gives direct control over SQL shape, conflict handling, batch size, and insert order. JPA is useful for entity-style CRUD, but less ideal for high-volume ETL writes.

## APIs Depending On Database

- `POST /api/v1/ingestion/jobs`
- `GET /api/v1/ingestion/status`
- `GET /api/v1/ingestion/failed-blocks`
- `GET /api/v1/analytics/network/daily`
- `GET /api/v1/analytics/network/largest-transactions`
- `GET /api/v1/analytics/wallets/{address}/transactions`
- `GET /api/v1/analytics/wallets/{address}/summary`
- Auth and tracked-wallet APIs

## Performance Notes

- B-tree indexes are coded.
- Window-function analytics are coded.
- `EXPLAIN ANALYZE` benchmark numbers are not captured yet.
- Do not claim measured query speed.

## Failure Scenarios

| Failure | Handling |
|---|---|
| Duplicate block replay | Unique constraints and conflict handling |
| Crash before checkpoint | Transaction rollback should remove partial data |
| Invalid wallet address | Service validation rejects before SQL query |
| Query too broad | API pagination/limit validation exists for relevant endpoints |

## Do Not Claim Yet

- Partitioning performance.
- Measured index improvement.
- EXPLAIN ANALYZE results.
- ERC-20 token analytics.
