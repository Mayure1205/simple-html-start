# ChainSight Evidence Ledger

This document tracks verifiable engineering decisions and their implementation within the repository. It is designed to be used as a reference during technical interviews.

| Claim | Proof (File / Location) | Status |
|---|---|---|
| Set up local PostgreSQL and Redis dependencies | `infra/docker-compose.local.yml` | `DONE` |
| Created initial Flyway warehouse schema | `backend/src/main/resources/db/migration/V1__init_schema.sql` | `DONE` |
| Documented modular-monolith architecture | `docs/architecture.md`, `docs/adrs/ADR-001-start-with-modular-monolith.md` | `DONE` |
| Defined MVP API contract | `docs/api-contract.md` | `DONE` |
| Implemented Web3j RPC adapter for Ethereum blocks | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java` | `CODED - NEEDS RUNTIME VERIFY` |
| Added block-range ingestion API | `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `CODED - NEEDS RUNTIME VERIFY` |
| Added ingestion service unit tests | `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`; `mvn test` result: 4 tests, 0 failures | `DONE` |
| Used concurrent extraction (ThreadPoolExecutor) | | `TODO` |
| Implemented CompletableFuture pipeline | | `TODO` |
| Built restart-safe ACID checkpointing | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `CODED - TEST TODO` |
| Optimized ingestion with JDBC batch updates | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` | `CODED - BENCHMARK TODO` |
| Improved query performance with B-tree indexes | | `TODO` |
| Used SQL Window functions for analytics | | `TODO` |
| Wrapped RPC calls in Circuit Breaker (Resilience4j) | | `TODO` |
| Used Redis distributed lock to prevent overlapping | | `TODO` |
| Rate-limited APIs via Token Bucket (Redis) | | `TODO` |
| Built a comprehensive test suite (Testcontainers) | | `TODO` |
| Set up GitHub Actions CI pipeline | | `TODO` |
| Hosted on AWS EC2 via Docker Compose | | `TODO` |
| Created Benchmark report | | `TODO` |
