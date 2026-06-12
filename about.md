# ChainSight — Concurrent Historical Data Warehouse and Analytics Platform

## 1. Project Overview

**ChainSight** is a Java 21 and Spring Boot based historical-data warehouse and analytics platform.

It continuously extracts high-volume public transaction data from Ethereum, transforms raw blockchain records into structured analytical tables, stores them in PostgreSQL, and exposes fast REST APIs and dashboards for historical analysis.

Ethereum is used as the first data source because it provides a continuously growing, publicly accessible transaction dataset. The project is positioned as a **high-volume ETL, warehousing, analytics, and backend-engineering system**, not as a cryptocurrency application.

---

## 2. Problem Statement

Blockchain networks store years of transaction history. Querying raw node data repeatedly for analytical questions is inefficient and slow.

Examples of difficult historical queries:

- Which indexed wallets received the highest ETH volume in a selected period?
- Which wallets showed the highest balance growth?
- What was the daily transaction-volume trend?
- Which transactions crossed a whale-transfer threshold?
- Which tracked tokens showed increasing activity?
- Which days had unusually high gas fees?
- How many transactions were processed each day?
- Which wallets interacted most frequently?

ChainSight solves this by creating a query-friendly warehouse.

```text
Raw Ethereum Data
        ↓
Concurrent Extraction
        ↓
Transformation and Validation
        ↓
PostgreSQL Warehouse
        ↓
Redis Cache
        ↓
Analytics REST APIs
        ↓
Dashboard
```

---

## 3. What the System Does

### 3.1 Extracts Historical Data

ChainSight connects to an Ethereum JSON-RPC provider through Web3j.

It fetches:

- Blocks
- Native ETH transactions
- Transaction metadata
- Gas-related fields
- Selected ERC-20 token-transfer logs
- Timestamps
- Wallet addresses
- Block checkpoints

Initial data scope:

```text
Network: Ethereum
Range: Last 10,000–50,000 blocks
Assets:
- Native ETH transactions
- Selected ERC-20 token contracts
```

### 3.2 Transforms Raw Data

Raw blockchain data contains technical fields and base-unit values.

Example raw record:

```json
{
  "hash": "0x123...",
  "from": "0xabc...",
  "to": "0xdef...",
  "value": "1000000000000000000",
  "gas": "21000",
  "blockNumber": "22000500"
}
```

ChainSight converts it into query-friendly data:

```text
Transaction Hash: 0x123...
Sender Wallet:    0xabc...
Receiver Wallet:  0xdef...
Amount:           1 ETH
Block Number:     22,000,500
```

Transformation responsibilities:

- Convert Wei to ETH
- Normalize wallet addresses
- Validate required fields
- Detect duplicate transactions
- Extract selected token-transfer events
- Calculate daily metrics
- Generate whale-transfer alerts

### 3.3 Loads Data into a Warehouse

The transformed records are stored in PostgreSQL.

Main warehouse tables:

```text
chains
blocks
transactions
wallets
token_contracts
token_transfers
wallet_balance_snapshots
daily_network_metrics
daily_wallet_metrics
ingestion_jobs
ingestion_checkpoints
failed_blocks
whale_alerts
```

The system uses:

- ACID transactions
- Unique constraints
- JDBC batch inserts
- B-Tree indexes
- SQL aggregation
- Window functions
- Flyway database migrations

### 3.4 Exposes Analytics APIs

ChainSight provides REST APIs for:

#### Network Analytics

- Daily transaction count
- Daily transferred ETH volume
- Average gas-fee trend
- Block-processing trend
- Largest transfers
- Most active time ranges

#### Wallet Analytics

- Wallet transaction history
- Total ETH sent
- Total ETH received
- Net flow
- Largest incoming transfers
- Largest outgoing transfers
- Most frequent counterparties
- Monthly activity trend

#### Token Analytics

- Selected-token transfer count
- Active wallets by token
- Largest token transfers
- Daily token activity
- Token popularity trend

#### Whale Alerts

- Transfers above a configured threshold
- Wallets showing abnormal accumulation
- Alert history
- Alert filtering by date, token, wallet, and amount

#### Ingestion Monitoring

- Latest processed block
- Total indexed blocks
- Total indexed transactions
- Failed-block count
- Retry status
- Current ingestion speed
- Worker-thread status

---

## 4. Primary Users

### 4.1 Analyst

Uses the dashboard to:

- Search indexed wallets
- View transfer history
- Analyze daily trends
- Review whale alerts
- Compare token activity

### 4.2 Admin

Uses the system to:

- Start ingestion jobs
- Configure block ranges
- Retry failed blocks
- Review checkpoints
- Monitor worker status
- Configure rate limits
- Configure alert thresholds

