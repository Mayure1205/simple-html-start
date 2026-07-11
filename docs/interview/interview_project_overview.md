# ChainSight Project Overview

## Core Framing

ChainSight is a Java backend data engineering project. Ethereum is the data source because it is public, high-volume, and realistic. The project is not a crypto trading app or wallet app. It is a historical data warehouse and analytics platform.

Interview line:

```text
Ethereum blockchain is the data source because it is publicly accessible and generates high-volume transaction data. The real project is a Java ETL and analytics warehouse.
```

## 30 Second Answer

ChainSight ingests Ethereum block and transaction data, stores it in PostgreSQL, and exposes analytics APIs and a dashboard. The engineering focus is reliable high-volume ingestion: restart-safe checkpoints, duplicate prevention, JDBC batch writes, concurrent RPC extraction, Redis runtime controls, and SQL analytics.

## 2 Minute Answer

ChainSight is a Spring Boot backend that treats Ethereum as a public high-volume data source. It fetches blocks and transaction receipts through Web3j, maps them into warehouse records, and persists them with `JdbcTemplate`. The ingestion service supports block ranges, async jobs, per-block transaction boundaries, checkpoint-aware resume, failed-block tracking, and duplicate-safe inserts. Analytics endpoints use PostgreSQL indexes, aggregations, and window functions. Redis is used for network analytics caching, distributed ingestion locks, token-bucket rate limiting, and wallet-login nonce storage. The static dashboard lets a user operate ingestion, view analytics, look up wallet activity, sign in, and track wallets.

## Deep Technical Answer

The system is a modular monolith. The ingestion path enters through `IngestionController`, validates block/range requests, uses `BlockIngestionService` for orchestration, fetches data through `EthereumRpcAdapter`, and writes through `BlockJdbcRepository`. Range jobs are accepted asynchronously and use bounded executors plus `CompletableFuture` to fetch blocks and receipts concurrently. Persistence remains ordered by block number and uses `TransactionTemplate`, so block rows, transaction rows, wallet rows, jobs, failed-block state, and checkpoints are updated atomically where needed. Analytics use SQL-first repositories over PostgreSQL. Security uses BCrypt, custom HMAC-SHA256 JWTs, Spring Security filters, tracked-wallet ownership through user ids, and a wallet-signature login challenge path backed by Redis nonces.

## Feature Summary

What was built:

- Spring Boot backend for historical Ethereum warehouse ingestion.
- PostgreSQL schema managed by Flyway.
- Web3j RPC adapter.
- Restart-aware ingestion with checkpoints.
- Async block-range jobs and bounded concurrency.
- Network and wallet analytics APIs.
- Redis cache, lock, rate limiter, and wallet-login nonce usage.
- JWT email/password auth and tracked-wallet watchlists.
- Provider-neutral wallet sign-in UI path.
- Static dashboard served by Spring Boot.
- Docker/AWS/CI readiness docs and config.

Why it was built:

- To create an evidence-based backend portfolio project that is deeper than CRUD.
- To demonstrate Java backend, data engineering, database, concurrency, Redis, and deployment concepts.

Business purpose:

- Users can index historical Ethereum data and inspect network/wallet activity.
- A demo dashboard makes backend behavior visible during interviews.

Engineering purpose:

- Prove reliable ETL behavior under restart, duplicate, RPC, and concurrency constraints.

## Code Mapping

Important paths:

- `backend/src/main/java/com/chainsight/ChainSightApplication.java`
- `backend/src/main/java/com/chainsight/ingestion`
- `backend/src/main/java/com/chainsight/analytics`
- `backend/src/main/java/com/chainsight/resilience`
- `backend/src/main/java/com/chainsight/auth`
- `backend/src/main/java/com/chainsight/wallet`
- `backend/src/main/resources/db/migration`
- `backend/src/main/resources/static/dashboard`
- `infra/docker-compose.local.yml`
- `infra/docker-compose.prod.yml`
- `.github/workflows/backend-ci.yml`

## What I Can Honestly Claim

- Core backend code exists for ingestion, analytics, Redis runtime controls, auth, tracked wallets, and dashboard.
- Unit tests exist for important service behavior.
- Testcontainers integration tests exist for repository/restart-safety scenarios but need Docker running.
- Deployment artifacts exist, but live AWS deployment evidence is not captured.
- Benchmark templates exist, but real performance numbers are not captured.

## Do Not Claim Yet

- Do not claim live AWS hosting.
- Do not claim passing remote CI evidence.
- Do not claim measured throughput or latency.
- Do not claim full SIWE-compliant wallet login.
- Do not claim production-verified WalletConnect login.
- Do not claim ERC-20 token transfer extraction.
