# ChainSight — Project Context for Claude

## Who I Am
- Engineering student (fresher), targeting Nomura, Barclays, Morgan Stanley, EDS
- No prior formal SDLC experience — this project is where I learn it properly
- Goal: build this as an evidence-based engineering portfolio piece, not just a working app

## What ChainSight Is
High-Volume Historical Blockchain Data Warehouse & Analytics Platform.

**Key framing for interviews — always say this:**
> "Ethereum blockchain is the data source because it's publicly accessible and generates 1M+ transactions daily — ideal for stress-testing concurrent batch ingestion and analytics at scale. The real project is a high-volume ETL data warehouse."

Never say "I built a blockchain app." Say "I built a data engineering platform."

## Why This Project Was Chosen
- Real data available (Infura/Alchemy free tier) — no synthetic data needed
- Visual dashboard for demos
- Covers: concurrent ETL, JDBC batch inserts, PostgreSQL window functions + B-tree indexes, Redis caching, distributed locks, circuit breaker, rate limiting, custom thread pools, CompletableFuture
- Completable as a fresher (unlike VELOX matching engine)
- Unique enough — not a stock dashboard, not a CRUD app

## Core Tech Stack
- Java 21, Spring Boot
- Web3j (Ethereum JSON-RPC)
- PostgreSQL (warehouse), Redis (cache + distributed locks)
- Flyway (migrations), JdbcTemplate (bulk inserts), JPA (metadata only)
- Resilience4j (circuit breaker)
- Docker + Docker Compose
- GitHub Actions (CI)
- AWS EC2 (t3.medium, Mumbai region)

## Architecture
```
Ethereum RPC (Infura/Alchemy)
        ↓
Web3j RPC Adapter
        ↓
Custom ThreadPoolExecutor (parallel block range extraction)
        ↓
CompletableFuture pipeline (block + tx + logs fetched concurrently)
        ↓
JDBC Batch Insert (500 rows, flush every 200ms)
        ↓
PostgreSQL Warehouse (partitioned tables, B-tree indexes)
        ↓
Redis Cache (analytics queries, TTL-based)
        ↓
Spring Boot REST APIs
        ↓
React/Angular Dashboard
```

## Key Engineering Decisions
1. **Modular monolith first** — not microservices. Split only if needed.
2. **JdbcTemplate for bulk ingestion** — JPA/Hibernate is too slow for 1000s of tx/block
3. **JPA only for metadata** — ingestion jobs, checkpoints, users, dashboards
4. **Redis distributed lock** — prevent two instances ingesting same block range
5. **ACID checkpointing** — block + transactions + checkpoint update in ONE transaction. Restart-safe.
6. **Token bucket rate limiter** — protect both Infura API calls AND analytics REST endpoints

## Java Concepts to Implement (and WHERE)

| Concept | Where Used |
|---|---|
| Custom ThreadPoolExecutor | Block range extraction workers |
| CompletableFuture.thenCombine | Fetch block + transfers + receipts concurrently |
| ConcurrentHashMap | Track active ingestion jobs, block progress |
| ReentrantLock | Protect per-chain checkpoint updates |
| JDBC batchUpdate | Transaction/token transfer inserts |
| ACID transactions | Block + tx + checkpoint atomic commit |
| B-tree indexes | wallet+timestamp, symbol+time queries |
| Window functions | RANK, LAG, rolling averages for analytics |
| Redis cache | Cache expensive analytics responses |
| Redis SETNX | Distributed ingestion lock |
| Token bucket | Rate limit via Redis INCRBY + EXPIRE |
| Circuit breaker (Resilience4j) | Wrap all Infura/Alchemy RPC calls |

## PostgreSQL Tables
```
chains, blocks, transactions, token_contracts, token_transfers,
wallets, wallet_balance_snapshots, daily_network_metrics,
ingestion_jobs, ingestion_checkpoints, failed_blocks, whale_alerts
```

Key constraints:
```sql
UNIQUE (chain_id, block_number)
UNIQUE (chain_id, transaction_hash)
UNIQUE (chain_id, token_address, transaction_hash, log_index)
```

## Git Discipline (NON-NEGOTIABLE)
- Conventional commits: `feat(ingestion): add block range extractor`
- Commit directly to main branch. DO NOT create feature branches.

## Sprint Plan (Summary)
- **Sprint 0**: Repo setup, docs, Docker Compose, first Flyway migration
- **Sprint 1**: Web3j RPC adapter, fetch + persist blocks
- **Sprint 2**: ACID checkpointing, JDBC batching, restart-safety tests
- **Sprint 3**: Custom thread pool, CompletableFuture pipeline, concurrency
- **Sprint 4**: Analytics APIs, window functions, EXPLAIN ANALYZE benchmarks
- **Sprint 5**: Redis cache, distributed lock, rate limiter, circuit breaker
- **Sprint 6**: Dashboard
- **Sprint 7**: AWS deployment (t3.medium, Docker Compose, Nginx)
- **Sprint 8**: Benchmark report, Evidence Ledger, README, release tag v1.0.0

## AWS Hosting Plan
- Instance: t3.medium (~$0.04/hr, ~$30/month compute)
- Stack on one EC2: Spring Boot + PostgreSQL + Redis + Nginx via Docker Compose
- Storage: 30GB gp3 EBS
- Budget alerts set at: $30, $60, $100
- Stop instance when not using it to save cost
- $200 AWS credit = ~4-5 months runway

## Evidence Ledger (fill as you build)
Keep `docs/interview-evidence.md` updated:

| Claim | Proof |
|---|---|
| Used concurrent extraction | Source file + architecture diagram |
| Restart-safe ingestion | Integration test |
| Improved ingestion throughput | Benchmark report (batch size comparison) |
| Used indexes effectively | EXPLAIN ANALYZE before/after |
| Circuit breaker added | Failure test + screenshot |
| Hosted on AWS | Public demo URL |
| CI/CD pipeline | GitHub Actions run link |

## Resume Bullet (use only after implementation)
```
ChainSight — Concurrent Historical Data Warehouse and Analytics Platform

Built a Java 21 and Spring Boot historical-data warehouse using Ethereum
as a publicly accessible high-volume transaction source. Implemented
bounded custom thread pools, CompletableFuture-based extraction,
restart-safe ACID checkpointing, JDBC batch ingestion, PostgreSQL B-Tree
indexes and window-function analytics. Added Redis caching, distributed
locks, token-bucket rate limiting, RPC circuit breakers, automated tests,
GitHub Actions CI and AWS EC2 deployment through Docker Compose.
```

## Interview Framing Script
> "I built a Java-based historical data warehouse — not a basic blockchain
> app. Ethereum was the data source because it's publicly accessible and
> produces millions of transactions. The engineering challenge was: how do
> you reliably ingest high-volume historical data with restarts, duplicate
> prevention, and concurrent workers? I used ACID checkpointing, JDBC batch
> inserts, custom thread pools, and CompletableFuture pipelines. Then I
> optimized query performance using PostgreSQL B-tree indexes and window
> functions, and added Redis caching, distributed locks, and circuit
> breakers for resilience."

## First Task When Starting a Session
If no code exists yet: start with Docker Compose (postgres + redis) + first Flyway migration.
If code exists: check `docs/interview-evidence.md` and current sprint progress.
