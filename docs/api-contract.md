# ChainSight API Contract

This is the planned REST contract for the MVP. Endpoints are versioned under `/api/v1`.

## Conventions

- Timestamps are ISO-8601 strings.
- Ethereum addresses are lowercase `0x` strings.
- Large integer blockchain values are returned as strings to avoid precision loss in JavaScript.
- Paginated endpoints accept `page` and `size`.
- Admin endpoints will be protected in a later security sprint.
- Ingestion and analytics endpoints are protected by a Redis-backed token bucket rate limiter.

## Health

### `GET /actuator/health`

Returns Spring Boot Actuator health for the backend and connected dependencies.

## Authentication

### `POST /api/v1/auth/register`

Creates an email/password user and returns a JWT access token.

Request:

```json
{
  "email": "mayu@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "tokenType": "Bearer",
  "accessToken": "jwt-token",
  "expiresInSeconds": 86400,
  "user": {
    "id": 1,
    "email": "mayu@example.com",
    "createdAt": "2026-06-13T10:00:00Z"
  }
}
```

### `POST /api/v1/auth/login`

Authenticates an email/password user and returns a JWT access token.

### `GET /api/v1/auth/me`

Requires `Authorization: Bearer <token>`. Returns the authenticated user profile.

## Tracked Wallets

Tracked wallets are per-user watchlist entries. They do not prove wallet ownership; they only let a logged-in user save public addresses they want to monitor.

### `GET /api/v1/tracked-wallets`

Requires JWT. Returns the current user's tracked wallets.

### `POST /api/v1/tracked-wallets`

Requires JWT. Adds a wallet to the current user's watchlist.

Request:

```json
{
  "chainId": 1,
  "walletAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "label": "Main wallet"
}
```

Response:

```json
{
  "id": 1,
  "chainId": 1,
  "walletAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "label": "Main wallet",
  "createdAt": "2026-06-13T10:00:00Z"
}
```

### `DELETE /api/v1/tracked-wallets/{walletId}`

Requires JWT. Removes a tracked wallet owned by the current user.

## Ingestion

The backend implements checkpoint-aware ingestion. Single-block ingestion runs synchronously. Range ingestion is accepted asynchronously: the API returns a job id with `RUNNING`, and the background job performs bounded parallel RPC extraction while database persistence remains ordered by block number.

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

Accepts a block-range ingestion job. The range is limited by `ethereum.ingestion.max-range-size`.

If the checkpoint is already inside the requested range, the service resumes from `checkpoint + 1` and reports how many requested blocks were skipped.

The backend allows one active range ingestion job per chain. A Redis lock protects multiple running instances, and an in-memory guard protects the current JVM.

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
  "processedBlocks": 0,
  "transactionsInserted": 0,
  "failedBlocks": 0,
  "status": "RUNNING"
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
  "processedBlocks": 0,
  "transactionsInserted": 0,
  "failedBlocks": 0,
  "status": "RUNNING"
}
```

Use `GET /api/v1/ingestion/jobs/{jobId}` to check whether the background job later becomes `COMPLETED` or `FAILED`.

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

Returns daily transaction and value metrics from indexed blocks and transactions. The implemented query also returns window-function fields for previous-day transaction count, day-over-day delta, and transaction-count rank.

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
      "averageGasPriceWei": "32000000000",
      "averageGasUsed": 21000.00,
      "previousDayTransactionCount": 1100000,
      "transactionCountDelta": 80000,
      "transactionCountRank": 1
    }
  ]
}
```

### `GET /api/v1/analytics/network/largest-transactions?chainId=1&from=2026-06-01&to=2026-06-12&limit=50`

Returns largest indexed native transfers ranked by `value_wei`. The implemented query uses `RANK()`.

Response:

```json
{
  "chainId": 1,
  "from": "2026-06-01",
  "to": "2026-06-12",
  "limit": 50,
  "transactions": [
    {
      "valueRank": 1,
      "transactionHash": "0xabc",
      "blockNumber": 22000000,
      "fromAddress": "0xaaa",
      "toAddress": "0xbbb",
      "valueWei": "1000000000000000000",
      "gasPriceWei": "32000000000",
      "gasUsed": 21000,
      "status": 1,
      "blockTimestamp": "2026-06-12T10:00:00Z"
    }
  ]
}
```

## Wallet Analytics

### `GET /api/v1/analytics/wallets/{address}/transactions?chainId=1&page=0&size=50`

Returns indexed sent and received native transactions for a wallet. The backend normalizes the wallet address to lowercase and returns `direction` as `SENT` or `RECEIVED`.

Response:

```json
{
  "chainId": 1,
  "address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "page": 0,
  "size": 50,
  "totalTransactions": 1,
  "totalPages": 1,
  "transactions": [
    {
      "transactionHash": "0xtx1",
      "blockNumber": 22000001,
      "direction": "SENT",
      "counterpartyAddress": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "fromAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "toAddress": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "valueWei": "1000000000000000000",
      "gasPriceWei": "32000000000",
      "gasUsed": 21000,
      "status": 1,
      "blockTimestamp": "2026-06-12T09:00:00Z"
    }
  ]
}
```

### `GET /api/v1/analytics/wallets/{address}/summary?chainId=1`

Returns sent value, received value, net flow, and transaction counts.

Response:

```json
{
  "chainId": 1,
  "address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sentCount": 3,
  "receivedCount": 5,
  "sentValueWei": "700000000000000000",
  "receivedValueWei": "2000000000000000000",
  "netFlowWei": "1300000000000000000",
  "firstActivityAt": "2026-06-01T00:00:00Z",
  "lastActivityAt": "2026-06-12T09:00:00Z"
}
```

### `GET /api/v1/analytics/wallets/top?chainId=1&from=2026-06-01&to=2026-06-12&metric=receivedValue&limit=25`

Planned, not implemented. Will return top indexed wallets for a metric.

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

Rate-limited response:

```json
{
  "errorCode": "RATE_LIMITED",
  "message": "Too many requests"
}
```
