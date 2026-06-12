# ChainSight Sprint Roadmap

This roadmap keeps sprint scope controlled. Do not claim future sprint items as implemented until code, docs, and evidence exist.

## Sprint 6 - Dashboard

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

## Sprint 7 - AWS Deployment Readiness

Implemented scope:

- Docker Compose production profile.
- EC2 setup notes for t3.medium in Mumbai region.
- Nginx reverse proxy.
- Environment variable checklist.
- Budget-control notes.
- Secret-safe production env template.
- Docker build context ignores.

Files:

- `backend/Dockerfile`
- `backend/.dockerignore`
- `.dockerignore`
- `infra/docker-compose.prod.yml`
- `infra/env.prod.example`
- `infra/nginx/chainsight.conf`
- `docs/aws-deployment.md`

Still not implemented:

- Public demo URL evidence.
- Live EC2 verification.
- HTTPS/domain setup.

Do not build during Sprint 7:

- Terraform.
- Kubernetes.
- Multi-service split.
- Managed RDS or ElastiCache.

## Sprint 8 - Evidence And Release Readiness

Implemented scope:

- GitHub Actions backend CI workflow file.
- Benchmark report template for ingestion timing and `EXPLAIN ANALYZE` output.
- Release checklist for `v1.0.0`.
- README polish.
- Evidence ledger completion.

Files:

- `.github/workflows/backend-ci.yml`
- `docs/benchmark-report.md`
- `docs/release-checklist.md`
- `docs/interview-evidence.md`
- `docs/interview.md`

Still not implemented:

- Actual `EXPLAIN ANALYZE` benchmark measurements.
- Ingestion benchmark results.
- Passing remote GitHub Actions run evidence.
- Release tag `v1.0.0`.

Do not claim yet:

- Measured throughput improvement.
- Measured index performance improvement.
- CI/CD pipeline success.
- Hosted public demo.

## Current Sprint 9 - Wallet Analytics API

Implemented scope:

- Wallet transaction-history endpoint over native transactions.
- Wallet summary endpoint with sent/received counts and Wei totals.
- Address normalization and validation.
- Pagination validation for wallet transaction history.
- Focused wallet analytics service unit tests.
- Wallet lookup panel in the static operations dashboard.

Files:

- `backend/src/main/resources/static/dashboard/index.html`
- `backend/src/main/resources/static/dashboard/dashboard.css`
- `backend/src/main/resources/static/dashboard/dashboard.js`
- `backend/src/main/java/com/chainsight/analytics/controller/WalletAnalyticsController.java`
- `backend/src/main/java/com/chainsight/analytics/service/WalletAnalyticsService.java`
- `backend/src/main/java/com/chainsight/analytics/repository/WalletAnalyticsRepository.java`
- `backend/src/main/java/com/chainsight/analytics/dto/WalletTransactionResponse.java`
- `backend/src/main/java/com/chainsight/analytics/dto/WalletTransactionsResponse.java`
- `backend/src/main/java/com/chainsight/analytics/dto/WalletSummaryResponse.java`
- `backend/src/test/java/com/chainsight/analytics/service/WalletAnalyticsServiceTest.java`

Still not implemented:

- Top wallets endpoint.
- Token transfer analytics.
- Redis caching for wallet analytics.

## Later Backlog

Future candidates:

- Top wallets analytics endpoint.
- Token transfer extraction.
- Token analytics API and dashboard view.
- Retry with backoff.
- Frontend framework migration if the static dashboard becomes limiting.
- Authentication.
- Role-based admin controls.
