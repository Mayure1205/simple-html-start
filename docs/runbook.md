# ChainSight Runbook

## Local Startup

Verify Maven is using JDK 21:

```powershell
mvn -version
```

The `Java version` line must show `21.x`. If it shows `17.x` or `20.x`, install JDK 21 and point `JAVA_HOME` to it before running Maven.

Start dependencies:

```powershell
docker compose -f infra/docker-compose.local.yml up -d
```

Run the backend:

```powershell
cd backend
mvn spring-boot:run
```

Check health:

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
```

Open the local dashboard:

```text
http://localhost:8080/dashboard/index.html
```

## Local Shutdown

Stop containers without deleting volumes:

```powershell
docker compose -f infra/docker-compose.local.yml down
```

Stop containers and delete local database/cache volumes:

```powershell
docker compose -f infra/docker-compose.local.yml down -v
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `chainsight` | PostgreSQL database |
| `POSTGRES_USER` | `chainsight_user` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `chainsight_password` | PostgreSQL password |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `ETH_RPC_URL` | `https://cloudflare-eth.com` | Ethereum JSON-RPC URL |

Never commit provider URLs containing API keys.

## Database Migrations

Flyway runs automatically when the backend starts.

For a clean local database during early development:

```powershell
docker compose -f infra/docker-compose.local.yml down -v
docker compose -f infra/docker-compose.local.yml up -d
cd backend
mvn spring-boot:run
```

After the schema is used by teammates or deployed anywhere, do not edit old Flyway migrations. Add a new `V2__...sql` migration instead.

## Verification Checklist

Before opening a PR:

```powershell
cd backend
mvn test
```

Also verify:

- Docker Compose starts PostgreSQL and Redis.
- Backend health endpoint is up.
- Flyway migrations apply cleanly on a fresh database.
- `docs/interview-evidence.md` is updated for any new claim.

## Troubleshooting

### Port already in use

PostgreSQL uses `5432`, Redis uses `6379`, and the backend uses `8080`. Stop conflicting local services or change the mapped ports in `infra/docker-compose.local.yml`.

### Flyway migration fails locally

If this is a disposable development database, reset volumes with:

```powershell
docker compose -f infra/docker-compose.local.yml down -v
```

Then start dependencies again.

### RPC provider fails

Use another provider URL through `ETH_RPC_URL`. Circuit breaker and failed-block handling are implemented; retry with backoff is still planned.

## Evidence Discipline

Every interview claim must point to proof:

- Source files for implementation claims.
- Tests for reliability claims.
- Benchmark report for performance claims.
- GitHub Actions links for CI claims.
- Deployment URL or screenshots for AWS claims.
