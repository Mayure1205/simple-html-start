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
| Added ingestion service unit tests | `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`; `mvn test -q` passed with JDK 21 on 2026-06-12, Docker-dependent tests skipped | `UNIT TESTED` |
| Used bounded coordinator/extraction/receipt executors | `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java`, `backend/src/main/resources/application.yml` | `CODED - TESTED WITH DIRECT EXECUTORS` |
| Accepted range jobs asynchronously | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `UNIT TESTED` |
| Used concurrent block extraction (CompletableFuture) | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `UNIT TESTED` |
| Fetched transaction receipts with bounded parallelism | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`, `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java` | `CODED - THROUGHPUT BENCHMARK TODO` |
| Added checkpoint-aware range resume | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `UNIT TESTED` |
| Built restart-safe ACID checkpointing | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java` | `INTEGRATION TEST ADDED - DOCKER RUN PENDING` |
| Added failed-block tracking and retry API | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java` | `UNIT TESTED` |
| Added ingestion job status API | `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`, `backend/src/main/java/com/chainsight/ingestion/dto/IngestionJobStatusResponse.java`, `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` | `UNIT TESTED` |
| Prevented same-JVM overlapping range ingestion jobs | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`, `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java` | `UNIT TESTED` |
| Optimized ingestion with JDBC batch updates | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` | `CODED - BENCHMARK TODO` |
| Added B-tree indexes for likely analytics query paths | `backend/src/main/resources/db/migration/V1__init_schema.sql` | `CODED - EXPLAIN ANALYZE TODO` |
| Added network analytics REST APIs | `backend/src/main/java/com/chainsight/analytics/controller/NetworkAnalyticsController.java`, `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java`, `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java` | `UNIT TESTED` |
| Used SQL Window functions for analytics | `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java` | `CODED - SQL BENCHMARK TODO` |
| Added wallet transaction history API | `backend/src/main/java/com/chainsight/analytics/controller/WalletAnalyticsController.java`, `backend/src/main/java/com/chainsight/analytics/service/WalletAnalyticsService.java`, `backend/src/main/java/com/chainsight/analytics/repository/WalletAnalyticsRepository.java` | `UNIT TEST ADDED - RUN PENDING` |
| Added wallet summary API | `backend/src/main/java/com/chainsight/analytics/controller/WalletAnalyticsController.java`, `backend/src/main/java/com/chainsight/analytics/service/WalletAnalyticsService.java`, `backend/src/main/java/com/chainsight/analytics/repository/WalletAnalyticsRepository.java` | `UNIT TEST ADDED - RUN PENDING` |
| Cached network analytics responses in Redis | `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsCacheService.java`, `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java` | `UNIT TESTED - REAL REDIS VERIFY PENDING` |
| Wrapped RPC calls in Circuit Breaker (Resilience4j) | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`, `backend/src/main/resources/application.yml` | `CODED - RUNTIME VERIFY PENDING` |
| Used Redis distributed lock to prevent overlapping | `backend/src/main/java/com/chainsight/resilience/RedisIngestionLockService.java`, `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `UNIT TESTED - REAL REDIS VERIFY PENDING` |
| Rate-limited APIs via Token Bucket (Redis) | `backend/src/main/java/com/chainsight/resilience/RedisTokenBucketRateLimiter.java`, `backend/src/main/java/com/chainsight/resilience/ApiRateLimitFilter.java` | `UNIT TESTED - REAL REDIS VERIFY PENDING` |
| Built local operational dashboard | `backend/src/main/resources/static/dashboard/index.html`, `backend/src/main/resources/static/dashboard/dashboard.css`, `backend/src/main/resources/static/dashboard/dashboard.js` | `CODED - MANUAL BROWSER VERIFY PENDING` |
| Added wallet lookup to dashboard | `backend/src/main/resources/static/dashboard/index.html`, `backend/src/main/resources/static/dashboard/dashboard.js`, `backend/src/main/resources/static/dashboard/dashboard.css` | `CODED - MANUAL BROWSER VERIFY PENDING` |
| Prepared EC2 Docker Compose deployment artifacts | `backend/Dockerfile`, `infra/docker-compose.prod.yml`, `infra/nginx/chainsight.conf`, `infra/env.prod.example`, `docs/aws-deployment.md` | `CODED - NOT DEPLOYED` |
| Added GitHub Actions backend CI workflow | `.github/workflows/backend-ci.yml` | `WORKFLOW ADDED - REMOTE RUN PENDING` |
| Created benchmark report template | `docs/benchmark-report.md` | `TEMPLATE CREATED - NO MEASUREMENTS YET` |
| Created release readiness checklist | `docs/release-checklist.md` | `CREATED - NOT TAGGED` |
| Built a comprehensive test suite (Testcontainers) | | `TODO` |
| Captured passing GitHub Actions CI run | | `TODO` |
| Hosted on AWS EC2 via Docker Compose | | `TODO` |
| Filled benchmark report with real results | | `TODO` |
| Created release tag `v1.0.0` | | `TODO` |
