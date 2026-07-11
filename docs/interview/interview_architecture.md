# Architecture Interview Notes

## 30 Second Answer

ChainSight is a modular monolith. Controllers expose REST APIs, services own business logic, adapters call Ethereum RPC, repositories use SQL/JdbcTemplate, PostgreSQL stores durable warehouse data, and Redis stores temporary runtime state like cache, locks, rate limits, and wallet-login nonces.

## 2 Minute Answer

The architecture starts with a Spring Boot API layer. Ingestion requests go to `IngestionController`, then `BlockIngestionService`, then `EthereumRpcAdapter` for Web3j RPC calls. The service writes through `BlockJdbcRepository` using explicit transaction boundaries. Analytics requests go through controller-service-repository layers and use SQL reads. Resilience components wrap RPC calls, cache expensive analytics responses, lock range jobs across instances, and rate-limit APIs. Security uses Spring Security plus a JWT filter. The dashboard is a static HTML/CSS/JS frontend served by Spring Boot.

## Deep Technical Answer

The project intentionally uses a modular monolith rather than microservices. Module boundaries are package-based: ingestion, analytics, auth, wallet, resilience, config, and exception handling. This avoids distributed-system overhead while still keeping clear responsibilities. The ingestion module is the critical path: it coordinates async range jobs, enforces overlap guards, fetches blocks/receipts concurrently, and persists ordered block data with transactional checkpoints. PostgreSQL is the source of truth; Redis is not durable warehouse storage, only temporary shared runtime state.

## Architecture Flow

```text
Dashboard / REST client
        |
        v
Spring Boot controllers
        |
        v
Services
        |
        +--> EthereumRpcAdapter -> Web3j -> Ethereum RPC
        |
        +--> Redis services -> cache / lock / rate limit / nonce
        |
        v
JdbcTemplate repositories
        |
        v
PostgreSQL warehouse tables
```

## Code Mapping

Classes and files:

- App entry: `backend/src/main/java/com/chainsight/ChainSightApplication.java`
- Config: `backend/src/main/java/com/chainsight/config`
- Ingestion controller: `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`
- Ingestion service: `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- RPC adapter: `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`
- JDBC repository: `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- Analytics: `backend/src/main/java/com/chainsight/analytics`
- Redis/resilience: `backend/src/main/java/com/chainsight/resilience`
- Security/auth: `backend/src/main/java/com/chainsight/auth`
- Dashboard: `backend/src/main/resources/static/dashboard`

## Design Decisions

| Decision | Alternatives | Why selected | Trade-off |
|---|---|---|---|
| Modular monolith | Microservices | Easier to build, test, run, and explain | Must keep package boundaries disciplined |
| JdbcTemplate repositories | JPA for all tables | Better SQL control for batch ETL | More manual mapping |
| PostgreSQL as warehouse | NoSQL store | ACID, indexes, SQL analytics | Needs schema design |
| Redis for runtime state | PostgreSQL-only | TTL, locks, fast counters | Redis availability matters |
| Static dashboard | React/Angular app | No Node build pipeline yet | UI complexity may grow later |

## Failure Scenarios

| Failure | Handling | Limitation |
|---|---|---|
| RPC failure | `RpcFetchException`, circuit breaker around RPC adapter | Runtime behavior still needs full local verification |
| App crash during block write | Transaction rollback/checkpoint rules should keep resume safe | Integration test needs Docker running |
| Two same-chain range jobs | Redis lock plus local `ConcurrentHashMap` guard | Redis dependency must be available |
| Redis down | Some components fail open or fail depending on use case | Needs runtime testing |

## What I Can Honestly Claim

- Modular monolith architecture exists.
- Clear controller-service-repository layering exists.
- Redis is used for shared runtime concerns.
- PostgreSQL is the durable warehouse.

## Do Not Claim Yet

- Do not claim microservices.
- Do not claim Kubernetes.
- Do not claim live AWS architecture.
