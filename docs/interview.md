# ChainSight Interview Guide

This file is the living interview guide for ChainSight. It must only describe features that are actually implemented, coded, or tested in this repository. Planned items belong under **Future Topics — Do Not Claim Yet**.

## Project Overview

### 30-Second Explanation

Beginner-friendly:

ChainSight is a backend data engineering project. It takes Ethereum block data from a public RPC provider, transforms it into structured records, and stores it in PostgreSQL so the data can be queried later.

Technical interview answer:

ChainSight is a Java 21 and Spring Boot historical-data warehouse using Ethereum as a public high-volume data source. The implemented backend currently supports Web3j-based block and transaction receipt fetching, checkpoint-aware sequential block-range ingestion, JDBC batch inserts, Flyway-managed PostgreSQL schema, and tests for ingestion behavior.

### 2-Minute Explanation

Beginner-friendly:

Ethereum is not the product here. It is the data source. The real engineering problem is how to ingest many historical records safely without duplicating data, losing progress, or making the database messy after failures.

Technical interview answer:

The project is a modular Spring Boot backend. The first implemented ingestion slice fetches full Ethereum blocks using Web3j, fetches transaction receipts for execution metadata, maps blocks and native transactions into Java records, and persists them through a `JdbcTemplate` repository. PostgreSQL unique constraints make replay idempotent, and ingestion checkpoints allow restart behavior to skip already-processed blocks. Each block persistence operation is wrapped in a Spring `TransactionTemplate`, so block rows, transaction rows, wallet rows, and checkpoint updates are committed atomically.

## Architecture Flow

Implemented flow:

```text
Admin/API request
        |
        v
IngestionController
        |
        v
BlockIngestionService
        |
        +--> EthereumRpcAdapter -> Web3j -> Ethereum RPC
        |
        v
TransactionTemplate
        |
        v
BlockJdbcRepository
        |
        v
PostgreSQL tables managed by Flyway
```

Important implemented files:

