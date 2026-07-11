# ChainSight Evidence

Proofs only. No theory.

| Claim | Proof | Status |
|---|---|---|
| Local PostgreSQL and Redis dependencies defined | `infra/docker-compose.local.yml` | `DONE` |
| Initial Flyway schema exists | `backend/src/main/resources/db/migration/V1__init_schema.sql` | `DONE` |
| Auth/tracked-wallet schema exists | `backend/src/main/resources/db/migration/V2__auth_and_tracked_wallets.sql` | `DONE` |
| Wallet-auth schema exists | `backend/src/main/resources/db/migration/V3__add_wallet_auth.sql` | `DONE` |
| Web3j RPC adapter coded | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java` | `CODED - RUNTIME VERIFY PENDING` |
| Block range ingestion coded | `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java` | `UNIT TESTED` |
| JDBC repository coded | `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java` | `CODED` |
| Restart-safety integration test exists | `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java` | `DOCKER RUN PENDING` |
| Network analytics APIs coded | `backend/src/main/java/com/chainsight/analytics` | `UNIT TESTED` |
| Wallet analytics APIs coded | `backend/src/main/java/com/chainsight/analytics/controller/WalletAnalyticsController.java` | `UNIT TESTED - RUNTIME SMOKE PASSED 2026-06-17` |
| Redis cache coded | `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsCacheService.java` | `UNIT TESTED - REAL REDIS VERIFIED 2026-06-17` |
| Redis ingestion lock coded | `backend/src/main/java/com/chainsight/resilience/RedisIngestionLockService.java` | `UNIT TESTED - JOB PATH EXERCISED 2026-06-17` |
| Redis token bucket coded | `backend/src/main/java/com/chainsight/resilience/RedisTokenBucketRateLimiter.java` | `UNIT TESTED - REAL REDIS VERIFIED 2026-06-17` |
| Circuit breaker wrapping RPC coded | `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java` | `RUNTIME VERIFY PENDING` |
| JWT auth coded | `backend/src/main/java/com/chainsight/auth` | `UNIT TESTED - RUNTIME VERIFIED 2026-06-17` |
| Ingestion APIs protected with JWT | `backend/src/main/java/com/chainsight/auth/security/SecurityConfig.java` | `RUNTIME VERIFIED 2026-06-17` |
| Auth endpoints rate-limited | `backend/src/main/java/com/chainsight/resilience/ApiRateLimitFilter.java` | `TARGETED TEST PASSED - RUNTIME 429 VERIFIED 2026-06-17` |
| Tracked-wallet APIs coded | `backend/src/main/java/com/chainsight/wallet` | `UNIT TESTED` |
| Wallet-signature login coded | `backend/src/main/java/com/chainsight/auth/service/AuthService.java` | `UNIT TESTED` |
| Stale active ingestion jobs reconciled on startup | `backend/src/main/java/com/chainsight/ingestion/service/IngestionJobStartupReconciler.java` | `TARGETED TEST PASSED - RUNTIME VERIFIED 2026-06-17` |
| Local PostgreSQL port aligned with app default | `infra/docker-compose.local.yml` | `DEFAULT PORT CONFLICT FOUND ON THIS MACHINE` |
| Actuator health details made env/profile configurable | `backend/src/main/resources/application.yml` | `RUNTIME VERIFIED 2026-06-17` |
| Provider-neutral wallet UI coded | `backend/src/main/resources/static/dashboard` | `BROWSER CHECKED - REAL WALLET VERIFY PENDING` |
| Static dashboard JS syntax checked | `node --check backend/src/main/resources/static/dashboard/dashboard.js` | `PASSED` |
| Backend compile check | `cd backend && mvn -q -DskipTests compile` | `PASSED 2026-06-16` |
| Auth rate-limit targeted test | `cd backend && mvn -q "-Dtest=ApiRateLimitFilterTest" test` | `PASSED 2026-06-16` |
| Startup stale-job targeted test | `cd backend && mvn -q "-Dtest=IngestionJobStartupReconcilerTest" test` | `PASSED 2026-06-16` |
| Production Dockerfile exists | `backend/Dockerfile` | `CODED - NOT DEPLOYED` |
| Production Compose exists | `infra/docker-compose.prod.yml` | `CODED - NOT DEPLOYED` |
| Nginx config exists | `infra/nginx/chainsight.conf` | `CODED - NOT DEPLOYED` |
| Backend CI workflow exists | `.github/workflows/backend-ci.yml` | `WORKFLOW ADDED - REMOTE RUN PENDING` |
| Benchmark template exists | `docs/benchmark-report.md` | `NO MEASUREMENTS YET` |
| AWS runbook exists | `docs/aws-deployment.md` | `NOT DEPLOYED` |

## Runtime Verification Pass - 2026-06-17

| Check | Evidence | Result |
|---|---|---|
| Full Maven test suite | `cd backend && mvn test` | `BUILD SUCCESS`; tests run `47`, failures `0`, errors `0`, skipped `3` |
| Testcontainers integration tests | `BlockJdbcRepositoryIntegrationTest` | `SKIPPED`; Testcontainers could not detect a valid Docker environment from Maven on Windows |
| Docker Compose local stack | `docker compose -f infra/docker-compose.local.yml ps` | PostgreSQL and Redis both `healthy` |
| Local PostgreSQL port conflict | Windows service `postgresql-x64-18` was already listening on `5432`; first backend startup failed with `FATAL: password authentication failed for user "chainsight_user"` | Use a port decision before demo; verification used a temporary Compose stdin override mapping Docker Postgres to `5433` |
| Backend startup | `POSTGRES_PORT=5433 mvn spring-boot:run` | `GET /actuator/health` returned `200` with `{"status":"UP"}` |
| Flyway migration state | Docker Postgres query: `select installed_rank, version, description, success from flyway_schema_history` | Versions `1`, `2`, and `3` present with `success=true`; logs show `Successfully validated 3 migrations` and schema version `3` |
| Unauthenticated ingestion is blocked | `POST /api/v1/ingestion/jobs` without JWT | `401 Unauthorized` |
| JWT issue and user endpoint | `POST /api/v1/auth/register`, then `GET /api/v1/auth/me` with Bearer token | `200`; token issued and current user returned |
| Authenticated ingestion path | `POST /api/v1/ingestion/jobs` with JWT and range `0..0` | `202 Accepted`; job `3` became `COMPLETED` |
| Authenticated ingestion caveat | Same job response showed `resumeFromBlock=25327683` and `processedBlocks=0` | This proves JWT and job orchestration, not a fresh RPC ingestion run |
| Public read-only network analytics | `GET /api/v1/analytics/network/daily?chainId=1&from=2026-06-01&to=2026-06-17` without JWT | `200`; returned one daily metric row from indexed data |
| Public wallet analytics | `GET /api/v1/analytics/wallets/0xD44b94C80d313eb8Bfba9D15e0A0a440b6a5faC9/summary?chainId=1` without JWT | `200`; returned zero activity because this wallet is not present in the currently indexed local sample |
| Auth endpoint rate limit | 15 rapid `POST /api/v1/auth/login` calls with invalid credentials | Status sequence `400` x10, then `429` x5 |
| Redis rate-limit evidence | `docker exec chainsight-redis redis-cli --scan --pattern 'chainsight:rate-limit:*'` | Multiple rate-limit token/timestamp keys found with TTLs |
| Redis analytics cache evidence | `chainsight:analytics:network:daily:1:2026-06-01:2026-06-17` | Cache key found in Redis with TTL |
| Redis lock path evidence | Authenticated ingestion job accepted and completed; `chainsight:ingestion:lock:chain:*` absent after completion | Lock path exercised and released for a checkpoint-skip job |
| Stale job reconciliation | Startup log and DB query | Log: `Marked 1 stale ingestion job(s) as FAILED on startup`; job `1` marked `FAILED` |
| Basic auth fallback check | Tried generated Spring Boot dev password against `GET /api/v1/ingestion/status` | `401`; generated Basic auth did not bypass JWT |
| Local indexed data count | Docker Postgres queries | `blocks=3`, `transactions=741`, checkpoint `last_processed_block=25327682` |

## Missing Evidence

| Evidence | Status |
|---|---|
| `EXPLAIN ANALYZE` results | `TODO` |
| Full `mvn test` suite | `DONE 2026-06-17`; note 3 Testcontainers tests skipped |
| Docker Compose local verification | `DONE 2026-06-17 WITH TEMP 5433 OVERRIDE`; default `5432` conflicts with installed Windows PostgreSQL on this machine |
| Docker-backed Testcontainers integration execution | `TODO`; Maven skipped Testcontainers integration tests |
| Ingestion throughput benchmark | `TODO` |
| API latency measurements | `TODO` |
| Passing remote CI run link | `TODO` |
| AWS public URL | `TODO` |
| RDS PostgreSQL proof | `TODO` |
| Real WalletConnect login proof | `TODO` |