### 4.3 Developer or Reviewer

Uses the repository to:

- Run the ETL pipeline locally
- Replay saved raw JSON data
- Run tests
- Measure performance
- Inspect architecture decisions
- Validate resilience behavior

---

## 5. Project Positioning

ChainSight should not be described as:

```text
A crypto dashboard
A blockchain wallet application
A token-trading application
```

It should be described as:

```text
A concurrent historical-data warehouse and analytics platform
using Ethereum as a publicly accessible high-volume transaction source.
```

The engineering value comes from:

```text
Java Backend Development
+
Concurrent ETL Processing
+
Database Engineering
+
Resilience
+
Caching
+
Testing
+
Cloud Deployment
```

---

## 6. Core Engineering Challenges

### 6.1 High-Volume Ingestion

A large number of blocks and transactions must be extracted and stored efficiently.

Solution direction:

- Split block ranges into chunks
- Process chunks using custom thread pools
- Use bounded queues
- Persist rows using JDBC batch inserts
- Track progress with checkpoints

### 6.2 Restart-Safe Processing

The application may crash after inserting transactions but before recording completion.

Risk:

```text
Insert transactions
        ↓
Application crashes
        ↓
Restart processes same block again
        ↓
Duplicate rows
```

Solution direction:

```text
Insert block
Insert transactions
Insert token transfers
Update checkpoint
Commit transaction
```

Database constraints also prevent duplicates:

```text
UNIQUE (chain_id, block_number)
UNIQUE (chain_id, transaction_hash)
UNIQUE (chain_id, token_address, transaction_hash, log_index)
```

### 6.3 Concurrent Extraction

Sequential fetching is too slow for meaningful historical ingestion.

Solution direction:

- Use `ThreadPoolExecutor`
- Use bounded queues
- Process independent block ranges concurrently
- Track in-progress jobs through `ConcurrentHashMap`
- Combine asynchronous RPC results through `CompletableFuture`

### 6.4 External RPC Failures

The RPC provider may temporarily become slow or unavailable.

Solution direction:

- Circuit breaker
- Retry with backoff
- Failed-block tracking
- Manual retry endpoint
- Raw JSON replay mode for reproducible testing

### 6.5 Expensive Analytics Queries

Repeated analytical queries may be slow.

Solution direction:

- PostgreSQL B-Tree indexes
- Aggregated daily tables
- Redis caching
- Cache invalidation after ingestion
- SQL window functions
- Pagination

### 6.6 Multiple Application Instances

Two backend instances must not ingest the same range simultaneously.

Solution direction:

- Redis distributed lock
- Range-level ownership
- Lock expiration
- Idempotent database writes
- Checkpoint validation

---

## 7. Java Concepts Used Naturally

| Java Concept | Use in ChainSight |
|---|---|
| OOP | RPC clients, transformers, analytics services, repositories |
| Interfaces | Provider abstraction and extensible chain adapters |
| Abstraction | Separate extraction, transformation, storage, and analytics layers |
| Polymorphism | Multiple RPC-provider implementations |
| Exception Handling | RPC errors, database failures, invalid data, retryable errors |
| Collections | Block batches, wallet deltas, grouped metrics |
| Streams API | Aggregation, filtering, transformation |
| Generics | Reusable API responses and pipeline components |
| `ExecutorService` | Manage concurrent extraction workers |
| Custom Thread Pools | Separate extraction, transformation, and retry workloads |
| `CompletableFuture` | Combine asynchronous RPC calls |
| `ConcurrentHashMap` | Track active ingestion jobs and worker status |
| Locks | Protect local shared state where required |
| Race-Condition Handling | Avoid duplicate or overlapping ingestion |
| JVM Monitoring | Observe heap usage, thread count, and executor queues |

---

## 8. Spring Boot Concepts Used

| Spring Concept | Use in ChainSight |
|---|---|
| Dependency Injection | Inject clients, services, repositories, and configuration |
| Profiles | Separate local, test, staging, and production settings |
| REST Controllers | Analytics, ingestion, and admin APIs |
| DTO Validation | Validate block ranges and API requests |
| Global Exception Handling | Standard error responses |
| Spring Data JPA | Metadata, checkpoints, alerts, and user-facing records |
| `JdbcTemplate` | High-volume batch inserts |
| Transactions | Atomic block processing |
| Scheduler | Periodic ingestion and retry jobs |
| Actuator | Health checks and metrics |
| Spring Security | Admin and analyst roles in later versions |

---

## 9. Data-Engineering Concepts Used

