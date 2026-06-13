# ChainSight

ChainSight is a Java 21 and Spring Boot historical-data warehouse and analytics platform.

Ethereum is the first data source because it is publicly accessible and generates high-volume transaction data. The project is intentionally framed as a concurrent ETL, warehousing, and analytics system, not as a crypto wallet or trading app.

## Current Status

Sprint 10 authentication and tracked-wallet readiness is in progress:

- Web3j block and receipt ingestion
- Checkpoint-aware range ingestion with restart-safety tests
- Async range jobs with bounded block and receipt executor pools
- PostgreSQL warehouse schema managed by Flyway
- Network analytics APIs with PostgreSQL window functions
- Wallet transaction-history and summary analytics APIs
- JWT email/password authentication
- User-specific tracked wallet watchlists
- Redis cache, distributed ingestion lock, and token-bucket API rate limiter
- Resilience4j circuit breaker around Ethereum RPC calls
- Static operations dashboard served by Spring Boot, including wallet lookup and tracked-wallet controls
- Production Docker Compose and Nginx deployment artifacts
- GitHub Actions backend CI workflow file
- Benchmark report template and release checklist

Live AWS hosting, passing remote CI evidence, benchmark measurements, MetaMask signature login, top-wallet analytics, token analytics, and HTTPS are still future work.

## Tech Stack

- Java 21
- Spring Boot 3
- Spring Security
- Web3j
- PostgreSQL
- Redis
- Flyway
- JdbcTemplate for high-volume inserts
- JPA for metadata-oriented tables
- JWT for user API authentication
- Resilience4j
- Docker Compose

## Local Development

Prerequisites:

- Java 21
- Maven
- Docker Desktop

Verify Maven is using JDK 21:

```powershell
mvn -version
```

The `Java version` line must show `21.x`. If it shows an older version, install JDK 21 and set `JAVA_HOME` before running the backend.

Start PostgreSQL and Redis:

```powershell
docker compose -f infra/docker-compose.local.yml up -d
```

Run the backend:

```powershell
cd backend
mvn spring-boot:run
```

Run tests:

```powershell
cd backend
mvn test
```

Optional RPC provider configuration:

```powershell
$env:ETH_RPC_URL = "https://your-provider-url"
```

Do not commit `.env` files, API keys, RPC URLs with secrets, database dumps, or generated local data.

Open the local dashboard after the backend starts:

```text
http://localhost:8080/dashboard/index.html
```

## Documentation

- [Product Requirements](product-requirements.md)
- [Architecture](docs/architecture.md)
- [Database ERD](docs/database-erd.md)
- [API Contract](docs/api-contract.md)
- [Runbook](docs/runbook.md)
- [Evidence Ledger](docs/interview-evidence.md)
- [Benchmark Report](docs/benchmark-report.md)
- [Release Checklist](docs/release-checklist.md)
- [ADR-001: Modular Monolith First](docs/adrs/ADR-001-start-with-modular-monolith.md)

## Engineering Positioning

Use this framing in interviews:

> ChainSight is a concurrent historical-data warehouse built with Java 21 and Spring Boot. Ethereum is the data source because it is public, high-volume, and realistic for stress-testing ETL behavior. The engineering challenge is reliable ingestion: concurrency, restart safety, duplicate prevention, database performance, analytics, caching, and resilience.

## Git Workflow

- Current local workflow: commit focused changes directly on `main`.
- Use conventional commits, for example `feat(ingestion): add block persistence`.
- Keep each commit focused on one milestone.
- Update `docs/interview-evidence.md` whenever a claim becomes demonstrable in code, tests, benchmarks, CI, or deployment.
