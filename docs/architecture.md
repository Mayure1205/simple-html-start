# ChainSight Architecture

## System Context

ChainSight ingests historical Ethereum data into a query-friendly PostgreSQL warehouse, then exposes analytics through REST APIs and a dashboard.

```text
Ethereum RPC Provider
        |
        v
Spring Boot Backend
        |
        +--> PostgreSQL warehouse
        |
        +--> Redis cache, locks, and rate limits
        |
        v
Analytics REST APIs
        |
        v
Dashboard
```

## Architecture Style

ChainSight starts as a modular monolith. The project needs strong module boundaries, not early microservices.

The first production version runs as one backend process with separate packages for ingestion, Ethereum RPC access, warehouse persistence, analytics, resilience, and API controllers. This keeps local development, testing, debugging, and deployment realistic for a fresher portfolio project while still showing production-style design.

## Backend Modules

| Module | Responsibility |
|---|---|
| `ethereum` | Web3j client, RPC DTO conversion, provider error handling |
| `ingestion` | Job orchestration, block-range validation, progress tracking, retries |
| `warehouse` | JdbcTemplate batch writes, checkpoint persistence, warehouse reads |
| `analytics` | SQL analytics queries, window functions, API response shaping |
| `resilience` | Circuit breaker, retry policy, rate limiting, distributed locks |
| `admin` | Ingestion controls, status views, failed-block retry endpoints |
| `config` | Spring configuration, properties, executor beans, Redis clients |

## Ingestion Flow

```text
Admin starts block-range job
        |
        v
Validate chain ID and block range
        |
        v
Acquire in-memory same-chain job slot
        |
        v
Split block range into chunks
        |
        v
Fetch blocks and related data through Web3j
        |
        v
Transform raw RPC data into warehouse records
        |
        v
Persist block, transactions, token transfers, metrics, checkpoint
        |
        v
Commit one database transaction per block or chunk
        |
        v
Update job progress and release lock
```

## Transaction Boundary

Restart safety depends on storing data and checkpoints atomically.

For a processed block, this work must be committed in one PostgreSQL transaction:

1. Insert or upsert block row.
2. Insert native transactions with JDBC batch operations.
3. Insert selected token transfers with JDBC batch operations.
4. Upsert wallets and daily metrics.
5. Create whale alerts where thresholds match.
6. Update the ingestion checkpoint.

If any step fails, the transaction rolls back and the block remains retryable.

## Concurrency Model

Sprint 3 introduced a bounded `ThreadPoolExecutor` for block-range extraction.

The implemented design:

- Fixed upper bound for worker threads.
- Bounded queue to prevent unbounded memory growth.
- `CompletableFuture` for scheduling block fetches concurrently.
- `ConcurrentHashMap` for active job and progress tracking.
- Ordered persistence after extraction so checkpoints still advance safely.

Planned later:

- Redis lock for cross-instance protection.
- Per-chain checkpoint protection if multiple concurrent writers are introduced.

## Persistence Strategy

- Use JPA only for lower-volume metadata such as jobs, checkpoints, and configuration.
- Use `JdbcTemplate.batchUpdate` for high-volume block, transaction, and transfer inserts.
- Use PostgreSQL unique constraints for idempotency.
- Use B-tree indexes for wallet, token, date range, and largest-transfer queries.
- Use Flyway for schema evolution.

## Analytics Strategy

Sprint 4 begins with network-level analytics over indexed block and transaction data.

- Use `JdbcTemplate` for SQL-first analytical reads.
- Use PostgreSQL window functions such as `LAG()` and `RANK()`.
- Keep blockchain-size numeric values as strings in API responses where JavaScript precision matters.
- Add `EXPLAIN ANALYZE` evidence in the benchmark sprint before claiming measured performance improvements.

## Resilience Strategy

External RPC calls are expected to fail or rate-limit occasionally.

The backend now uses:

- Resilience4j circuit breaker around RPC calls.
- Failed-block table for durable retry state.
- Redis token bucket rate limiter for ingestion and analytics REST endpoints.
- Redis distributed lock to prevent overlapping ingestion ranges.
- Redis cache for network analytics responses.

Planned later:

- Retry with backoff for transient failures.

## Observability

The backend exposes Spring Boot Actuator health and metrics. Later sprints should add custom metrics for:

- Blocks processed per second.
- Transactions inserted per second.
- Failed-block count.
- Retry count.
- Executor active threads and queue depth.
- Cache hit and miss latency.
