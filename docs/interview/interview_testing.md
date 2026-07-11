# Testing Interview Notes

## 30 Second Answer

The project has focused service unit tests and Testcontainers-based integration test code. Unit tests verify validation, resume logic, overlap rejection, analytics validation, auth, and tracked-wallet behavior. Docker-dependent integration tests need Docker running.

## Code Mapping

Unit tests:

- `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`
- `backend/src/test/java/com/chainsight/analytics/service/NetworkAnalyticsServiceTest.java`
- `backend/src/test/java/com/chainsight/analytics/service/WalletAnalyticsServiceTest.java`
- `backend/src/test/java/com/chainsight/auth/service/AuthServiceTest.java`
- `backend/src/test/java/com/chainsight/wallet/service/TrackedWalletServiceTest.java`

Integration tests:

- `backend/src/test/java/com/chainsight/ingestion/repository/BlockJdbcRepositoryIntegrationTest.java`

## What Is Verified

- Ingestion resume behavior.
- Same-chain overlap rejection.
- Failed-block retry service behavior.
- Network analytics validation.
- Wallet analytics address/page validation.
- Email/password auth validation.
- Wallet-login nonce/signature service cases were added.
- Tracked-wallet duplicate and ownership logic.

## What Needs Runtime Verification

- Full Maven test run after latest wallet changes.
- Testcontainers PostgreSQL integration tests with Docker Desktop running.
- Redis-backed cache/lock/rate-limit behavior with local Docker.
- Real wallet login with backend, PostgreSQL, Redis, and wallet provider.

## Commands

Use when ready:

```powershell
cd backend
mvn test
```

For Docker-dependent tests, Docker Desktop must be running.

## Interview Questions

Q: Why unit tests and integration tests?
A: Unit tests prove service decisions quickly. Integration tests prove actual database transaction/conflict behavior.

Q: Why Testcontainers?
A: It runs tests against real PostgreSQL behavior instead of a fake in-memory database.

## Do Not Claim Yet

- Passing latest full Maven test run.
- Passing remote CI run.
- Load testing.
