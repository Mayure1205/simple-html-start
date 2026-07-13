# DevOps Runbook — Weekend 1 (Docker Hub + CI/CD + AWS EC2)

Sab commands terminal pe tere paas chalane ke liye hain. Order strict rakh — har step ka evidence capture kar (screenshot / URL) aur `docs/interview/interview_evidence.md` mein daal.

---

## Prereqs (10 min)

1. Docker Hub account: https://hub.docker.com/signup — username note kar (e.g. `mayuresh`).
2. Docker Hub access token: **Account Settings → Personal Access Tokens → Generate new token** (scope: Read, Write, Delete). Token copy kar — dubara nahi dikhega.
3. GitHub repo secrets add kar: **Repo → Settings → Secrets and variables → Actions → New repository secret**
   - `DOCKERHUB_USERNAME` = tera Docker Hub username
   - `DOCKERHUB_TOKEN` = upar wala token

---

## B1 — Docker Hub push (local test, 20 min)

Local pe pehli baar manually push kar taaki setup verify ho.

```bash
# 1. Login
docker login -u <DOCKERHUB_USERNAME>
# password prompt pe access token paste kar

# 2. Build image with proper tag
cd backend
docker build -t <DOCKERHUB_USERNAME>/chainsight-backend:v0.1.0 -t <DOCKERHUB_USERNAME>/chainsight-backend:latest .

# 3. Push
docker push <DOCKERHUB_USERNAME>/chainsight-backend:v0.1.0
docker push <DOCKERHUB_USERNAME>/chainsight-backend:latest

# 4. Verify — browser mein open kar
# https://hub.docker.com/r/<DOCKERHUB_USERNAME>/chainsight-backend/tags
```

**Evidence**: Docker Hub repo URL screenshot le → `docs/interview/interview_evidence.md` mein "Docker Hub image publish" row add kar.

---

## B2 — CI/CD auto-push (GitHub Actions, already configured)

File already created: `.github/workflows/docker-publish.yml`

Kaise trigger hoga:
- **Push to `main`** with changes in `backend/**` → builds + pushes `latest` + `sha-<short>` tag
- **Push tag `v1.0.0`** → also pushes `1.0.0` + `1.0` tags
- **Manual** → Actions tab → "Publish backend image" → Run workflow

Test karne ke liye:

```bash
# Tiny change karke push kar
cd backend
echo "# ci trigger" >> README.md   # ya koi bhi backend file
git add . && git commit -m "chore(ci): trigger docker publish"
git push origin main
```

Fir GitHub → Actions tab → workflow green hone tak wait kar (~5-8 min pehli baar, cached baad mein).

**Evidence**: green workflow run URL copy → evidence ledger.

Release tag banane ke liye:
```bash
git tag -a v0.1.0 -m "First published image"
git push origin v0.1.0
```

---

## B3 — AWS EC2 deployment (2-3 hrs, ~$3-5)

### Step 1: Launch EC2 (10 min)

1. AWS Console → EC2 → **Launch Instance**
2. Name: `chainsight-demo`
3. AMI: **Ubuntu Server 24.04 LTS** (free tier eligible)
4. Instance type: **t3.small** (2GB RAM enough for demo; downgrade se `t2.micro` free tier possible but tight)
5. Key pair: **Create new** → download `.pem` → save safely
6. Network → **Create security group**:
   - SSH (22) → source: **My IP** only
   - HTTP (80) → source: Anywhere IPv4
   - HTTPS (443) → source: Anywhere IPv4
7. Storage: 20GB gp3
8. **Launch instance** → wait for "Running" state → note **Public IPv4**

### Step 2: AWS budget alerts (5 min, critical)

Console → **Billing → Budgets → Create budget** → Monthly cost budget → threshold $10, $20, $50 with email alerts. Yeh miss mat kar.

### Step 3: SSH + install Docker (15 min)

```bash
chmod 400 ~/Downloads/chainsight-demo.pem
ssh -i ~/Downloads/chainsight-demo.pem ubuntu@<EC2_PUBLIC_IP>

# On the EC2 box:
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
exit
```

Log back in (group refresh ke liye):
```bash
ssh -i ~/Downloads/chainsight-demo.pem ubuntu@<EC2_PUBLIC_IP>
docker --version   # verify
```

### Step 4: Deploy from Docker Hub (10 min)

```bash
# On EC2:
git clone https://github.com/MayureshTardekar/ChainSight.git
cd ChainSight

# Create prod env file
cp infra/env.prod.example infra/.env.prod
nano infra/.env.prod
```

`infra/.env.prod` mein set kar:
```
POSTGRES_PASSWORD=<generate: openssl rand -hex 24>
JWT_SECRET=<generate: openssl rand -hex 32>
ETH_RPC_URL=https://mainnet.infura.io/v3/<your-key>
BACKEND_IMAGE=<DOCKERHUB_USERNAME>/chainsight-backend:latest
```

Deploy:
```bash
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml pull
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps

# Health check
curl http://localhost/actuator/health
```

Browser: `http://<EC2_PUBLIC_IP>/dashboard/index.html`

### Step 5: Free HTTPS (optional but big flex, 20 min)

Free domain: https://www.duckdns.org — sign in → subdomain claim kar (e.g. `chainsight.duckdns.org`) → point to EC2 IP.

```bash
# On EC2:
sudo apt-get install -y certbot python3-certbot-nginx
# stop compose nginx briefly so certbot standalone can bind :80
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d chainsight.duckdns.org
```

Fir nginx config mein SSL block add karna hoga (separate step, bata dena karna hai to config likh dunga).

**Evidence**: `http://<EC2_IP>/dashboard/index.html` live URL + `curl` health output → evidence ledger.

---

## Rollout checklist

- [ ] Docker Hub repo public + `latest` tag pushed
- [ ] `docker-publish.yml` workflow green on main
- [ ] EC2 running, security group hardened
- [ ] AWS budget alerts set at $10/$20/$50
- [ ] Live URL responds `{"status":"UP"}`
- [ ] `docs/interview/interview_evidence.md` updated with URLs + screenshots
- [ ] `docs/interview/interview_devops.md` mein "planned" → "shipped" karna

---

## Interview one-liners (memorize)

- "Docker image builds in GitHub Actions on every push to main, tagged with git SHA for traceability, pushed to Docker Hub."
- "EC2 pulls the image — build karna aur deploy karna alag concerns hain, pull-based deploy immutable artifacts guarantee karta hai."
- "Nginx reverse proxy in front, Postgres + Redis internal-only network, security group SSH restricted to my IP."
- "Budget alerts at 3 thresholds — cost discipline built in."

---

## Common gotchas

- **`docker compose pull` says "image not found"** → Docker Hub repo private hai. `hub.docker.com/r/<user>/chainsight-backend → Settings → Make public`.
- **Backend container restarts loop** → `docker compose logs backend` dekh. Usually `JWT_SECRET` chhota hai (< 32 chars) ya `ETH_RPC_URL` galat.
- **Port 80 not accessible** → EC2 security group inbound rule check kar.
- **CI workflow skip ho gaya** → path filter (`backend/**`) match nahi hua. Manual `workflow_dispatch` se trigger kar.
