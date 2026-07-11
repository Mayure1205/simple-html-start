# Docker Interview Notes

## 30 Second Answer

Docker is used to run local PostgreSQL and Redis consistently, and production-readiness files exist for running backend, PostgreSQL, Redis, and Nginx together.

## Code Mapping

- Local compose: `infra/docker-compose.local.yml`
- Production compose: `infra/docker-compose.prod.yml`
- Backend Dockerfile: `backend/Dockerfile`
- Nginx config: `infra/nginx/chainsight.conf`
- Production env example: `infra/env.prod.example`
- Docker ignore files: `.dockerignore`, `backend/.dockerignore`

## Concepts Used

| Concept | What it is | Why used |
|---|---|---|
| Docker Compose | Multi-container local stack | Start PostgreSQL/Redis consistently |
| Health check | Service readiness check | Backend should wait for dependencies in prod stack |
| Multi-stage Dockerfile | Build in one image, run in smaller image | Cleaner production artifact |
| Private network | Internal service communication | PostgreSQL/Redis should not be public |
| Env vars | External configuration | Keep secrets/config outside code |

## Local Plan

Next runtime step:

```powershell
docker compose -f infra/docker-compose.local.yml up -d
```

Then run backend against local PostgreSQL and Redis.

## Do Not Claim Yet

- Production Docker stack has been tested end-to-end.
- AWS deployment is live.
- PostgreSQL/RDS migration is complete.
