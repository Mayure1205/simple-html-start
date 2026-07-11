# Performance Interview Notes

## Rule

Never invent performance numbers. Only add numbers after real measurement with date, machine, dataset, command, and raw output location.

## Current Status

Implemented but not measured:

- JDBC batch insert code.
- B-tree indexes.
- Window-function analytics.
- Redis network analytics cache.
- Bounded concurrent block and receipt extraction.

Measured results:

- No real `EXPLAIN ANALYZE` results captured yet.
- No ingestion throughput benchmark captured yet.
- No API latency benchmark captured yet.
- No load test captured yet.

## Code Mapping

- Benchmark template: `docs/benchmark-report.md`
- Network analytics repository: `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java`
- Wallet analytics repository: `backend/src/main/java/com/chainsight/analytics/repository/WalletAnalyticsRepository.java`
- JDBC repository: `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- Index migration: `backend/src/main/resources/db/migration/V1__init_schema.sql`

## What To Measure Later

- Ingestion time for a fixed block range.
- Transactions inserted per second.
- Receipt fetch time with bounded pool settings.
- `EXPLAIN ANALYZE` for wallet history before/after indexes if possible.
- `EXPLAIN ANALYZE` for daily network metrics.
- API latency with and without Redis cache.

## Interview Answer If Asked Today

The project has performance-oriented design choices such as JDBC batching, indexes, Redis caching, and bounded concurrency, but I have not captured real benchmark numbers yet. I intentionally avoid claiming measured performance until I run `EXPLAIN ANALYZE` and ingestion benchmarks on local Docker or EC2.

## Do Not Claim Yet

- Faster by X%.
- N transactions/sec.
- P95 latency.
- EXPLAIN ANALYZE improvement.
