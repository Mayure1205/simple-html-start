# ChainSight API Contract

This is the planned REST contract for the MVP. Endpoints are versioned under `/api/v1`.

## Conventions

- Timestamps are ISO-8601 strings.
- Ethereum addresses are lowercase `0x` strings.
- Large integer blockchain values are returned as strings to avoid precision loss in JavaScript.
- Paginated endpoints accept `page` and `size`.
- Admin endpoints will be protected in a later security sprint.

## Health

### `GET /actuator/health`

Returns Spring Boot Actuator health for the backend and connected dependencies.

## Ingestion

Sprint 2 implements a sequential, checkpoint-aware ingestion path. Later sprints will make this asynchronous and concurrent.

### `POST /api/v1/ingestion/blocks/{blockNumber}`

Fetches and persists one Ethereum block with native transactions.

Response:

```json
{
  "blockNumber": 22000000,
  "blocksInserted": 1,
  "transactionsSeen": 142,
  "transactionsInserted": 142,
  "checkpointUpdated": true,
  "status": "SUCCESS"
}
```

### `POST /api/v1/ingestion/jobs`

Starts a small sequential block-range ingestion job. The range is limited by `ethereum.ingestion.max-range-size` while the project is still sequential.

If the checkpoint is already inside the requested range, the service resumes from `checkpoint + 1` and reports how many requested blocks were skipped.

The current backend allows one active range ingestion job per chain per application instance. A later Redis lock will extend this protection across multiple running instances.

Request:

```json
{
  "chainId": 1,
  "startBlock": 22000000,
  "endBlock": 22000005
}
```

Response `202 Accepted`:

```json
{
  "jobId": 42,
  "chainId": 1,
  "startBlock": 22000000,
  "endBlock": 22000005,
  "resumeFromBlock": 22000000,
  "skippedBlocks": 0,
  "processedBlocks": 6,
  "transactionsInserted": 840,
  "failedBlocks": 0,
  "status": "COMPLETED"
}
```

Restart example after checkpoint `22000002`:

```json
{
  "jobId": 43,
  "chainId": 1,
  "startBlock": 22000000,
  "endBlock": 22000005,
  "resumeFromBlock": 22000003,
  "skippedBlocks": 3,
  "processedBlocks": 3,
  "transactionsInserted": 420,
  "failedBlocks": 0,
  "status": "COMPLETED"
}
```

### `GET /api/v1/ingestion/jobs/{jobId}`

Returns persisted ingestion job status.

Response:

```json
{
  "jobId": 42,
  "chainId": 1,
  "startBlock": 22000000,
  "endBlock": 22000005,
  "status": "COMPLETED",
  "startedAt": "2026-06-12T10:00:00Z",
  "completedAt": "2026-06-12T10:00:45Z",
  "failureReason": null
}
```

### `GET /api/v1/ingestion/status?chainId=1`

Returns aggregate ingestion status for a chain.

Response:

```json
{
  "chainId": 1,
  "lastProcessedBlock": 22000130,
  "indexedBlocks": 130,
  "indexedTransactions": 21450,
  "failedBlockCount": 2,
  "activeJobCount": 1
}
```

### `GET /api/v1/ingestion/failed-blocks?chainId=1&status=PENDING`

Returns failed blocks. The `status` query parameter is optional and can be one of `PENDING`, `RETRYING`, `SUCCESS`, or `DEAD`.

Response:

```json
[
  {
    "chainId": 1,
    "blockNumber": 22000004,
    "failureReason": "RPC timeout",
    "retryCount": 1,
    "status": "PENDING",
    "createdAt": "2026-06-12T10:15:30Z",
    "updatedAt": "2026-06-12T10:20:00Z"
  }
]
```

### `POST /api/v1/ingestion/failed-blocks/{blockNumber}/retry?chainId=1`

Retries one failed block immediately. On success, the failed-block row is marked `SUCCESS`. On failure, it is recorded again as `PENDING` with the latest failure reason.

## Network Analytics

### `GET /api/v1/analytics/network/daily?chainId=1&from=2026-06-01&to=2026-06-12`

Returns daily transaction and value metrics.

Response:

```json
{
  "chainId": 1,
  "from": "2026-06-01",
  "to": "2026-06-12",
  "days": [
    {
      "date": "2026-06-01",
      "blockCount": 7200,
      "transactionCount": 1180000,
      "totalValueWei": "123450000000000000000000",
      "averageGasPriceWei": "32000000000"
    }
  ]
}
```

### `GET /api/v1/analytics/network/largest-transactions?chainId=1&from=2026-06-01&to=2026-06-12&limit=50`

Returns largest indexed native transfers.

## Wallet Analytics

### `GET /api/v1/analytics/wallets/{address}/transactions?chainId=1&page=0&size=50`

Returns indexed sent and received transactions for a wallet.

### `GET /api/v1/analytics/wallets/{address}/summary?chainId=1`

Returns sent value, received value, net flow, and transaction counts.

### `GET /api/v1/analytics/wallets/top?chainId=1&from=2026-06-01&to=2026-06-12&metric=receivedValue&limit=25`

Returns top indexed wallets for a metric.

## Token Analytics

### `GET /api/v1/analytics/tokens/{tokenAddress}/daily?chainId=1&from=2026-06-01&to=2026-06-12`

Returns daily selected-token transfer activity.

### `GET /api/v1/analytics/tokens/{tokenAddress}/largest-transfers?chainId=1&limit=50`

Returns largest indexed token transfers.

## Whale Alerts

### `GET /api/v1/alerts/whales?chainId=1&from=2026-06-01&to=2026-06-12&page=0&size=50`

Returns whale alerts generated from indexed data.

### `POST /api/v1/admin/alerts/whale-thresholds`

Planned endpoint for configuring thresholds.

## Error Shape

All API errors should use this shape:

```json
{
  "timestamp": "2026-06-12T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "errorCode": "INVALID_REQUEST",
  "message": "startBlock must be less than or equal to endBlock",
  "path": "/api/v1/ingestion/jobs"
}
```
