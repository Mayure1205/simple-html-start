# Product Requirements Document

# ChainSight — Concurrent Historical Data Warehouse and Analytics Platform

## 1. Document Information

| Field | Value |
|---|---|
| Project Name | ChainSight |
| Document Type | Product Requirements Document |
| Version | v0.1 |
| Phase | Requirement Analysis |
| Status | Draft |
| Owner | Mayu |
| Current Sprint | Sprint 0 |
| Last Updated | 2026-06-12 |

---

## 2. Problem Statement

Public blockchain networks generate large amounts of historical transaction data. This data is available through blockchain nodes and RPC providers, but directly querying raw blockchain data repeatedly is slow, expensive, and not suitable for analytical use cases.

Users may want to answer questions such as:

- What was the daily transaction volume over a selected period?
- Which indexed wallets received the highest ETH value?
- Which transactions were unusually large?
- Which selected tokens had the highest transfer activity?
- Which wallets showed whale-like behavior?
- Which blocks failed during ingestion and need retry?

ChainSight solves this problem by building a high-volume historical data warehouse. It extracts Ethereum block and transaction data, transforms raw records into structured tables, stores them in PostgreSQL, and exposes analytics through REST APIs and dashboards.

Ethereum is used as the initial public high-volume data source. The project is positioned as a backend engineering, ETL, warehousing, and analytics platform, not as a cryptocurrency trading or wallet application.

---

## 3. Project Goals

### 3.1 Primary Goals

- Build a Java 21 and Spring Boot backend that extracts Ethereum historical data.
- Store blockchain records in a query-friendly PostgreSQL warehouse.
- Implement restart-safe ingestion using checkpoints and ACID transactions.
- Use JDBC batch inserts for high-volume transaction ingestion.
- Provide REST APIs for wallet, network, token, and alert analytics.
- Use PostgreSQL indexes and window functions for analytical queries.
- Use Redis for caching, distributed locks, and rate limiting.
- Add resilience around external RPC calls using retries and circuit breakers.
- Dockerize the application for local and cloud deployment.
- Maintain professional SDLC artifacts, clean commits, tests, and documentation.

### 3.2 Learning Goals

- Practice formal software engineering workflow.
- Learn requirement analysis, architecture design, API design, and database design.
- Learn advanced Java concurrency using ExecutorService, custom thread pools, CompletableFuture, and ConcurrentHashMap.
- Learn PostgreSQL performance optimization through indexes, constraints, batch inserts, and analytical SQL.
- Learn basic AWS deployment using EC2, Docker Compose, Nginx, and environment variables.

---

## 4. Actors

| Actor | Description |
|---|---|
| Analyst | Uses the dashboard and APIs to explore historical transaction trends. |
| Admin | Starts ingestion jobs, retries failed blocks, monitors progress, and configures thresholds. |
| System Scheduler | Automatically triggers ingestion and retry jobs. |
| Ethereum RPC Provider | External data source used to fetch blocks, transactions, and logs. |
| Developer | Maintains the application, tests it, deploys it, and monitors its behavior. |

---

## 5. Functional Requirements

### 5.1 Ingestion Requirements

| ID | Requirement |
|---|---|
| FR-01 | The system shall allow an admin to start an Ethereum block-range ingestion job. |
| FR-02 | The system shall fetch block data from an Ethereum RPC provider. |
| FR-03 | The system shall extract native ETH transactions from fetched blocks. |
| FR-04 | The system shall extract selected ERC-20 token-transfer logs. |
| FR-05 | The system shall transform raw blockchain values into readable formats such as ETH amount, timestamp, wallet address, and block number. |
| FR-06 | The system shall persist blocks, transactions, token transfers, and ingestion metadata into PostgreSQL. |
| FR-07 | The system shall maintain ingestion checkpoints. |
| FR-08 | The system shall mark failed blocks for retry. |
| FR-09 | The system shall support manual retry of failed blocks. |
| FR-10 | The system shall prevent duplicate block and transaction records. |

### 5.2 Analytics Requirements

| ID | Requirement |
|---|---|
| FR-11 | The system shall provide daily transaction-count analytics. |
| FR-12 | The system shall provide daily ETH volume analytics. |
| FR-13 | The system shall provide wallet transaction history for indexed wallets. |
| FR-14 | The system shall provide largest transaction reports. |
| FR-15 | The system shall provide gas-fee trend analytics. |
| FR-16 | The system shall provide selected-token transfer analytics. |
| FR-17 | The system shall provide most active indexed wallet analytics. |
| FR-18 | The system shall provide whale-transfer alerts based on configurable thresholds. |

### 5.3 Admin Requirements

