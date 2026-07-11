# AWS Interview Notes

## 30 Second Answer

AWS deployment is planned and documented, but not completed. The current plan is a simple cost-controlled EC2 deployment first, then possibly AWS RDS PostgreSQL after local Docker testing.

## Code Mapping

- AWS runbook: `docs/aws-deployment.md`
- Production compose: `infra/docker-compose.prod.yml`
- Nginx config: `infra/nginx/chainsight.conf`
- Backend Dockerfile: `backend/Dockerfile`
- Env example: `infra/env.prod.example`

## Current Plan

- Region: Mumbai (`ap-south-1`)
- Initial instance: EC2 `t3.medium`
- Runtime: Docker Compose on one VM
- Services: Spring Boot backend, PostgreSQL, Redis, Nginx
- Budget alerts: planned at $30, $60, $100
- Stop instance when not demoing.

## RDS Plan

The user wants:

1. Local Docker PostgreSQL first.
2. After testing, AWS RDS PostgreSQL.

This is sensible because local Docker is cheaper and faster for debugging. RDS should come after schema, migrations, tests, and local runtime behavior are stable.

## Do Not Claim Yet

- Live EC2 URL.
- RDS PostgreSQL deployed.
- HTTPS/domain configured.
- AWS production monitoring.
- Public demo evidence.
