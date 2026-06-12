# ChainSight Sprint Roadmap

This roadmap keeps sprint scope controlled. Do not claim future sprint items as implemented until code, docs, and evidence exist.

## Current Sprint 6 - Dashboard

Implemented scope:

- Static dashboard served by Spring Boot.
- Ingestion status cards.
- Range ingestion form.
- Network analytics chart and largest-transactions table.
- Failed-block list and retry action.
- Activity log and responsive layout.

Files:

- `backend/src/main/resources/static/dashboard/index.html`
- `backend/src/main/resources/static/dashboard/dashboard.css`
- `backend/src/main/resources/static/dashboard/dashboard.js`

Out of scope for Sprint 6:

- React or Angular build system.
- Authentication and user accounts.
- New backend analytics types.
- Wallet or token analytics screens.
- Deployment, Nginx, HTTPS, or AWS.
- Benchmark reports.

## Sprint 7 - AWS Deployment

Planned, not implemented:

- Docker Compose production profile.
- EC2 setup notes for t3.medium in Mumbai region.
- Nginx reverse proxy.
- Environment variable checklist.
- Public demo URL evidence.
- Budget-control notes.

Do not build during Sprint 6:

- Terraform.
- Kubernetes.
- Multi-service split.
- Managed RDS or ElastiCache.

## Sprint 8 - Evidence And Release

Planned, not implemented:

- `EXPLAIN ANALYZE` evidence for analytics queries.
- Ingestion benchmark report.
- README polish.
- Evidence ledger completion.
- Release tag `v1.0.0`.

Do not claim yet:

- Measured throughput improvement.
- Measured index performance improvement.
- CI/CD pipeline success.
- Hosted public demo.

## Later Backlog

Future candidates:

- Wallet analytics API and dashboard view.
- Token transfer extraction.
- Token analytics API and dashboard view.
- Retry with backoff.
- Frontend framework migration if the static dashboard becomes limiting.
- Authentication.
- Role-based admin controls.
