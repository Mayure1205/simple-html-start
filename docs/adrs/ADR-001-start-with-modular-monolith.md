# ADR-001: Start With a Modular Monolith

## Status

Accepted

## Context

ChainSight needs to demonstrate backend engineering, concurrent ETL, database design, resilience, testing, and deployment. It does not need early distributed-system complexity.

The project will run initially as one Spring Boot backend with PostgreSQL and Redis. The code still needs clear module boundaries so ingestion, analytics, resilience, and persistence can evolve independently.

## Decision

Build ChainSight as a modular monolith for MVP.

Use package boundaries for:

- Ethereum RPC access.
- Ingestion orchestration.
- Warehouse persistence.
- Analytics queries.
- Resilience features.
- Admin APIs.
- Configuration.

Avoid microservices until there is a measured reason to split a module by deployment, scaling, ownership, or reliability needs.

## Consequences

Positive:

- Easier to build, run, test, and debug locally.
- Fits a solo portfolio project and fresher learning path.
- Keeps transactions and restart-safe ingestion simpler.
- Avoids premature networking, service discovery, and distributed tracing overhead.

Trade-offs:

- All modules deploy together.
- A bug in one backend module can affect the process.
- Future scaling may require extracting ingestion workers or analytics services.

## Follow-Up Criteria

Consider splitting a module only if evidence shows one of these:

- Ingestion needs independent horizontal scaling.
- Analytics workload affects ingestion stability.
- Deployment cadence differs between modules.
- Background workers require separate resource allocation.