| Concept | Use in ChainSight |
|---|---|
| ETL | Extract, transform, and load blockchain data |
| Warehousing | Store query-friendly historical data |
| Batch Processing | Insert high-volume records efficiently |
| Checkpointing | Track completed block ranges |
| Idempotency | Safe retries without duplicates |
| Aggregation | Generate daily metrics |
| Indexing | Improve common queries |
| Window Functions | Rankings, growth trends, rolling calculations |
| Partitioning | Optional optimization for growing tables |
| Materialized Views | Optional optimization for frequently requested reports |

---

## 10. Resilience and Scalability Concepts Used

| Concept | Use in ChainSight |
|---|---|
| Redis Cache | Cache expensive analytics responses |
| Distributed Lock | Prevent overlapping ingestion across instances |
| Token-Bucket Rate Limiting | Protect REST APIs and control RPC usage |
| Circuit Breaker | Isolate RPC-provider failures |
| Retry with Backoff | Retry temporary failures safely |
| Bounded Queues | Prevent uncontrolled memory growth |
| Pagination | Prevent oversized API responses |
| Horizontal Scaling | Add backend instances safely |
| Docker | Run local and cloud environments consistently |

---

## 11. Suggested Architecture

```text
                          ┌─────────────────────────┐
                          │ Ethereum RPC Provider   │
                          │ Web3j + JSON-RPC        │
                          └────────────┬────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ChainSight Spring Boot API                  │
│                                                                 │
│  ┌───────────────────┐      ┌───────────────────────────────┐   │
│  │ Ingestion Module  │ ───▶ │ Concurrent ETL Pipeline       │   │
│  └───────────────────┘      │ ThreadPoolExecutor            │   │
│                             │ CompletableFuture             │   │
│                             │ Batch Processing              │   │
│                             └───────────────┬───────────────┘   │
│                                             │                   │
│  ┌───────────────────┐      ┌───────────────▼───────────────┐   │
│  │ Analytics Module  │ ◀─── │ Warehouse Module              │   │
│  └───────────────────┘      │ JPA + JdbcTemplate            │   │
│                             └───────────────┬───────────────┘   │
│                                             │                   │
│  ┌───────────────────┐      ┌───────────────▼───────────────┐   │
│  │ Alerting Module   │      │ Resilience Module             │   │
│  └───────────────────┘      │ Circuit Breaker + Retry       │   │
│                             └───────────────────────────────┘   │
└──────────────────────┬───────────────────────┬──────────────────┘
                       │                       │
                       ▼                       ▼
             ┌──────────────────┐     ┌──────────────────┐
             │ PostgreSQL       │     │ Redis            │
             │ Historical Data  │     │ Cache + Locks    │
             └──────────────────┘     └──────────────────┘
                       │
                       ▼
             ┌──────────────────┐
             │ Dashboard        │
             │ Angular / React  │
             └──────────────────┘
```

---

## 12. Suggested Repository Structure

```text
chainsight/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── infra/
│   ├── docker-compose.local.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
│
├── load-tests/
├── scripts/
├── docs/
│   ├── adrs/
│   ├── diagrams/
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── database-erd.md
│   ├── api-contract.md
│   ├── benchmark-report.md
│   ├── runbook.md
│   └── postmortems/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── about.md
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── .gitignore
```

---

## 13. Version Plan

### Version 0.1 — Core Extraction

```text
Ethereum RPC connection
Fetch historical blocks
Store blocks
Store native ETH transactions
Basic ingestion checkpoint
```

### Version 0.2 — Reliable Warehouse

```text
Restart-safe ingestion
Unique constraints
ACID block processing
JDBC batch inserts
Failed-block retry
Raw JSON replay mode
```

### Version 0.3 — Analytics

```text
Wallet search
Daily transaction count
Daily ETH volume
Gas-fee trends
Largest transactions
Whale alerts
PostgreSQL indexes
Window functions
```

### Version 0.4 — Advanced Java and Resilience

```text
Custom ThreadPoolExecutor
Bounded queues
CompletableFuture pipeline
ConcurrentHashMap job tracking
Redis caching
Redis distributed locks
Token-bucket rate limiting
Circuit breaker
```

### Version 0.5 — Dashboard

```text
Ingestion monitor
Network analytics charts
Wallet analytics
Token analytics
Whale-alert view
Admin controls
```

### Version 1.0 — Cloud Deployment

```text
Docker Compose production setup
AWS EC2 deployment
Nginx reverse proxy
HTTPS
Cloud monitoring
CI pipeline
Benchmark report
Demo video
```

---

## 14. Testing Strategy

### Unit Tests

```text
Wei-to-ETH conversion
Data transformation
Wallet-address normalization
Whale-alert rules
Aggregation logic
```

### Integration Tests

