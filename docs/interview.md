# ChainSight Interview Guide

This file is the living interview guide for ChainSight. It must only describe features that are actually implemented, coded, or tested in this repository. Planned items belong under **Future Topics — Do Not Claim Yet**.

## Project Overview

### 30-Second Explanation

Beginner-friendly:

ChainSight is a backend data engineering project. It takes Ethereum block data from a public RPC provider, transforms it into structured records, and stores it in PostgreSQL so the data can be queried later.

Technical interview answer:

ChainSight is a Java 21 and Spring Boot historical-data warehouse using Ethereum as a public high-volume data source. The implemented backend currently supports Web3j-based block and transaction receipt fetching, bounded concurrent block extraction with `CompletableFuture`, checkpoint-aware ordered persistence, JDBC batch inserts, Flyway-managed PostgreSQL schema, and network analytics APIs using PostgreSQL window functions.

### 2-Minute Explanation

Beginner-friendly:

Ethereum is not the product here. It is the data source. The real engineering problem is how to ingest many historical records safely without duplicating data, losing progress, or making the database messy after failures.

Technical interview answer:

The project is a modular Spring Boot backend. The implemented ingestion slice fetches full Ethereum blocks using Web3j, fetches transaction receipts for execution metadata, maps blocks and native transactions into Java records, and persists them through a `JdbcTemplate` repository. Sprint 3 adds a bounded custom `ThreadPoolExecutor` and `CompletableFuture` scheduling so multiple blocks can be extracted from RPC concurrently. PostgreSQL writes still happen in block-number order, and each block persistence operation is wrapped in a Spring `TransactionTemplate`, so block rows, transaction rows, wallet rows, and checkpoint updates are committed atomically. Sprint 4 starts the analytics layer with SQL-backed network endpoints for daily metrics and largest transactions, including `LAG()` and `RANK()` window functions.

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
| Ingestion executor bean | `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java` |
| RPC adapter | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java` |
| Ingestion service | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` |
| JDBC repository | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` |
| REST API | `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java` |
| Network analytics API | `backend/src/main/java/com/chainsight/analytics/controller/NetworkAnalyticsController.java` |
| Network analytics service | `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java` |
| Network analytics repository | `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java` |
| Global errors | `backend/src/main/java/com/chainsight/exception/GlobalExceptionHandler.java` |
| Schema | `backend/src/main/resources/db/migration/V1__init_schema.sql` |
| Unit tests | `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` |
| Analytics unit tests | `backend/src/test/java/com/chainsight/analytics/service/NetworkAnalyticsServiceTest.java` |
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

### Sprint 3 - Bounded Concurrent Extraction

Status:

- Implemented in code.
- Unit tests added but not run in this turn because we are avoiding heavier commands.

What was built:

- A custom bounded `ThreadPoolExecutor` bean for block extraction.
- Configurable executor settings in `application.yml`.
- A `CompletableFuture` pipeline that schedules block RPC fetches concurrently for a range.
- Ordered persistence after extraction, so checkpoint updates remain simple and restart-safe.
- Executor lifecycle cleanup through Spring bean destroy method.
- Startup validation for invalid executor settings.

Why it was needed:

- Fetching blocks and receipts from RPC is I/O-bound. While one RPC call is waiting on the network, other block fetches can make progress. This improves the ingestion architecture without making database checkpointing unsafe.

Where it is used:

- Executor config: `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java`
- Executor properties: `backend/src/main/resources/application.yml`
- CompletableFuture scheduling: `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- Unit proof: `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`

Java/Spring concepts:

- `ThreadPoolExecutor`.
- Bounded `LinkedBlockingQueue`.
- Custom thread naming.
- `CallerRunsPolicy` backpressure.
- `CompletableFuture.supplyAsync`.
- Spring `@Bean` and `@Qualifier`.
- Spring bean lifecycle destroy method.

Beginner-friendly explanation:

Before Sprint 3, ChainSight fetched one block, saved it, then fetched the next block. Now it can ask the RPC provider for multiple blocks in parallel, but it still saves them in order. This gives better throughput while keeping recovery logic easy to reason about.

Technical interview answer:

Range ingestion creates one `CompletableFuture<BlockData>` per block using a named `blockExtractionExecutor`. The executor has bounded threads and bounded queue capacity to avoid unbounded memory growth. After scheduling the extraction futures, the service joins them in block-number order and persists each block in its own transaction. This keeps checkpoint advancement ordered while allowing network-bound RPC extraction to overlap.

The executor bean also uses `destroyMethod = "shutdown"` so Spring shuts down worker threads when the application context closes. Invalid pool settings fail fast at startup.

