# Security Interview Notes

## 30 Second Answer

ChainSight uses Spring Security with stateless JWT authentication. Email/password users are stored with BCrypt password hashes. Wallet login uses a Redis-backed nonce and Web3j signature recovery before issuing the same JWT response.

The stabilization pass tightened API authorization so ingestion and user-specific wallet endpoints require JWT. Public access is limited to the dashboard, basic health, auth entry points, and read-only analytics. Auth endpoints are also covered by the Redis token-bucket rate limiter with a stricter bucket than general analytics traffic.

## Code Mapping

Auth:

- `backend/src/main/java/com/chainsight/auth/controller/AuthController.java`
- `backend/src/main/java/com/chainsight/auth/service/AuthService.java`
- `backend/src/main/java/com/chainsight/auth/service/JwtService.java`
- `backend/src/main/java/com/chainsight/auth/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/chainsight/auth/security/SecurityConfig.java`
- `backend/src/main/java/com/chainsight/auth/repository/AuthRepository.java`

Wallet watchlist:

- `backend/src/main/java/com/chainsight/wallet/controller/TrackedWalletController.java`
- `backend/src/main/java/com/chainsight/wallet/service/TrackedWalletService.java`
- `backend/src/main/java/com/chainsight/wallet/repository/TrackedWalletRepository.java`

Migrations:

- `backend/src/main/resources/db/migration/V2__auth_and_tracked_wallets.sql`
- `backend/src/main/resources/db/migration/V3__add_wallet_auth.sql`

Protected APIs:

- `GET /api/v1/auth/me`
- `GET /api/v1/ingestion/**`
- `POST /api/v1/ingestion/**`
- `GET /api/v1/tracked-wallets`
- `POST /api/v1/tracked-wallets`
- `DELETE /api/v1/tracked-wallets/{walletId}`

Public APIs:

- `GET /dashboard/**`
- `GET /actuator/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/nonce`
- `POST /api/v1/auth/wallet-login`
- `GET /api/v1/analytics/**`

## Concepts Used

| Concept | What it is | Why used here | Alternative | Trade-off |
|---|---|---|---|---|
| BCrypt | Password hashing algorithm | Never store raw passwords | Plain hash, Argon2 | BCrypt is common; Argon2 can be stronger |
| JWT | Signed stateless token | Avoid server-side session store | Sessions | Easy scaling, harder revocation |
| HMAC-SHA256 | Symmetric JWT signing | Simple token integrity | RSA/ECDSA JWT | Shared secret must be protected |
| `OncePerRequestFilter` | Runs once per request | Validate bearer token before controllers | Controller checks | Centralized security |
| Wallet signature | User signs challenge | Proves wallet control | OAuth wallet service | More self-contained |
| Redis nonce | One-time login challenge | Prevent replay | PostgreSQL nonce table | Fast TTL, Redis dependency |
| Token bucket | Rate limit sensitive endpoints | Slow brute force/spam | Fixed window limiter | Fairer but Redis-dependent |

## Wallet Login Flow

```text
Frontend asks /auth/nonce for wallet address
        |
Backend stores nonce in Redis and returns message
        |
Wallet signs exact message
        |
Frontend sends walletAddress + signature
        |
Backend recovers signer address with Web3j
        |
Backend compares recovered address and deletes nonce
        |
Backend returns JWT
```

## Failure Scenarios

| Failure | Handling | Limitation |
|---|---|---|
| Duplicate email | Rejected with generic duplicate email error | No email verification |
| Wrong password | Generic invalid credentials error | No lockout policy |
| Expired wallet nonce | Wallet login rejected | User must retry |
| Malformed signature | Rejected before Web3j recovery | Full wallet runtime test pending |
| Missing JWT | Protected APIs return unauthorized | No refresh token yet |
| XSS risk with localStorage | Not solved | Production hardening needed |
| Auth spam/brute force | Redis token bucket limits login/register/nonce/wallet-login | No account lockout policy yet |

## What I Can Honestly Claim

- BCrypt password hashing is implemented.
- JWT creation and validation are implemented.
- Protected tracked-wallet APIs use authenticated principal.
- Ingestion APIs require JWT after stabilization.
- Auth endpoints are rate-limited with a stricter Redis bucket.
- Wallet-signature login code exists.
- WalletConnect path is coded but not production verified.

## Do Not Claim Yet

- Refresh tokens.
- Password reset.
- Roles/admin permissions.
- Account lockout / brute-force lockout.
- Full SIWE compliance.
- Production verified WalletConnect.