| Area | File |
|---|---|
| App entry point | `backend/src/main/java/com/chainsight/ChainSightApplication.java` |
| Web3j bean | `backend/src/main/java/com/chainsight/config/Web3jConfig.java` |
| RPC adapter | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java` |
| Ingestion service | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` |
| JDBC repository | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` |
| REST API | `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java` |
| Global errors | `backend/src/main/java/com/chainsight/exception/GlobalExceptionHandler.java` |
| Schema | `backend/src/main/resources/db/migration/V1__init_schema.sql` |
| Unit tests | `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` |
| PostgreSQL integration tests | `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java` |

## Sprint-Wise Implementation Summary

### Sprint 0 — Project Foundation

What was built:

- Spring Boot backend skeleton.
- PostgreSQL and Redis local Docker Compose file.
- First Flyway migration for warehouse tables.
- Architecture, API, ERD, runbook, ADR, and evidence docs.

Why it was needed:

- A data warehouse project needs a reliable schema and repeatable local infrastructure before ingestion logic.

Where it is used:

- `infra/docker-compose.local.yml`
- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `docs/architecture.md`
- `docs/database-erd.md`
- `docs/api-contract.md`
- `docs/runbook.md`
- `docs/adrs/ADR-001-start-with-modular-monolith.md`

Interview explanation:

I started with infrastructure and schema because ingestion correctness depends on database constraints, indexes, and migrations. I used Flyway so the schema is versioned and reproducible.

Evidence:

- Docker Compose config validates.
- Flyway migration exists.
- Evidence ledger: `docs/interview-evidence.md`.

### Sprint 1 — Web3j Block Ingestion Slice

What was built:

- Web3j RPC adapter for fetching Ethereum blocks.
- Transaction receipt mapping for actual gas used and success/failure status.
- Java records for block and transaction data.
- REST endpoints for single-block ingestion, range ingestion, and ingestion status.
- JDBC persistence for blocks, transactions, wallets, jobs, and checkpoints.
- Unit tests for ingestion service behavior.

Why it was needed:

- This is the first real ETL path: extract from RPC, transform into Java objects, and load into PostgreSQL-ready structures.

Where it is used:

- `EthereumRpcAdapter.java`
- `BlockData.java`
- `TransactionData.java`
- `IngestionController.java`
- `BlockIngestionService.java`
- `BlockJdbcRepository.java`
- `BlockIngestionServiceTest.java`

Java/Spring concepts:

- Java records.
- `BigInteger` for blockchain numeric values.
- `Optional` for transaction receipts that may not be returned by the RPC provider.
- Spring `@Service`, `@Repository`, `@RestController`.
- Dependency injection.
- `JdbcTemplate.batchUpdate`.
- `TransactionTemplate`.
- Validation with `jakarta.validation`.

Interview explanation:

I built a vertical slice first. The API calls a service, the service fetches a block through Web3j, maps it into immutable records, and persists it using `JdbcTemplate`. I chose `JdbcTemplate` because block ingestion can involve many transaction rows and JPA is not ideal for high-volume batch inserts.

For transaction rows, the adapter also fetches each transaction receipt so the warehouse can store actual gas used and whether the transaction succeeded or failed. The block response gives the transaction payload, while the receipt gives execution results.

Possible interviewer questions:

| Question | Short Answer |
|---|---|
| Why Web3j? | It is a Java library for Ethereum JSON-RPC, so it fits the Java backend stack. |
| Why `BigInteger`? | Ethereum values like Wei can exceed normal integer ranges. |
| Why records? | The mapped block/transaction data is immutable data transfer state. |
| Why `JdbcTemplate` instead of JPA? | Batch inserts are simpler and faster with SQL-focused APIs. |
| Why fetch transaction receipts? | Receipts provide execution outcome and actual gas used, which are not fully available from the transaction object alone. |

Evidence:

- Unit test file: `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`.
- `mvn test`: service tests pass.
- Receipt mapping code: `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`.

### Sprint 2 — Checkpoint-Aware Restart Safety

Status:

- Implemented in code.
- Unit tests pass.
- PostgreSQL/Testcontainers integration tests are written but were skipped in this Codex run because Docker was not running.

What was built:

- Range ingestion now reads `ingestion_checkpoints.last_processed_block`.
- Restarted range ingestion resumes from `checkpoint + 1`.
- Already committed blocks are skipped and not fetched again.
- Same-JVM overlapping range jobs for the same chain are rejected with an in-memory `ConcurrentHashMap` guard.
- Integration tests were added for duplicate replay, rollback before checkpoint, and checkpoint-based restart.
- Failed blocks are recorded in `failed_blocks`.
- Failed blocks can be listed and retried through REST endpoints.
- Ingestion jobs can be queried by job id to inspect persisted status, timestamps, and failure reason.

Why it was needed:

- If a job processes blocks `19999000` to `20000000` and crashes after committing block `19999500`, restarting the same request should continue from `19999501`, not start over from `19999000`.

Where it is used:

- Resume logic: `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- Checkpoint read/write: `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- Response fields: `backend/src/main/java/com/chainsight/ingestion/dto/IngestionJobResponse.java`
- Failed-block DTO: `backend/src/main/java/com/chainsight/ingestion/dto/FailedBlockResponse.java`
- Job status DTO: `backend/src/main/java/com/chainsight/ingestion/dto/IngestionJobStatusResponse.java`
- Failed-block endpoints: `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`
- Unit proof: `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`
- PostgreSQL proof tests: `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java`

Java/Spring concepts:

- Transaction boundary with `TransactionTemplate`.
- Repository pattern.
- Idempotency through SQL constraints.
- `ConcurrentHashMap` for in-memory active job tracking.
- Testcontainers for real database tests.
- Mockito for service-level testing.

Beginner-friendly explanation:

The checkpoint is like a bookmark. If ChainSight finishes block `19999500`, it writes that number into the database. If the app restarts, it reads the bookmark and continues from the next block.

Technical interview answer:

The service computes `resumeFromBlock = max(request.startBlock, lastProcessedBlock + 1)`. Each block is persisted inside a Spring transaction. The database has unique constraints on `(chain_id, block_number)` and `(chain_id, transaction_hash)`, so replaying committed data does not create duplicates. If a failure happens before checkpoint update inside the transaction, PostgreSQL rolls back the block and transaction rows too.

Failed-block handling:

If range ingestion fails on a block, ChainSight records the block number, failure reason, retry count, and status in `failed_blocks`. The API can list failed blocks and retry one block immediately.

Job monitoring:

Every range request creates an `ingestion_jobs` row. The job status endpoint reads that row back so an admin can inspect whether the job is `RUNNING`, `COMPLETED`, or `FAILED`.

Overlap protection:

The backend keeps an in-memory map of active range jobs by chain id. If another range request starts for the same chain while one is already active, the service rejects it. This protects the current single-instance MVP from accidental overlapping writes. It is not a distributed lock yet.

Possible interviewer questions:

| Question | Short Answer |
|---|---|
| What happens if the app crashes before checkpoint update? | The transaction rolls back, so the block is retried on restart. |
| What happens if the app crashes after checkpoint update? | The full block transaction already committed, so restart skips that block. |
| Why one transaction per block? | It keeps recovery simple and limits rollback size. |
| How do you prevent duplicate rows? | PostgreSQL unique constraints plus `ON CONFLICT DO NOTHING`. |
| How do you prove restart safety? | Unit tests prove service resume logic; Testcontainers integration tests prove database rollback/idempotency when Docker is available. |
| What happens when a block fails? | The service records it in `failed_blocks`, marks the job failed, and exposes a retry endpoint. |
| How can an admin inspect a job? | `GET /api/v1/ingestion/jobs/{jobId}` returns persisted job status and timestamps. |
| How do you prevent two range jobs from running together now? | A `ConcurrentHashMap` tracks active range jobs by chain id inside one application instance. |

Evidence:

- Unit tests: `mvn test` ran 5 service tests successfully.
- Integration tests added: `BlockJdbcRepositoryIntegrationTest.java`.
- In this Codex run, Testcontainers tests were skipped because Docker was not running.

## Core Java Concepts Used

| Concept | Where Used | Explanation |
|---|---|---|
| Records | `BlockData`, `TransactionData`, ingestion DTOs | Immutable data carriers for RPC and API data. |
| `BigInteger` | Block numbers, Wei values, gas values | Blockchain values can be very large. |
| `Optional` | Transaction receipt handling in `EthereumRpcAdapter` | A receipt may be absent, so the code maps missing data to nullable warehouse fields. |
| Streams | Wallet extraction in `BlockIngestionService` | Extracts unique wallet addresses from transaction records. |
| Exception handling | `RpcFetchException`, `GlobalExceptionHandler` | Converts RPC and validation failures into API errors. |
| Collections | `List<TransactionData>`, `Set<String>` | Stores transactions and unique wallet addresses. |
| `ConcurrentHashMap` | `BlockIngestionService.activeRangeJobsByChain` | Prevents overlapping same-chain range ingestion jobs in one JVM. |

## Spring Boot Concepts Used

| Concept | Where Used | Explanation |
|---|---|---|
| Dependency Injection | Constructor injection in services/controllers | Keeps classes testable and loosely coupled. |
| `@RestController` | `IngestionController` | Exposes ingestion API endpoints. |
| `@Service` | `EthereumRpcAdapter`, `BlockIngestionService` | Holds business and integration logic. |
| `@Repository` | `BlockJdbcRepository` | Encapsulates database access. |
| `JdbcTemplate` | `BlockJdbcRepository` | Performs SQL inserts and batch inserts. |
| `TransactionTemplate` | `BlockIngestionService` | Defines explicit per-block transaction boundaries. |
| Validation | `StartIngestionRequest` | Rejects invalid API input. |
| Global exception handling | `GlobalExceptionHandler` | Returns consistent API error responses. |

## PostgreSQL And SQL Concepts Used

Implemented:

- Flyway migration for schema versioning.
- Unique constraints for idempotency.
- Foreign keys for relational integrity.
- `ON CONFLICT DO NOTHING` for safe replay.
- Checkpoint table for restart progress.
- B-tree indexes for likely wallet/time/block queries.
- Transaction rollback behavior tested in Testcontainers test code.

Important files:

- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java`

