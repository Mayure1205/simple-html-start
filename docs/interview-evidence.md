# ChainSight Evidence Ledger

This document tracks verifiable engineering decisions and their implementation within the repository. It is designed to be used as a reference during technical interviews.

| Claim | Proof (File / Location) | Status |
|---|---|---|
| Set up local PostgreSQL and Redis dependencies | `infra/docker-compose.local.yml` | `DONE` |
| Created initial Flyway warehouse schema | `backend/src/main/resources/db/migration/V1__init_schema.sql` | `DONE` |
| Documented modular-monolith architecture | `docs/architecture.md`, `docs/adrs/ADR-001-start-with-modular-monolith.md` | `DONE` |
| Defined MVP API contract | `docs/api-contract.md` | `DONE` |
| Implemented Web3j RPC adapter for Ethereum blocks | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java` | `CODED - NEEDS RUNTIME VERIFY` |
| Added transaction receipt mapping for status and actual gas used | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`, `backend/src/main/resources/db/migration/V1__init_schema.sql` | `CODED - NEEDS RUNTIME VERIFY` |
| Added block-range ingestion API | `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `CODED - NEEDS RUNTIME VERIFY` |
| Added ingestion service unit tests | `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`; earlier `mvn test` result: 5 service tests, 0 failures before later Sprint 2/Sprint 3 additions | `EXPANDED - LATEST RUN PENDING` |
| Used concurrent extraction (ThreadPoolExecutor) | `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Implemented CompletableFuture pipeline | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Added checkpoint-aware range resume | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `UNIT TESTED` |
| Built restart-safe ACID checkpointing | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java` | `INTEGRATION TEST ADDED - DOCKER RUN PENDING` |
| Added failed-block tracking and retry API | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Added ingestion job status API | `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`, `backend/src/main/java/com/chainsight/ingestion/dto/IngestionJobStatusResponse.java`, `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Prevented same-JVM overlapping range ingestion jobs | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Optimized ingestion with JDBC batch updates | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` | `CODED - BENCHMARK TODO` |
| Added B-tree indexes for likely analytics query paths | `backend/src/main/resources/db/migration/V1__init_schema.sql` | `CODED - EXPLAIN ANALYZE TODO` |
| Added network analytics REST APIs | `backend/src/main/java/com/chainsight/analytics/controller/NetworkAnalyticsController.java`, `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java`, `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Used SQL Window functions for analytics | `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Cached network analytics responses in Redis | `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsCacheService.java`, `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Wrapped RPC calls in Circuit Breaker (Resilience4j) | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`, `backend/src/main/resources/application.yml` | `CODED - RUNTIME VERIFY PENDING` |
| Used Redis distributed lock to prevent overlapping | `backend/src/main/java/com/chainsight/resilience/RedisIngestionLockService.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Rate-limited APIs via Token Bucket (Redis) | `backend/src/main/java/com/chainsight/resilience/RedisTokenBucketRateLimiter.java`, `backend/src/main/java/com/chainsight/resilience/ApiRateLimitFilter.java` | `CODED - TESTS ADDED, RUN PENDING` |
| Built a comprehensive test suite (Testcontainers) | | `TODO` |
| Set up GitHub Actions CI pipeline | | `TODO` |
| Hosted on AWS EC2 via Docker Compose | | `TODO` |
| Created Benchmark report | | `TODO` |