| ID | Requirement |
|---|---|
| FR-19 | The system shall expose ingestion-job status. |
| FR-20 | The system shall show total indexed blocks and transactions. |
| FR-21 | The system shall show failed-block count. |
| FR-22 | The system shall expose application health status. |
| FR-23 | The system shall allow configuration of whale-alert thresholds. |
| FR-24 | The system shall allow configuration of tracked ERC-20 token contracts. |

### 5.4 Dashboard Requirements

| ID | Requirement |
|---|---|
| FR-25 | The dashboard shall show ingestion progress. |
| FR-26 | The dashboard shall show network transaction trends. |
| FR-27 | The dashboard shall allow wallet search. |
| FR-28 | The dashboard shall show whale alerts. |
| FR-29 | The dashboard shall show selected-token trends. |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Reliability | Ingestion must be restart-safe. Reprocessing the same block must not create duplicate data. |
| NFR-02 | Performance | High-volume transaction inserts must use JDBC batch inserts. |
| NFR-03 | Performance | Common analytics queries must use appropriate PostgreSQL indexes. |
| NFR-04 | Scalability | The ingestion pipeline must support concurrent block-range processing. |
| NFR-05 | Resilience | RPC-provider failures must not crash the application. |
| NFR-06 | Resilience | Failed blocks must be stored and retryable. |
| NFR-07 | Consistency | Block data, transactions, token transfers, and checkpoint updates must be stored transactionally. |
| NFR-08 | Security | RPC API keys must never be committed to the repository. |
| NFR-09 | Security | Admin endpoints must be protected in later versions. |
| NFR-10 | Maintainability | The codebase must use clear module boundaries and package-by-feature organization. |
| NFR-11 | Observability | The system must expose health checks, logs, and basic metrics. |
| NFR-12 | Deployability | The application must run through Docker Compose locally. |
| NFR-13 | Cloud | The application must be deployable on AWS EC2. |
| NFR-14 | Testing | Core transformation, persistence, retry, and API behavior must be covered by automated tests. |

---

## 7. User Stories

### 7.1 Admin Stories

| ID | User Story |
|---|---|
| US-01 | As an admin, I want to start ingestion for a block range so that historical data can be indexed. |
| US-02 | As an admin, I want to view ingestion progress so that I can confirm the system is processing blocks. |
| US-03 | As an admin, I want to view failed blocks so that I can retry them later. |
| US-04 | As an admin, I want duplicate ingestion to be prevented so that warehouse data remains clean. |
| US-05 | As an admin, I want to configure whale-alert thresholds so that large transfers can be detected. |

### 7.2 Analyst Stories

| ID | User Story |
|---|---|
| US-06 | As an analyst, I want to view daily transaction trends so that I can understand network activity. |
| US-07 | As an analyst, I want to search a wallet address so that I can inspect its indexed activity. |
| US-08 | As an analyst, I want to view largest transactions so that I can identify high-value transfers. |
| US-09 | As an analyst, I want to view selected-token activity so that I can compare token trends. |
| US-10 | As an analyst, I want to view whale alerts so that I can quickly find abnormal large transfers. |

### 7.3 Developer Stories

| ID | User Story |
|---|---|
| US-11 | As a developer, I want local Docker Compose setup so that I can run the system easily. |
| US-12 | As a developer, I want integration tests with PostgreSQL and Redis so that I can verify real behavior. |
| US-13 | As a developer, I want benchmark reports so that I can measure ingestion and query performance. |

---

## 8. Use Cases

### UC-01: Start Block-Range Ingestion

**Actor:** Admin

**Flow:**

1. Admin submits a block range.
2. System validates the range.
3. System creates an ingestion job.
4. System splits the range into smaller chunks.
5. Worker threads fetch blocks concurrently.
6. System transforms the data.
7. System stores blocks, transactions, token transfers, and checkpoint updates.
8. System reports ingestion progress.

**Success Criteria:**

- Job is created.
- Blocks are processed.
- Progress is visible.
- Duplicate records are not created.

---

### UC-02: Retry Failed Blocks

**Actor:** Admin

**Flow:**

1. Admin opens failed-block list.
2. Admin selects failed blocks.
3. System retries those blocks.
4. Successfully processed blocks are removed from failed status.
5. Failed retries remain visible with error reason.

**Success Criteria:**

- Retry action is recorded.
- Successful retry persists data.
- Failure reason remains visible if retry fails.

---

### UC-03: Search Wallet History

**Actor:** Analyst

**Flow:**

1. Analyst enters wallet address.
2. System validates address format.
3. System searches indexed transaction records.
4. System returns sent and received transactions.
5. Dashboard displays wallet activity.

**Success Criteria:**

- Wallet history loads with pagination.
- Invalid address returns proper error.
- Query uses indexed tables.

---

### UC-04: View Daily Network Analytics

**Actor:** Analyst

**Flow:**

1. Analyst selects date range.
2. System queries daily transaction metrics.
3. System returns transaction count and ETH volume.
4. Dashboard displays charts.

