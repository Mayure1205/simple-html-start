# AWS Deployment Runbook

This is Sprint 7 deployment readiness documentation. It does not prove that ChainSight is hosted yet. Add the public URL and screenshots to `docs/interview/interview_evidence.md` only after deployment is actually live.

## Target

- AWS region: Mumbai (`ap-south-1`)
- Instance: EC2 `t3.medium`
- Storage: 30GB gp3 EBS
- Runtime: Docker Compose on one VM
- Services: Spring Boot backend, PostgreSQL, Redis, Nginx

## Budget Safety

- Set AWS budget alerts at `$30`, `$60`, and `$100`.
- Stop the EC2 instance when not using the demo.
- Do not use managed RDS, ElastiCache, Kubernetes, or load balancers for the portfolio MVP.

## EC2 Setup

SSH into the instance and install Docker:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Log out and back in after adding the user to the Docker group.

## Deploy

Clone the repo:

```bash
git clone https://github.com/MayureshTardekar/ChainSight.git
cd ChainSight
```

Create the production environment file:

```bash
cp infra/env.prod.example infra/.env.prod
nano infra/.env.prod
```

Set a real `POSTGRES_PASSWORD`, `JWT_SECRET`, and `ETH_RPC_URL`. Never commit `infra/.env.prod`.

Start the stack:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
```

Check services:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps
curl http://localhost/actuator/health
```

Open in browser:

```text
http://<EC2_PUBLIC_IP>/dashboard/index.html
```

## Operations

View logs:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs -f backend
```

Stop the stack:

```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml down
```

Stop the EC2 instance from AWS Console when the demo is not needed.

## Security Notes

- Open inbound `80/tcp` only for demo access.
- Restrict `22/tcp` SSH to your IP.
- Do not expose PostgreSQL `5432` or Redis `6379` publicly.
- Add HTTPS later with a domain and certificate. It is not part of this sprint.

## Evidence To Capture After Real Deployment

- Public demo URL.
- Screenshot of dashboard loading.
- `curl /actuator/health` result.
- `docker compose ps` output.
- AWS budget alert screenshot.