Possible interviewer questions:

| Question | Short Answer |
|---|---|
| Why not write blocks concurrently too? | Ordered writes keep checkpoint recovery simpler for the MVP. |
| Why a bounded executor? | It prevents too many RPC tasks from consuming memory or overwhelming the provider. |
| What does `CallerRunsPolicy` do? | If the pool and queue are full, the caller thread runs the task, creating natural backpressure. |
| Where is `CompletableFuture` used? | `BlockIngestionService.scheduleBlockExtraction(...)` uses `supplyAsync`. |
| How are worker threads cleaned up? | The executor bean declares `destroyMethod = "shutdown"`. |

Evidence:

- Code: `IngestionExecutorConfig.java`.
- Code: `BlockIngestionService.scheduleBlockExtraction(...)`.
- Test added: `BlockIngestionServiceTest.ingestRangeSchedulesAllBlockFetchesBeforePersistingInOrder`.

### Sprint 4 - Network Analytics APIs

Status:

- Implemented in code.
- Service tests added but not run in this turn because we are avoiding heavier commands.
- `EXPLAIN ANALYZE` benchmarks are not done yet.

What was built:

- `GET /api/v1/analytics/network/daily`
- `GET /api/v1/analytics/network/largest-transactions`
- SQL repository for daily network metrics.
- SQL repository for ranked largest native transactions.
- Window functions with `LAG()` and `RANK()`.
- API DTOs that return Wei values as strings to avoid JavaScript precision problems.

Why it was needed:

- Ingestion alone stores data, but analytics APIs prove the warehouse can answer useful questions. Sprint 4 starts with network-level analytics because it can be built directly from the indexed `blocks` and `transactions` tables.

Where it is used:

- Controller: `backend/src/main/java/com/chainsight/analytics/controller/NetworkAnalyticsController.java`
- Service: `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java`
- Repository: `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java`
- DTOs: `backend/src/main/java/com/chainsight/analytics/dto`
- Tests: `backend/src/test/java/com/chainsight/analytics/service/NetworkAnalyticsServiceTest.java`
- API docs: `docs/api-contract.md`

Java/Spring/PostgreSQL concepts:

- Spring `@RestController`, `@Service`, and `@Repository`.
- `JdbcTemplate` analytical reads.
- `LocalDate` query parameters.
- `RANK()` for largest transaction ranking.
- `LAG()` for previous-day comparison.
- B-tree indexes on timestamp and value query paths.

Beginner-friendly explanation:

The ingestion pipeline fills the warehouse. The analytics endpoints read from that warehouse and answer questions like “how many transactions happened per day?” and “which transactions moved the most Wei?”

Technical interview answer:

Network analytics are implemented as SQL-first repository methods using `JdbcTemplate`. The daily endpoint groups indexed blocks and transactions by date, then uses `LAG()` to compare each day with the previous day and `RANK()` to rank days by transaction count. The largest-transactions endpoint ranks transactions by `value_wei` using `RANK()`. Large blockchain numeric values are returned as strings in the API response.

Possible interviewer questions:

| Question | Short Answer |
|---|---|
| Why use SQL for analytics instead of Java loops? | PostgreSQL is optimized for aggregation, filtering, sorting, indexes, and window functions. |
| Where are window functions used? | `NetworkAnalyticsRepository.findDailyMetrics(...)` and `findLargestTransactions(...)`. |
| Why return Wei as strings? | JavaScript cannot safely represent very large integers as normal numbers. |
| Are analytics benchmarks complete? | Not yet. `EXPLAIN ANALYZE` evidence is planned before claiming measured performance. |

Evidence:

- Code: `NetworkAnalyticsRepository.java`.
- API contract: `docs/api-contract.md`.
- Test added: `NetworkAnalyticsServiceTest.java`.

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
| `ThreadPoolExecutor` | `IngestionExecutorConfig.blockExtractionExecutor(...)` | Runs bounded block extraction workers. |
| `CompletableFuture` | `BlockIngestionService.scheduleBlockExtraction(...)` | Schedules RPC fetches concurrently. |
| `LocalDate` | `NetworkAnalyticsController` | Accepts date-range query parameters for analytics. |
| `BigDecimal` | Analytics DTOs and repository mapping | Represents SQL numeric analytics values safely. |

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
| `@Bean` | `IngestionExecutorConfig` | Registers the custom executor in the Spring container. |
| `@Qualifier` | `BlockIngestionService` constructor | Injects the named block extraction executor. |
| `@RestController` for analytics | `NetworkAnalyticsController` | Exposes network analytics endpoints. |
| `@DateTimeFormat` | `NetworkAnalyticsController` | Parses ISO date request parameters. |