**Success Criteria:**

- Response is returned within acceptable latency.
- Cached results are used where possible.
- Date range validation is applied.

---

### UC-05: Detect Whale Transfer

**Actor:** System Scheduler

**Flow:**

1. System processes new transactions.
2. System compares transaction amount with whale threshold.
3. If threshold is exceeded, system creates whale alert.
4. Analyst can view alert in dashboard.

**Success Criteria:**

- Large transfer generates alert.
- Duplicate alert is not created for the same transaction.
- Alert can be filtered by date, wallet, and amount.

---

## 9. MVP Scope

The first production-ready version shall include:

```text
Ethereum only
Last 10,000–50,000 blocks
Native ETH transactions
Selected ERC-20 token transfers
Spring Boot backend
PostgreSQL warehouse
Redis cache
Block-range ingestion API
Restart-safe checkpointing
JDBC batch inserts
Basic analytics APIs
Whale-transfer alerts
Docker Compose setup
Basic frontend dashboard
GitHub Actions CI
AWS EC2 deployment
```

---

## 10. Out of Scope

The following are intentionally excluded from MVP:

```text
No real-money transactions
No wallet private-key management
No trading
No token transfers initiated by the system
No full Ethereum archive indexing
No guaranteed globally accurate richest-wallet leaderboard
No support for every ERC-20 token
No multi-chain support in MVP
No ML forecasting in MVP
No Kubernetes in MVP
No Terraform in MVP
No production-grade compliance system
```

---

## 11. Acceptance Criteria

### 11.1 Project-Level Acceptance Criteria

- The backend can fetch Ethereum blocks through an RPC provider.
- The system can ingest a configured block range.
- Blocks and transactions are stored in PostgreSQL.
- Re-running ingestion does not create duplicate blocks or transactions.
- Failed blocks are tracked and retryable.
- Analytics APIs return correct results for indexed data.
- Redis caching is used for selected expensive analytics APIs.
- Docker Compose runs PostgreSQL, Redis, backend, and frontend.
- Automated tests cover core transformation and persistence behavior.
- The project has documentation for requirements, architecture, database design, and deployment.

### 11.2 Engineering Acceptance Criteria

- Code uses package-by-feature organization.
- Database schema is managed using migrations.
- High-volume inserts use JDBC batch operations.
- PostgreSQL constraints prevent duplicate blockchain records.
- Common analytics queries have indexes.
- At least one window-function query is used.
- RPC failures are handled using retry and circuit breaker logic.
- Ingestion workers use bounded custom thread pools.
- No API keys or secrets are committed.
- CI runs tests on pull requests.

### 11.3 Demo Acceptance Criteria

During demo, the system should show:

- Ingestion job creation.
- Ingestion progress.
- Indexed block and transaction counts.
- Wallet search result.
- Daily transaction-volume chart.
- Largest transactions report.
- Whale alert view.
- Failed-block retry behavior.
- Health endpoint.
- Dockerized local deployment.

---

## 12. Success Metrics

| Metric | Target for MVP |
|---|---|
| Blocks indexed | 10,000+ |
| Transactions indexed | Depends on selected block range |
| Duplicate ingestion | 0 duplicate block or transaction rows |
| Batch insert size | Configurable: 100, 500, 1000 |
| API latency | Document measured p95 for main APIs |
| Test coverage | Meaningful coverage for core modules |
| Deployment | Working AWS EC2 deployment |
| Documentation | PRD, architecture, ERD, API contract, runbook |

---

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| RPC provider rate limits | Ingestion may fail or slow down | Rate limiting, retry, raw JSON replay mode |
| Huge data volume | Local machine may become slow | Limit MVP to selected block range |
| Duplicate ingestion | Incorrect analytics | Unique constraints and transactional checkpointing |
| API key leakage | Security issue | Environment variables and .gitignore |
| Slow analytics queries | Poor user experience | Indexes, caching, precomputed metrics |
| Scope creep | Project may not finish | Strict MVP boundaries |

---

## 14. Documentation Status

Initial project documentation now exists:

```text
README.md
docs/architecture.md
docs/database-erd.md
docs/api-contract.md
docs/runbook.md
docs/adrs/ADR-001-start-with-modular-monolith.md
```

Later sprints should add:

```text
docs/benchmark-report.md
docs/deployment.md
docs/postmortems/
```

---

## 15. Current Status

```text
about.md                         Done
product-requirements.md          Draft
README.md                        Initial Draft
architecture.md                  Initial Draft
database-erd.md                  Initial Draft
api-contract.md                  Initial Draft
runbook.md                       Initial Draft
ADR-001 modular monolith          Done
repository setup                 In Progress
local Docker Compose              Done
first Flyway migration            Done
current implementation sprint     Sprint 1 - Web3j RPC adapter and block persistence
```
