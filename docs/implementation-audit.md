# ChainSight Implementation Audit

Date: 2026-06-16  
Last updated: 2026-06-17  
Purpose: summarize what is implemented, what is pending, which concepts are already present, and what the static security scan found.

This document is an implementation audit, not a resume claim sheet. Anything marked "pending" or "unverified" should not be claimed as completed in interviews.

## Executive Status

ChainSight is broadly still following the original plan: it is a Java/Spring Boot modular monolith for historical Ethereum data ingestion, warehouse persistence, analytics APIs, Redis-backed resilience, JWT auth, tracked wallets, wallet-signature login, and a static dashboard.

Current health:

| Area | Status | Notes |
|---|---|---|
| Core ingestion | Implemented | Block/range ingestion, async range jobs, checkpointing, failed-block handling |
| Restart safety | Implemented, runtime startup cleanup verified | Unit tests pass; stale job cleanup verified at startup; Testcontainers tests still skipped |
| PostgreSQL warehouse | Implemented | Flyway schema, constraints, B-tree indexes, `JdbcTemplate` writes |
| Analytics APIs | Implemented | Network daily metrics, largest transactions, wallet summary/history |
| Redis resilience | Implemented, local Redis paths verified | Cache and token bucket verified against Redis; ingestion lock path exercised through an authenticated job |
| Auth/security | Implemented, runtime verified | JWT, BCrypt, wallet signature login, protected ingestion APIs, and auth endpoint rate limiting exist |
| Dashboard | Implemented but visually not final | Functional dashboard with account, ingestion, analytics, wallet lookup, failures, wallet modal |
| Docker/AWS | Local Docker verified with port caveat | Local Compose works using a temporary `5433` override because Windows PostgreSQL owns `5432`; live AWS proof pending |
| Evidence | Runtime pass added | Maven/runtime/security evidence added; benchmark numbers, EXPLAIN ANALYZE, CI run link, AWS URL pending |

Bottom line: implementation is moving in the right direction. The first stabilization pass fixed the biggest route-protection gap, auth endpoint rate limiting, stale job reconciliation, and health-detail configurability. The 2026-06-17 runtime pass verified Maven tests, Docker Postgres/Redis, Flyway, JWT route protection, auth rate limiting, public analytics, Redis cache/rate-limit behavior, and stale job cleanup. Testcontainers, benchmarks, EXPLAIN ANALYZE, CI run link, and AWS evidence are still pending.

## Stabilization Update - 2026-06-16

Completed after this audit:

- `SecurityConfig.java` now protects `/api/v1/ingestion/**`, `/api/v1/tracked-wallets/**`, `/api/v1/auth/me`, non-public `/actuator/**`, and non-public `/api/v1/**`.
- Public routes are now limited to dashboard/static access, basic health, auth entry points, and `GET /api/v1/analytics/**`.
- `ApiRateLimitFilter.java` now rate-limits auth entry points: login, register, nonce, and wallet-login.
- `RedisTokenBucketRateLimiter.java` supports stricter per-call capacity/refill settings for auth endpoints.
- `IngestionJobStartupReconciler.java` marks stale `PENDING/RUNNING` ingestion jobs as `FAILED` on startup after the configured timeout.
- `BlockIngestionService.java` exposes a startup-only cleanup method for the local active-job guard.
- `infra/docker-compose.local.yml` now maps PostgreSQL as `5432:5432`, matching the app default.
- `application.yml` now makes health details configurable through `MANAGEMENT_HEALTH_SHOW_DETAILS`, defaulting to `when_authorized`.

Verified:

- `cd backend && mvn -q -DskipTests compile` passed.
- `cd backend && mvn -q "-Dtest=ApiRateLimitFilterTest" test` passed.
- `cd backend && mvn -q "-Dtest=IngestionJobStartupReconcilerTest" test` passed.
- `node --check backend/src/main/resources/static/dashboard/dashboard.js` passed.

Runtime verification completed on 2026-06-17. Remaining gaps are Docker-backed Testcontainers execution, benchmarks, EXPLAIN ANALYZE, CI proof, and AWS proof.

## Runtime Verification Update - 2026-06-17

Verified:

