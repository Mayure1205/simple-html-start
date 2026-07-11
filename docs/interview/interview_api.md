# API Interview Notes

## 30 Second Answer

ChainSight exposes REST APIs for ingestion, job status, failed-block retry, network analytics, wallet analytics, authentication, and tracked-wallet watchlists. APIs are versioned under `/api/v1`.

## API Groups

Authentication:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/nonce?walletAddress={address}`
- `POST /api/v1/auth/wallet-login`
- `GET /api/v1/auth/me`

Tracked wallets:

- `GET /api/v1/tracked-wallets`
- `POST /api/v1/tracked-wallets`
- `DELETE /api/v1/tracked-wallets/{walletId}`

Ingestion:

- `POST /api/v1/ingestion/blocks/{blockNumber}`
- `POST /api/v1/ingestion/jobs`
- `GET /api/v1/ingestion/jobs/{jobId}`
- `GET /api/v1/ingestion/status`
- `GET /api/v1/ingestion/failed-blocks`
- `POST /api/v1/ingestion/failed-blocks/{blockNumber}/retry`

Analytics:

- `GET /api/v1/analytics/network/daily`
- `GET /api/v1/analytics/network/largest-transactions`
- `GET /api/v1/analytics/wallets/{address}/transactions`
- `GET /api/v1/analytics/wallets/{address}/summary`

## Code Mapping

- API contract: `docs/api-contract.md`
- Ingestion controller: `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`
- Network analytics controller: `backend/src/main/java/com/chainsight/analytics/controller/NetworkAnalyticsController.java`
- Wallet analytics controller: `backend/src/main/java/com/chainsight/analytics/controller/WalletAnalyticsController.java`
- Auth controller: `backend/src/main/java/com/chainsight/auth/controller/AuthController.java`
- Tracked wallet controller: `backend/src/main/java/com/chainsight/wallet/controller/TrackedWalletController.java`
- Global exception handler: `backend/src/main/java/com/chainsight/exception/GlobalExceptionHandler.java`

## Concepts Used

| Concept | Why used |
|---|---|
| REST controllers | Simple HTTP interface for backend behavior |
| DTO records | Stable request/response shape |
| Validation | Reject invalid inputs before service/database work |
| Global exception handler | Consistent error response body |
| JWT bearer auth | Protect user-specific APIs |
| Rate limiting filter | Protect ingestion/analytics endpoints from abuse |

## Failure Scenarios

| Failure | Handling |
|---|---|
| Invalid request body | Validation/global exception handler returns client error |
| Missing JWT | Spring Security returns unauthorized for protected APIs |
| Duplicate tracked wallet | Service maps duplicate DB key to friendly error |
| Unsupported chain id | Services reject non-MVP chain ids |
| Rate limit exceeded | Redis token bucket filter returns rate-limited response |

## Do Not Claim Yet

- Public API versioning beyond `/api/v1`.
- OpenAPI/Swagger generation.
- Admin RBAC.
- Production API latency numbers.