## PostgreSQL And SQL Concepts Used

Implemented:

- Flyway migration for schema versioning.
- Unique constraints for idempotency.
- Foreign keys for relational integrity.
- `ON CONFLICT DO NOTHING` for safe replay.
- Checkpoint table for restart progress.
- B-tree indexes for likely wallet/time/block queries.
- SQL aggregation for daily network metrics.
- Window functions with `LAG()` and `RANK()`.
- Transaction rollback behavior tested in Testcontainers test code.

Important files:

- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java`
- `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java`

## Concurrency Concepts Used

Implemented now:

- `ConcurrentHashMap` guard for active range ingestion jobs in one backend JVM.
- Bounded custom `ThreadPoolExecutor` for block extraction.
- `CompletableFuture.supplyAsync` pipeline for range RPC fetch scheduling.

Important:

Do not claim distributed locking or concurrent database writes yet.

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

### Parallel Extract, Ordered Load

Beginner-friendly:

The app can fetch several blocks at the same time, but it saves them one-by-one in order.

Technical answer:

This is an ETL trade-off. Extraction is parallelized because RPC calls are I/O-bound. Loading is ordered because checkpoint correctness is easier when block `N` is committed before block `N + 1`.

Evidence:

- `BlockIngestionService.scheduleBlockExtraction(...)`
- `BlockIngestionService.persistFetchedBlock(...)`

## Failure Scenarios Handled

| Scenario | Current Handling | Evidence |
|---|---|---|
| Unsupported chain ID | Rejects request with validation error | `BlockIngestionServiceTest` |
| Start block greater than end block | Rejects request | `BlockIngestionService.validateRequest(...)` |
| Range too large | Rejects request based on config | `BlockIngestionServiceTest` |
| Overlapping same-chain range request in one JVM | Rejects request before creating a second job | `BlockIngestionService.activeRangeJobsByChain` |
| Executor queue saturation | Uses `CallerRunsPolicy` backpressure | `IngestionExecutorConfig` |
| Invalid executor configuration | Fails startup with `IllegalArgumentException` | `IngestionExecutorConfig.validateExecutorSettings(...)` |
| Unsupported analytics chain ID | Rejects request | `NetworkAnalyticsServiceTest` |
| Invalid analytics date range | Rejects request | `NetworkAnalyticsServiceTest` |
| Analytics limit too large | Rejects request | `NetworkAnalyticsServiceTest` |
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
| What is the Sprint 3 concurrency model? | Parallel RPC extraction with ordered database persistence. |
| What analytics are implemented? | Network daily metrics and largest native transactions. |
| Which SQL window functions are used? | `LAG()` for previous-day comparison and `RANK()` for rankings. |
| Why not JPA for transaction rows? | JPA is useful for metadata, but batch ETL inserts need direct SQL control. |
| What extra value do receipts add? | They add execution status and actual gas used, which makes the warehouse useful for gas and failure analytics later. |
| What is proven today? | Service resume behavior and validation are unit-tested. PostgreSQL integration tests are written but need Docker running to execute. |
| What is not implemented yet? | Redis caching/locks, circuit breaker wrapping, wallet/token analytics, dashboard, AWS, CI/CD. |

## Honest Limitations

- RPC extraction is concurrent, but database persistence is still ordered and not parallel.
- The active job guard is in-memory only, so it does not protect multiple backend instances yet.
- Analytics currently covers network-level views only.
- `EXPLAIN ANALYZE` benchmarks are not captured yet.
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
including Web3j block fetching, bounded CompletableFuture-based range extraction,
checkpoint-aware ordered persistence,
transaction receipt mapping for status and gas-used fields,
PostgreSQL window-function network analytics APIs,
in-memory same-chain job overlap protection,
Flyway-managed PostgreSQL schema, JdbcTemplate batch inserts, idempotent
database writes with unique constraints, and unit/Testcontainers tests for
restart-safety scenarios.
```

## Future Topics — Do Not Claim Yet

- Redis cache.
- Redis distributed ingestion lock.
- Redis token-bucket rate limiter.
- Resilience4j circuit breaker around RPC calls.
- Wallet analytics APIs.
- Token analytics APIs.
- EXPLAIN ANALYZE benchmark report.
- Dashboard.
- GitHub Actions CI.
- AWS EC2 deployment.
- Nginx reverse proxy.
- ERC-20 token transfer extraction.
