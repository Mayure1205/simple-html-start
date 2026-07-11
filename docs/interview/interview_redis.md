# Redis Interview Notes

## 30 Second Answer

Redis is used for temporary shared runtime state: analytics cache, distributed ingestion lock, API token-bucket rate limiting, and wallet-login nonces.

## Code Mapping

- Cache service: `backend/src/main/java/com/chainsight/analytics/service/NetworkAnalyticsCacheService.java`
- Redis lock: `backend/src/main/java/com/chainsight/resilience/RedisIngestionLockService.java`
- Rate limiter: `backend/src/main/java/com/chainsight/resilience/RedisTokenBucketRateLimiter.java`
- Rate limit filter: `backend/src/main/java/com/chainsight/resilience/ApiRateLimitFilter.java`
- Wallet nonce usage: `backend/src/main/java/com/chainsight/auth/service/AuthService.java`
- Local Redis service: `infra/docker-compose.local.yml`

## Concepts Used

| Concept | What it is | Why used here | Alternative | Trade-off |
|---|---|---|---|---|
| Cache with TTL | Temporary stored response | Avoid repeated expensive analytics queries | No cache | Faster reads, possible stale data |
| Distributed lock | Cross-instance mutual exclusion | Prevent two instances ingesting same chain range | DB lock | Redis is fast, but availability matters |
| Token bucket | Rate-limit algorithm | Smooth request limits per client/bucket | Fixed window | More fair, more logic |
| Lua script | Atomic Redis operation | Lock release/rate limit updates need atomicity | Multiple Redis calls | Safer but more complex |
| Nonce TTL | Expiring login challenge | Prevent replay and auto-clean stale nonces | DB nonce table | Simple but needs Redis |

## Failure Scenarios

| Failure | Handling | Limitation |
|---|---|---|
| Redis cache unavailable | Cache service should fall back to DB for network analytics | Runtime verification pending |
| Redis lock unavailable | Ingestion overlap protection may fail/throw depending path | Needs local Docker test |
| Rate limiter Redis unavailable | Current rate limiter allows request and logs warning | Security trade-off |
| Wallet nonce Redis unavailable | Wallet login cannot complete | Expected fail-closed behavior |

## Interview Questions

Q: Why Redis?
A: Redis is good for fast temporary state that should not live in PostgreSQL: cache entries, counters, short-lived nonces, and locks.

Q: Why not store everything in PostgreSQL?
A: PostgreSQL remains durable warehouse storage. Redis handles temporary runtime coordination cheaply.

Q: Why use TTL?
A: Temporary state should expire automatically to avoid cleanup jobs and stale login challenges.

## Do Not Claim Yet

- Redis cluster/high availability.
- Production resilience testing.
- Measured cache hit latency.