- `cd backend && mvn test` finished with `BUILD SUCCESS`.
- Maven reported tests run `47`, failures `0`, errors `0`, skipped `3`.
- The skipped tests were Testcontainers-backed `BlockJdbcRepositoryIntegrationTest` cases because Maven could not detect a valid Docker environment on Windows.
- Docker Compose local PostgreSQL and Redis reached `healthy`.
- Backend started successfully against Docker PostgreSQL using runtime `POSTGRES_PORT=5433`.
- Flyway validated 3 migrations and reported schema version `3`.
- `GET /actuator/health` returned `200`.
- Unauthenticated `POST /api/v1/ingestion/jobs` returned `401`.
- `POST /api/v1/auth/register` returned a JWT, and `GET /api/v1/auth/me` returned the registered user.
- Authenticated `POST /api/v1/ingestion/jobs` returned `202`; job `3` completed.
- Public `GET /api/v1/analytics/network/daily` returned `200`.
- Public wallet summary for `0xD44b94C80d313eb8Bfba9D15e0A0a440b6a5faC9` returned `200` with zero local activity.
- Auth login rate limiting returned `429` after the configured burst was exhausted.
- Redis contained rate-limit keys and an analytics cache key with TTL.
- Startup reconciliation marked one stale job as `FAILED`.
- Generated Spring Basic auth password did not bypass JWT; protected ingestion status still returned `401`.

Important caveats:

- The local Windows service `postgresql-x64-18` owns host port `5432`. With the repo default `5432:5432`, the backend initially connected to the wrong PostgreSQL and Flyway failed with `FATAL: password authentication failed for user "chainsight_user"`.
- For this verification pass, Docker Compose was run with a temporary stdin override mapping Docker PostgreSQL to `5433:5432`, and the backend was started with `POSTGRES_PORT=5433`.
- The authenticated ingestion job was a checkpoint-skip job: range `0..0` resumed from checkpoint `25327683`, processed `0` blocks, and completed. This verifies JWT and job orchestration, not fresh RPC ingestion throughput.
- Local data currently contains `3` blocks and `741` transactions, with checkpoint `25327682`.

## Current Changed Files

Uncommitted working tree changes were found in:

