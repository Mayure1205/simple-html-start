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
- `docs/interview/interview_evidence.md`
- `docs/interview.md`
- Topic files under `docs/interview/`

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

## Sprint 9 - Wallet Analytics API

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

## Sprint 10 - JWT Auth And Tracked Wallets

Implemented scope:

- Email/password registration and login.
- BCrypt password hashing.
- HMAC-SHA256 JWT access tokens.
- Stateless Spring Security filter for protected APIs.
- `GET /api/v1/auth/me` authenticated profile endpoint.
- Per-user tracked wallet watchlist APIs.
- Dashboard login, logout, and tracked-wallet controls.
- Flyway migration for `app_users` and `user_tracked_wallets`.
- Focused auth and tracked-wallet service unit tests.

Files:

- `backend/src/main/resources/db/migration/V2__auth_and_tracked_wallets.sql`
- `backend/src/main/java/com/chainsight/auth`
- `backend/src/main/java/com/chainsight/wallet`
- `backend/src/main/resources/static/dashboard/index.html`
- `backend/src/main/resources/static/dashboard/dashboard.css`
- `backend/src/main/resources/static/dashboard/dashboard.js`
- `backend/src/test/java/com/chainsight/auth/service/AuthServiceTest.java`
- `backend/src/test/java/com/chainsight/wallet/service/TrackedWalletServiceTest.java`

Moved to Sprint 11 / follow-up:

- Wallet-signature login hardening and provider-neutral UI.
- Production-verified WalletConnect login with a Reown Project ID.
- Roles/admin permissions.
- Refresh tokens.
- Manual browser verification for dashboard auth/watchlist flow.

## Current Sprint 11 - Wallet Sign-In UI And Auth Hardening

Implemented scope:

- Wallet nonce endpoint returns the exact sign-in message to sign.
- Wallet-login endpoint verifies `personal_sign` signatures and issues JWTs.
- Wallet address and malformed signature validation in auth service.
- Dashboard account panel no longer exposes implementation labels.
- Provider-neutral wallet chooser for injected browser wallets.
- WalletConnect/Reown setup path for QR/mobile wallets.
- Collapsible sidebar with saved local preference.
- Focused auth service tests updated for wallet login cases.
- Static UI browser check for provider modal and sidebar collapse.

Files:

- `backend/src/main/resources/db/migration/V3__add_wallet_auth.sql`
- `backend/src/main/java/com/chainsight/auth/controller/AuthController.java`
- `backend/src/main/java/com/chainsight/auth/service/AuthService.java`
- `backend/src/main/java/com/chainsight/auth/dto/NonceResponse.java`
- `backend/src/main/java/com/chainsight/auth/security/SecurityConfig.java`
- `backend/src/main/resources/static/dashboard/index.html`
- `backend/src/main/resources/static/dashboard/dashboard.css`
- `backend/src/main/resources/static/dashboard/dashboard.js`
- `backend/src/test/java/com/chainsight/auth/service/AuthServiceTest.java`

Still not implemented:

- Real wallet verification with backend, Redis, and PostgreSQL running.
- Reown/WalletConnect Project ID configuration for actual QR/mobile login.
- Full SIWE-compatible message format.
- Refresh tokens.
- Roles/admin permissions.
- Password reset.

## Later Backlog

Future candidates:

- Full SIWE-compliant wallet login.
- Production-verified WalletConnect login.
- Top wallets analytics endpoint.
- Token transfer extraction.
- Token analytics API and dashboard view.
- Retry with backoff.
- Frontend framework migration if the static dashboard becomes limiting.
- Role-based admin controls.