## Concurrency Concepts Used

Implemented now:

- `ConcurrentHashMap` guard for active range ingestion jobs in one backend JVM.

Important:

Do not claim custom thread pools, `CompletableFuture`, distributed locking, or concurrent extraction yet.

## Redis, Resilience, Docker, AWS, And CI/CD Concepts Used

Implemented now:

- Redis is present in Docker Compose, but application Redis logic is not implemented yet.
- Docker Compose exists for local PostgreSQL and Redis.
- Resilience4j dependency/config exists, but RPC calls are not wrapped yet.

Do not claim yet:

- Redis caching.
- Redis distributed locks.
- Token bucket rate limiting.
- Circuit breaker behavior.
- AWS deployment.
- GitHub Actions CI.

## Important Design Decisions

### Modular Monolith First

Beginner-friendly:

One backend app is easier to build, run, test, and explain.

Technical answer:

The project uses a modular monolith because early microservices would add distributed-system complexity before the ingestion and warehouse behavior is proven.

Evidence:

- `docs/adrs/ADR-001-start-with-modular-monolith.md`

### JdbcTemplate For Ingestion

Beginner-friendly:

For lots of rows, direct SQL batch insert is clearer and faster than saving one object at a time.

Technical answer:

High-volume ingestion needs SQL control, conflict handling, and batch writes. `JdbcTemplate.batchUpdate` gives direct control over insert statements and batch size.

Evidence:

- `BlockJdbcRepository.insertTransactions(...)`

### Checkpoint-Aware Resume

Beginner-friendly:

The checkpoint tells the app where to continue after restart.

Technical answer:

Range ingestion computes the effective start from the stored checkpoint and skips already committed blocks.

Evidence:

- `BlockIngestionService.ingestRange(...)`
- `BlockIngestionServiceTest.ingestRangeResumesFromCheckpointAndSkipsCommittedBlocks`

### In-Memory Overlap Guard

Beginner-friendly:

Only one range ingestion job for Ethereum should run in this backend instance at a time. This avoids accidental duplicate work while the project is still sequential.