```text
PostgreSQL Testcontainer
Redis Testcontainer
Mock RPC provider
ACID rollback verification
Unique-constraint verification
Cache behavior
```

### Reliability Tests

```text
Restart during ingestion
Duplicate block replay
Overlapping range requests
RPC-provider downtime
Redis downtime
Failed-block retry
```

### Load Tests

```text
Replay saved raw JSON responses
Compare sequential vs concurrent extraction
Compare batch sizes: 1, 100, 500, 1000
Measure query latency before and after indexes
Measure cache hit vs cache miss
```

### Benchmark Metrics

```text
Blocks processed per second
Transactions inserted per second
Average ingestion latency
p95 ingestion latency
Batch-insert duration
Failed-block count
Retry count
Cache-hit latency
Database-query latency
Executor queue size
```

---

## 15. Deployment Plan

### Local Development

```text
Docker Compose
├── Spring Boot Backend
├── PostgreSQL
├── Redis
├── Mock RPC Provider
└── Frontend
```

### Initial AWS Deployment

```text
Internet
   ↓
AWS EC2
   ↓
Nginx
   ├── Frontend
   └── Spring Boot API
          ├── PostgreSQL Container
          └── Redis Container
```

### Later Cloud Upgrades

```text
S3
→ Store raw JSON replay files and backups

RDS PostgreSQL
→ Managed database

ElastiCache
→ Managed Redis

ECR
→ Store Docker images

ECS
→ Deploy containerized backend

CloudWatch
→ Logs, metrics, and alarms

Terraform
→ Infrastructure as Code
```

---

## 16. Security Considerations

```text
Never commit RPC API keys
Use environment variables
Do not log secrets
Validate ingestion ranges
Rate-limit expensive endpoints
Restrict admin endpoints
Use HTTPS for public deployment
Keep PostgreSQL and Redis private
Use AWS IAM for cloud access
Use security groups carefully
```

---

## 17. Important Limitations

ChainSight Version 1 does not claim:

```text
Complete global Ethereum wallet rankings
Exact balances for every wallet in Ethereum history
Support for every ERC-20 token
Support for every blockchain
Production-grade financial compliance
Real-time exchange-level latency
```

Initial claims should remain precise:

```text
Analytics apply to indexed Ethereum blocks and selected tracked tokens.
Wallet rankings apply to indexed wallets within the processed range.
```

---

## 18. Future Enhancements

```text
Polygon adapter
BNB Chain adapter
Arbitrum adapter
Multiple RPC providers with failover
ClickHouse comparison
Materialized views
Airflow orchestration
Kafka-based alert delivery
Prometheus and Grafana monitoring
Terraform-based AWS infrastructure
Role-based dashboard access
Scheduled PDF reports
ML-based anomaly detection
```

---

## 19. Interview Positioning

### Short Explanation

```text
ChainSight is a concurrent historical-data warehouse built with Java 21
and Spring Boot. Ethereum is the initial public transaction-data source.
The system extracts block ranges concurrently, transforms raw records,
stores them efficiently using PostgreSQL batch ingestion, and exposes
analytics APIs for wallet, network, and token trends.
```

### Engineering Explanation

```text
The difficult part is not fetching blockchain data. The difficult part
is designing a restart-safe, idempotent, concurrent ETL pipeline that
can ingest high-volume records efficiently, recover from RPC failures,
prevent duplicate processing, optimize analytical SQL queries, and
remain observable after deployment.
```

### Resume Title

```text
ChainSight — Concurrent Historical Data Warehouse and Analytics Platform
```

### Resume Description

```text
Built a Java 21 and Spring Boot historical-data warehouse using Ethereum
as a publicly accessible high-volume transaction source. Implemented
bounded custom thread pools, CompletableFuture-based extraction,
restart-safe ACID checkpointing, JDBC batch ingestion, PostgreSQL B-Tree
indexes and window-function analytics. Added Redis caching, distributed
locks, token-bucket rate limiting, RPC circuit breakers, automated tests,
GitHub Actions CI and AWS EC2 deployment through Docker Compose.
```

---

## 20. Final Project Goal

The final system should prove that the developer can:

```text
Design a backend system
Process high-volume data
Write clean Java code
Handle concurrency correctly
Use PostgreSQL beyond basic CRUD
Build restart-safe ETL pipelines
Use Redis for caching and coordination
Handle external-service failures
Write automated tests
Benchmark performance
Deploy with Docker
Host on AWS
Explain engineering trade-offs clearly
```

---

## 21. Next Step

The next document should be:

```text
docs/product-requirements.md
```

That document will formally define:

```text
Functional requirements
Non-functional requirements
Actors
User stories
Use cases
Acceptance criteria
Out-of-scope items
MVP boundaries
```
