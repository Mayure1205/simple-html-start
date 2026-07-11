# Resume Talking Points

## Current Resume Bullet

```text
ChainSight - Java 21 Historical Data Warehouse Backend

Built a Spring Boot backend foundation for a historical Ethereum data warehouse,
including Web3j block fetching, bounded CompletableFuture-based range extraction,
checkpoint-aware ordered persistence, transaction receipt mapping, PostgreSQL
window-function analytics APIs, wallet transaction-history and summary APIs,
JWT email/password authentication, wallet-signature login challenge handling,
user tracked-wallet watchlists, Redis-backed caching, Redis distributed locking,
Redis token-bucket API rate limiting, Resilience4j RPC circuit breaker wrapping,
and a Spring Boot-served operations dashboard with Docker/Nginx deployment
readiness documentation.
```

## Strong Interview Bullets

- Built a Java 21 Spring Boot historical-data warehouse using Ethereum as a public high-volume data source.
- Implemented restart-aware block ingestion with checkpointing, duplicate-safe writes, and failed-block tracking.
- Used bounded custom executors and `CompletableFuture` for concurrent block and receipt extraction.
- Used `JdbcTemplate` and SQL-first repositories for batch ETL and analytics queries.
- Added PostgreSQL indexes and window-function analytics endpoints.
- Added Redis-backed analytics cache, distributed lock, API rate limiter, and wallet-login nonce storage.
- Added JWT auth, tracked-wallet APIs, and wallet-signature login challenge handling.
- Built a static operations dashboard for ingestion, analytics, wallets, auth, and provider-neutral wallet sign-in UI.

## What To Avoid On Resume For Now

- Do not say AWS hosted until there is a public URL/evidence.
- Do not say CI/CD passed until remote run link exists.
- Do not include benchmark numbers until measured.
- Do not say ERC-20 token analytics.
- Do not say full SIWE or production WalletConnect.