Technical answer:

`BlockIngestionService` uses a `ConcurrentHashMap<Long, Long>` keyed by chain id. `putIfAbsent` atomically reserves the chain before the job starts, and a `finally` block releases the reservation after completion or failure.

Evidence:

- `BlockIngestionService.activeRangeJobsByChain`
- `BlockIngestionServiceTest.ingestRangeRejectsOverlappingRangeForSameChain`

## Failure Scenarios Handled

| Scenario | Current Handling | Evidence |
|---|---|---|
| Unsupported chain ID | Rejects request with validation error | `BlockIngestionServiceTest` |
| Start block greater than end block | Rejects request | `BlockIngestionService.validateRequest(...)` |
| Range too large | Rejects request based on config | `BlockIngestionServiceTest` |
| Overlapping same-chain range request in one JVM | Rejects request before creating a second job | `BlockIngestionService.activeRangeJobsByChain` |
| RPC block missing | Throws `RpcFetchException` | `EthereumRpcAdapter` |
| RPC receipt fetch fails | Throws `RpcFetchException` and stops the block ingestion | `EthereumRpcAdapter.fetchTransactionReceipt(...)` |
| Block fails during range ingestion | Records row in `failed_blocks` and marks job failed | `BlockIngestionService`, `BlockJdbcRepository` |
| Failed block retry requested | Marks block `RETRYING`, ingests block, then marks `SUCCESS` if retry works | `BlockIngestionService.retryFailedBlock(...)` |
| Admin checks job status | Reads persisted `ingestion_jobs` row by id | `BlockIngestionService.getJob(...)`, `BlockJdbcRepository.findJobById(...)` |
| Duplicate committed block replay | Unique constraints and `ON CONFLICT DO NOTHING` | Integration test added; requires Docker to run |
| Crash before checkpoint | Transaction rollback should remove partial data | Integration test added; requires Docker to run |
| Restart after checkpoint | Resume skips committed blocks | Unit tested |

## Interview Questions And Answers

| Question | Answer |
|---|---|
| Is this a blockchain app? | No. Ethereum is only the public high-volume data source. The project is a Java backend ETL and warehouse system. |
| Why use PostgreSQL? | It gives ACID transactions, constraints, indexes, and analytical SQL in one mature database. |
| What makes ingestion restart-safe? | Block data and checkpoint update happen in one transaction, and the next run reads the checkpoint. |
| How do you avoid duplicates? | Unique constraints plus `ON CONFLICT DO NOTHING`. |
| Is the current overlap guard distributed? | No. It protects one JVM. Redis `SETNX` is planned for multi-instance deployment. |
| Why not JPA for transaction rows? | JPA is useful for metadata, but batch ETL inserts need direct SQL control. |
| What extra value do receipts add? | They add execution status and actual gas used, which makes the warehouse useful for gas and failure analytics later. |
| What is proven today? | Service resume behavior and validation are unit-tested. PostgreSQL integration tests are written but need Docker running to execute. |
| What is not implemented yet? | Concurrency, Redis caching/locks, circuit breaker wrapping, analytics APIs, dashboard, AWS, CI/CD. |

## Honest Limitations

- Ingestion is sequential, not concurrent yet.
- The active job guard is in-memory only, so it does not protect multiple backend instances yet.
- Token transfer extraction is not implemented yet.
- Transaction receipts are fetched sequentially today, so this is correct but not optimized for high-throughput ingestion yet.
- Redis is configured locally but not used in application logic yet.
- Circuit breaker dependency exists but RPC calls are not wrapped yet.
- Testcontainers integration tests require Docker Desktop to be running.
- No frontend dashboard yet.
- No AWS deployment or CI pipeline yet.

## Resume Bullet

Use this only for the current implemented state:

```text
ChainSight — Java 21 Historical Data Warehouse Backend

Built a Spring Boot backend foundation for a historical Ethereum data warehouse,
including Web3j block fetching, checkpoint-aware sequential range ingestion,
transaction receipt mapping for status and gas-used fields,
in-memory same-chain job overlap protection,
Flyway-managed PostgreSQL schema, JdbcTemplate batch inserts, idempotent
database writes with unique constraints, and unit/Testcontainers tests for
restart-safety scenarios.
```

## Future Topics — Do Not Claim Yet

- Custom `ThreadPoolExecutor` for concurrent extraction.
- `CompletableFuture` pipeline.
- Redis cache.
- Redis distributed ingestion lock.
- Redis token-bucket rate limiter.
- Resilience4j circuit breaker around RPC calls.
- PostgreSQL window-function analytics APIs.
- EXPLAIN ANALYZE benchmark report.
- Dashboard.
- GitHub Actions CI.
- AWS EC2 deployment.
- Nginx reverse proxy.
- ERC-20 token transfer extraction.