- `README.md`
- `backend/src/main/java/com/chainsight/auth/**`
- `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- `backend/src/main/resources/static/dashboard/**`
- `backend/src/test/java/com/chainsight/auth/service/AuthServiceTest.java`
- `docs/**`
- `infra/docker-compose.local.yml`

Untracked docs folder:

- `docs/interview/`

## Implemented Features So Far

### 1. Project Foundation

What exists:

- Spring Boot backend.
- Java 21 Maven project.
- PostgreSQL and Redis local Docker Compose.
- Flyway migrations.
- Architecture, API contract, ERD, runbook, sprint roadmap, benchmark template, release checklist.

Important files:

- `backend/pom.xml`
- `backend/src/main/java/com/chainsight/ChainSightApplication.java`
- `backend/src/main/resources/application.yml`
- `infra/docker-compose.local.yml`
- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `docs/architecture.md`
- `docs/database-erd.md`
- `docs/api-contract.md`
- `docs/sprint-roadmap.md`

### 2. PostgreSQL Warehouse Schema

What exists:

- `chains`
- `blocks`
- `transactions`
- `wallets`
- `token_contracts`
- `token_transfers`
- `wallet_balance_snapshots`
- `daily_network_metrics`
- `ingestion_jobs`
- `ingestion_checkpoints`
- `failed_blocks`
- `whale_alerts`
- `app_users`
- `user_tracked_wallets`

Implemented database concepts:

- Primary keys.
- Foreign keys.
- Unique constraints.
- B-tree indexes for block/time/wallet queries.
- `NUMERIC(78,0)` for Ethereum Wei-scale values.
- Flyway migrations.

Important files:

- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `backend/src/main/resources/db/migration/V2__auth_and_tracked_wallets.sql`
- `backend/src/main/resources/db/migration/V3__add_wallet_auth.sql`

### 3. Ethereum Ingestion

What exists:

- Web3j RPC adapter.
- Block fetch by block number.
- Full transaction object mapping.
- Transaction receipt fetching for `gasUsed` and status.
- Address normalization to lowercase.
- JDBC insert for blocks and transactions.
- Wallet upsert from transaction participants.
- Checkpoint update.

Important files:

- `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`
- `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- `backend/src/main/java/com/chainsight/ingestion/model/BlockData.java`
- `backend/src/main/java/com/chainsight/ingestion/model/TransactionData.java`

### 4. Restart-Safe Range Jobs

What exists:

- Range job endpoint.
- Resume from `checkpoint + 1`.
- Duplicate-safe inserts using unique constraints and `ON CONFLICT DO NOTHING`.
- One transaction per block.
- Failed-block recording.
- Failed-block retry endpoint.
- Job status table.

Important files:

- `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`
- `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`
- `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java`

Known gap:

- If the app crashes after a job row is marked `RUNNING`, the row may remain active. Local API currently reports `activeJobCount: 1`. Add startup reconciliation or an admin cleanup endpoint before demo.

### 5. Concurrency And Async Ingestion

What exists:

- Async range acceptance.
- Dedicated job coordinator executor.
- Dedicated block extraction executor.
- Dedicated receipt fetch executor.
- `CompletableFuture.supplyAsync`, `runAsync`, `allOf`, `join`.
- Ordered persistence after concurrent fetch.
- In-memory per-chain active-job guard.
- Redis distributed ingestion lock.

Important files:

- `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java`
- `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`
- `backend/src/main/java/com/chainsight/resilience/RedisIngestionLockService.java`
- `backend/src/main/resources/application.yml`

### 6. Network Analytics

What exists:

- Daily network metrics.
- Largest transactions.
- SQL aggregation.
- SQL window functions: `LAG()` and `RANK()`.
- Redis cache for network analytics responses.

Important files:

- `backend/src/main/java/com/chainsight/analytics/controller/NetworkAnalyticsController.java`
- `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsService.java`
- `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsCacheService.java`
- `backend/src/main/java/com/chainsight/analytics/repository/NetworkAnalyticsRepository.java`
- `backend/src/test/java/com/chainsight/analytics/service/NetworkAnalyticsServiceTest.java`

### 7. Wallet Analytics

What exists:

- Wallet transaction history over indexed native ETH transactions.
- Wallet summary: sent count, received count, sent Wei, received Wei, net flow, first/last activity.
- Pagination validation.
- Ethereum address validation.

Important files:

- `backend/src/main/java/com/chainsight/analytics/controller/WalletAnalyticsController.java`
- `backend/src/main/java/com/chainsight/analytics/service/WalletAnalyticsService.java`
- `backend/src/main/java/com/chainsight/analytics/repository/WalletAnalyticsRepository.java`
- `backend/src/test/java/com/chainsight/analytics/service/WalletAnalyticsServiceTest.java`

Important limitation:

- Wallet analytics only searches the local indexed `transactions` table. It is not a live Etherscan replacement.
- Current local warehouse evidence: `indexedBlocks=3`, `indexedTransactions=741`.
- Wallet `0xD44b94C80d313eb8Bfba9D15e0A0a440b6a5faC9` returned zero activity locally because it is not present in the currently indexed sample blocks.
- ERC-20 token transfers and internal transactions are not implemented.

### 8. JWT Auth And Tracked Wallets

What exists:

- Email/password registration.
- Email/password login.
- BCrypt password hashing.
- Custom HMAC-SHA256 JWT creation and validation.
- `Authorization: Bearer` auth filter.
- Authenticated current-user endpoint.
- Per-user tracked wallet CRUD.

Important files:

- `backend/src/main/java/com/chainsight/auth/controller/AuthController.java`
- `backend/src/main/java/com/chainsight/auth/service/AuthService.java`
- `backend/src/main/java/com/chainsight/auth/service/JwtService.java`
- `backend/src/main/java/com/chainsight/auth/security/SecurityConfig.java`
- `backend/src/main/java/com/chainsight/auth/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/chainsight/wallet/controller/TrackedWalletController.java`
- `backend/src/main/java/com/chainsight/wallet/service/TrackedWalletService.java`
- `backend/src/main/java/com/chainsight/wallet/repository/TrackedWalletRepository.java`

### 9. Wallet Signature Login

What exists:

- Redis-backed nonce generation.
- Nonce response returns the exact message to sign.
- `personal_sign` signature verification with Web3j.
- Nonce deletion after successful login.
- Wallet-user creation or lookup.
- JWT returned after wallet proof.

Important files:

- `backend/src/main/java/com/chainsight/auth/dto/NonceResponse.java`
- `backend/src/main/java/com/chainsight/auth/dto/WalletLoginRequest.java`
- `backend/src/main/java/com/chainsight/auth/service/AuthService.java`
- `backend/src/test/java/com/chainsight/auth/service/AuthServiceTest.java`

Important limitation:

- This is not full SIWE compliance yet. The message does not yet include every SIWE-style field such as domain, URI, chain id, issued-at, and expiration.
- WalletConnect path is coded, but production verification with a real Reown Project ID is still pending.

### 10. Resilience

What exists:

- Redis distributed lock around range jobs.
- Redis token-bucket rate limiter for ingestion and analytics APIs.
- Resilience4j circuit breaker around Ethereum RPC calls.
- Redis-backed analytics cache.
- Failed-block tracking.

Important files:

- `backend/src/main/java/com/chainsight/resilience/RedisIngestionLockService.java`
- `backend/src/main/java/com/chainsight/resilience/RedisTokenBucketRateLimiter.java`
- `backend/src/main/java/com/chainsight/resilience/ApiRateLimitFilter.java`
- `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsCacheService.java`
- `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`

### 11. Dashboard

What exists:

- Static Spring-served dashboard.
- Sidebar navigation.
- Ingestion controls.
- Network analytics charts and table.
- Wallet lookup and tracked-wallet controls.
- Failed-block list and retry button.
- Email/password auth panel.
- Wallet provider modal with provider-neutral rows.
- Wallet sign-in steps.
- Settings popover for API endpoint and WalletConnect Project ID.

Important files:

- `backend/src/main/resources/static/dashboard/index.html`
- `backend/src/main/resources/static/dashboard/dashboard.css`
- `backend/src/main/resources/static/dashboard/dashboard.js`

Recent security fix applied:

- Dynamic dashboard rows now escape HTML for wallet labels, transaction values, transaction hashes, failed-block reasons, and reset messages before using `innerHTML`.

### 12. DevOps And Deployment Readiness

What exists:

- Local Docker Compose for PostgreSQL and Redis.
- Production Docker Compose with backend, PostgreSQL, Redis, and Nginx.
- Backend Dockerfile with non-root runtime user.
- GitHub Actions workflow for Maven tests on Java 21.
- AWS EC2 deployment runbook.
- Benchmark report template.

Important files:

- `infra/docker-compose.local.yml`
- `infra/docker-compose.prod.yml`
- `infra/nginx/chainsight.conf`
- `backend/Dockerfile`
- `.github/workflows/backend-ci.yml`
- `docs/aws-deployment.md`
- `docs/benchmark-report.md`

## Concepts Already Used

Tracked interviewable concepts observed in code/docs: 78.

### Core Java - 12

- Records and DTO-style data carriers.
- `BigInteger` and `BigDecimal`.
- `Optional`.
- Streams and collectors.
- `List`, `Set`, `Map`, `ConcurrentHashMap`.
- Regex validation.
- `SecureRandom`.
- Custom exceptions and exception wrapping.
- Immutable response objects.
- Base64 URL encoding.
- HMAC primitives.
- Constructor-based composition.

### Spring Boot - 15

- `@SpringBootApplication`.
- REST controllers.
- Service layer.
- Repository layer.
- Dependency injection.
- `@Value` configuration.
- Jakarta validation.
- `JdbcTemplate`.
- `TransactionTemplate`.
- Spring Security filter chain.
- `OncePerRequestFilter`.
- BCrypt `PasswordEncoder`.
- `StringRedisTemplate`.
- Actuator.
- Flyway migrations.

### PostgreSQL And SQL - 13

- Flyway versioned migrations.
- Foreign keys.
- Unique constraints.
- B-tree indexes.
- `NUMERIC(78,0)` for Wei.
- Batch insert.
- `ON CONFLICT DO NOTHING`.
- Upsert with `ON CONFLICT DO UPDATE`.
- ACID transactions.
- Time range queries.
- Aggregations.
- Window functions: `LAG`, `RANK`.
- Pagination with `LIMIT/OFFSET`.

### Concurrency And Resilience - 10

- Custom `ThreadPoolExecutor`.
- Bounded queues.
- `CallerRunsPolicy` backpressure.
- `CompletableFuture.supplyAsync`.
- `CompletableFuture.runAsync`.
- `CompletableFuture.allOf`.
- Separate executor pools to avoid nested deadlock.
- In-memory active-job guard.
- Redis distributed lock.
- Resilience4j circuit breaker.

### Security - 12

- Stateless JWT.
- HMAC-SHA256 signing.
- Constant-time JWT signature comparison.
- BCrypt password hashing.
- Bearer-token auth filter.
- Redis nonce with TTL.
- Wallet signature recovery.
- Ethereum address validation.
- Authenticated principal.
- Input validation.
- Token-bucket rate limiting.
- HTML escaping for dynamic dashboard rows.

### Redis - 5

- Analytics cache.
- Distributed lock with `SETNX` semantics.
- Lua token bucket.
- Nonce storage with TTL.
- Runtime shared state.

### Docker, AWS, CI/CD, Docs - 8

- Local Docker Compose.
- Production Docker Compose.
- Dockerfile multi-stage build.
- Non-root container user.
- Nginx reverse proxy.
- GitHub Actions workflow.
- AWS EC2 deployment runbook.
- Benchmark/evidence docs.

### Frontend - 3

- Static HTML/CSS/JS dashboard.
- Fetch API integration with backend.
- Chart.js visualization.

## Static Security Scan Results

Scan type: local static scan using `rg`, source inspection, `node --check`, DOM ID checks, and config review. No heavyweight dependency CVE scanner was run.

### High Priority

| Finding | Evidence | Risk | Recommended Fix |
|---|---|---|---|
| Most APIs are public | `SecurityConfig.java` previously used `.anyRequest().permitAll()` | Anyone could start ingestion if deployed publicly | Fixed and runtime verified: unauthenticated ingestion now returns `401` |
| Auth endpoints are not rate-limited | `ApiRateLimitFilter` previously protected only ingestion/analytics | Login, register, nonce, wallet-login could be spammed | Fixed in stabilization pass; targeted unit test passed |
| Stale running jobs can remain | Local status showed `activeJobCount=1` after recheck | Demo/status confusion; blocks new jobs depending on logic | Startup reconciliation runtime verified; one stale job was marked `FAILED` |
| Actuator health details always visible | `management.endpoint.health.show-details=always` | Leaks infrastructure details in prod | Configurable default changed to `when_authorized`; runtime health returned status only |

### Medium Priority

| Finding | Evidence | Risk | Recommended Fix |
|---|---|---|---|
| Local Docker Postgres port mismatch | Repo maps Docker Postgres to `5432`, but this machine also runs Windows PostgreSQL on `5432` | App connected to wrong/local Postgres and Flyway failed | Runtime verified with temporary `5433` override; choose one local port strategy before demo |
| JWT stored in `localStorage` | `dashboard.js` reads/writes `chainsightJwt` | XSS could steal JWT | For portfolio MVP acceptable after XSS cleanup; production should prefer HttpOnly secure cookie or stronger CSP |
| CDN scripts loaded without SRI/CSP | Chart.js and WalletConnect are loaded from CDN | Supply-chain/browser injection risk | Pin versions, self-host assets, or add SRI/CSP before production |
| Rate limiter trusts `X-Forwarded-For` | `ApiRateLimitFilter.clientId()` | Public clients can spoof IP if proxy trust is not configured | Only trust forwarded headers behind Nginx; configure trusted proxy handling |
| Rate limiter fails open | Redis failure logs warning and allows request | Availability favored over abuse protection | Keep for local/dev; decide fail-closed for sensitive endpoints in prod |
| Wallet sign-in is not SIWE-complete | Message is custom `personal_sign` | Weaker standardization and domain binding | Move to SIWE-style message fields before claiming production-grade wallet auth |
| WalletConnect Project ID stored in localStorage | Dashboard settings popover stores Reown ID | Not a secret, but not ideal config management | Use build/server config for demos; keep UI as dev-only setting |

### Low Priority / Acceptable For MVP

| Finding | Evidence | Notes |
|---|---|---|
| CSRF disabled | Stateless Bearer auth | Acceptable while using Authorization header; revisit if cookies are used |
| Custom JWT implementation | `JwtService.java` | Good for learning; production commonly uses Nimbus/JJWT library |
| Dev defaults exist | `chainsight_password`, dev JWT secret | Acceptable locally; production compose uses env vars |
| Redis lock method names are confusing | `releaseRangeLock(long chainId, String token)` receives stored lock value | Works with current code but rename variable to `lockValue` to avoid future bugs |

### Positive Security Findings

- SQL queries use parameter binding; no obvious user-input SQL concatenation was found.
- Passwords are hashed with BCrypt.
- JWT signature comparison uses `MessageDigest.isEqual`.
- Wallet nonce has a 5-minute Redis TTL.
- Wallet nonce is deleted after successful login.
- Ethereum wallet addresses are validated and normalized.
- Dynamic dashboard rows were patched to escape HTML.
- Production Compose does not expose PostgreSQL or Redis ports publicly.
- Backend container runs as non-root user.

## Functional Findings

### Wallet Address Returning No Data

Wallet tested:

`0xD44b94C80d313eb8Bfba9D15e0A0a440b6a5faC9`

Observed response:

- `sentCount=0`
- `receivedCount=0`
- `firstActivityAt=null`
- `lastActivityAt=null`

Reason:

Wallet analytics reads only from the locally indexed `transactions` table. Current local warehouse status:

- `indexedBlocks=3`
- `indexedTransactions=741`
- `lastProcessedBlock=25327682`

So the wallet will show data only if that address appears in those few indexed blocks. This is expected behavior, not a wallet-analytics bug.

### Dashboard Logic

Lightweight checks:

- `node --check backend/src/main/resources/static/dashboard/dashboard.js`: passed.
- HTML/JS ID contract: 53 referenced IDs, 66 HTML IDs, no missing IDs, no duplicate IDs.
- `git diff --check`: passed except line-ending warnings.

### Test Inventory

Static count:

- Main Java files: 53.
- Test Java files: 7.
- Test methods: 46.

Tests were not run in this audit because the request emphasized scanning and avoiding heavy commands. Run `mvn test` with JDK 21 before merging.

## Is It Going According To Plan?

Yes, mostly.

The project still matches the intended portfolio framing:

> ChainSight is a high-volume historical data warehouse and analytics platform using Ethereum as a public high-volume data source.

The backend is now stronger than the UI. That is good for interviews, because the real value is ingestion correctness, concurrency, PostgreSQL, Redis, security, and evidence.

What is drifting:

- UI work is growing, but the backend still needs proof/evidence.
- Auth exists, but endpoint authorization is too loose for deployment.
- WalletConnect path exists, but not production-verified.
- Docker local port config is inconsistent.
- Benchmark/evidence work is still not complete.

## Recommended Fix Order

### Fix Before Any Public Demo

1. Protect ingestion/admin endpoints with JWT.
2. Add rate limiting to auth endpoints.
3. Fix stale `RUNNING` ingestion jobs on startup.
4. Align local Postgres port config.
5. Set Actuator health details to local-only.
6. Run `mvn test` with JDK 21.
7. Run Docker-backed integration tests.

### Fix Before AWS

1. Use a strong `JWT_SECRET`.
2. Use real `ETH_RPC_URL`.
3. Keep PostgreSQL and Redis private.
4. Add HTTPS/Nginx domain plan.
5. Add CSP or self-host frontend CDN scripts.
6. Confirm rate limiting behind trusted proxy headers.
7. Add a security note to runbook.

### Fix Before Interview Evidence

1. Run `EXPLAIN ANALYZE` for wallet and largest-transaction queries.
2. Record ingestion throughput on a known block range.
3. Capture API latency numbers.
4. Add CI run link.
5. Add screenshots/API samples to evidence docs.
6. Record exactly how many blocks/transactions were indexed.

### Later, Not Now

1. Full React/Vite rewrite.
2. Full SIWE compliance.
3. Production-verified WalletConnect AppKit.
4. ERC-20 token transfer extraction.
5. Top-wallet analytics endpoint.
6. AWS RDS migration.
7. Kubernetes/microservices.

## Do Not Claim Yet

- Full production security.
- Full SIWE-compliant login.
- Production-verified WalletConnect.
- ERC-20 token analytics.
- Live AWS deployment.
- RDS PostgreSQL.
- Passing remote CI evidence.
- Measured ingestion throughput.
- Measured query latency.
- Complete UI polish.

## Commands Run During This Audit

- `git status --short`
- `git diff --stat`
- `rg --files`
- Static secret/config scans with `rg`
- SQL construction scan with `rg`
- TODO/planned/unverified scan with `rg`
- `node --check backend/src/main/resources/static/dashboard/dashboard.js`
- DOM ID consistency check with Node
- `git diff --check`
- Local API smoke checks:
  - `GET /api/v1/ingestion/status?chainId=1`
  - `GET /api/v1/analytics/wallets/{address}/summary?chainId=1`

## Scans Not Run

- Maven test suite.
- Docker/Testcontainers integration tests.
- OWASP dependency CVE scan.
- Container image vulnerability scan.
- Browser visual regression test.
- Load test.

Recommended later commands:

```powershell
cd backend
mvn test
```

```powershell
cd backend
mvn org.owasp:dependency-check-maven:check
```

```powershell
docker compose -f infra/docker-compose.local.yml up -d
```
