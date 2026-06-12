# ChainSight Benchmark Report

Status: template created, measurements not captured yet.

Use this document only after running benchmarks against a real local or EC2 environment. Do not copy numbers from estimates. Every claim should include date, machine, dataset size, command, and raw output location.

## Environment

| Field | Value |
|---|---|
| Date | TODO |
| Machine | TODO |
| CPU / RAM | TODO |
| Java version | TODO |
| PostgreSQL version | TODO |
| Redis version | TODO |
| Dataset block range | TODO |
| Transaction rows | TODO |
| RPC provider | TODO |

## Ingestion Benchmark

Goal: measure how long ChainSight takes to ingest a fixed block range through the implemented async range-job API.

Record:

- Requested block range.
- Executor settings from `application.yml` or environment variables.
- Job id.
- Start and end timestamps.
- Final job status from `GET /api/v1/ingestion/jobs/{jobId}`.
- Number of blocks processed.
- Number of transactions inserted.
- Failed blocks, if any.

PowerShell command template:

```powershell
$body = @{
  chainId = 1
  startBlock = 19999000
  endBlock = 19999100
} | ConvertTo-Json

$startedAt = Get-Date
$job = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/ingestion/jobs -ContentType "application/json" -Body $body
$job

# Poll manually until COMPLETED or FAILED.
Invoke-RestMethod "http://localhost:8080/api/v1/ingestion/jobs/$($job.jobId)"
$finishedAt = Get-Date
$finishedAt - $startedAt
```

Results:

| Range | Blocks | Transactions inserted | Duration | Failed blocks | Notes |
|---|---:|---:|---:|---:|---|
| TODO | TODO | TODO | TODO | TODO | TODO |

## Analytics Query Benchmark

Goal: prove whether PostgreSQL uses the expected indexes and how expensive the current analytics queries are.

Run `EXPLAIN (ANALYZE, BUFFERS)` in PostgreSQL after loading enough data to make the plan meaningful.

Daily network metrics template:

```sql
EXPLAIN (ANALYZE, BUFFERS)
WITH daily AS (
    SELECT
        b.block_timestamp::date AS metric_date,
        COUNT(DISTINCT b.block_number) AS block_count,
        COUNT(t.id) AS transaction_count,
        COALESCE(SUM(t.value_wei), 0) AS total_value_wei,
        AVG(t.gas_price_wei) AS average_gas_price_wei,
        AVG(t.gas_used)::numeric(20, 2) AS average_gas_used
    FROM blocks b
    LEFT JOIN transactions t
        ON t.chain_id = b.chain_id
       AND t.block_number = b.block_number
    WHERE b.chain_id = 1
      AND b.block_timestamp >= TIMESTAMP '2026-01-01 00:00:00'
      AND b.block_timestamp < TIMESTAMP '2026-01-08 00:00:00'
    GROUP BY b.block_timestamp::date
)
SELECT
    metric_date,
    block_count,
    transaction_count,
    total_value_wei,
    average_gas_price_wei,
    average_gas_used,
    LAG(transaction_count, 1, 0) OVER (ORDER BY metric_date) AS previous_day_transaction_count,
    transaction_count - LAG(transaction_count, 1, 0) OVER (ORDER BY metric_date) AS transaction_count_delta,
    RANK() OVER (ORDER BY transaction_count DESC) AS transaction_count_rank
FROM daily
ORDER BY metric_date ASC;
```

Largest transactions template:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    value_rank,
    transaction_hash,
    block_number,
    from_address,
    to_address,
    value_wei,
    gas_price_wei,
    gas_used,
    status,
    block_timestamp
FROM (
    SELECT
        RANK() OVER (ORDER BY value_wei DESC) AS value_rank,
        transaction_hash,
        block_number,
        from_address,
        to_address,
        value_wei,
        gas_price_wei,
        gas_used,
        status,
        block_timestamp
    FROM transactions
    WHERE chain_id = 1
      AND block_timestamp >= TIMESTAMP '2026-01-01 00:00:00'
      AND block_timestamp < TIMESTAMP '2026-01-08 00:00:00'
) ranked_transactions
WHERE value_rank <= 10
ORDER BY value_rank ASC, block_timestamp DESC, transaction_hash ASC;
```

Results:

| Query | Rows | Planning time | Execution time | Indexes used | Notes |
|---|---:|---:|---:|---|---|
| Daily network metrics | TODO | TODO | TODO | TODO | TODO |
| Largest transactions | TODO | TODO | TODO | TODO | TODO |

## Claims Allowed Only After Results

- Measured ingestion throughput.
- Measured speedup from concurrent receipt fetching.
- Measured index effectiveness.
- Measured analytics latency.
