# ChainSight — Next Steps: Features + DevOps Flex

Do tracks parallel chalayenge. **Track A** = product/interview features (frontend + light backend). **Track B** = DevOps practice (max resume flex). Pick sequence at the end.

---

## Track A — Feature additions (interview weight)

Priority order, har ek ka interview angle diya hai.

### A1. Wallet comparison mode (2-3 wallets side-by-side)
- Watchlist se checkbox → "Compare" button → overlay net-flow chart
- **Interview line**: "Same warehouse query, parameterized — proves reusable analytics layer"
- Backend: koi naya endpoint nahi, existing `/daily-flow` ko multiple wallets ke liye call karo

### A2. CSV export (transactions + daily flow)
- Har table/chart ke corner mein "Export CSV" button
- **Interview line**: "Streaming response, no memory blow-up for large exports"
- Backend: 1 naya controller method with `StreamingResponseBody`

### A3. Block explorer mini-page
- Latest 50 blocks table → click → block detail (tx list, gas used, miner)
- **Interview line**: "Demonstrates warehouse read patterns beyond analytics"
- Backend: 2 endpoints (`/blocks/recent`, `/blocks/{number}`)

### A4. Ingestion metrics panel (Prometheus-style)
- Blocks/sec, avg batch latency, failed block count, RPC circuit breaker state
- **Interview line**: "Observability into the ETL pipeline — SRE mindset"
- Backend: expose Micrometer metrics (already there via actuator), frontend polls `/actuator/metrics`

### A5. Dark/light theme toggle + polish
- Small but shows frontend care; save preference to localStorage

**Recommendation**: A1 + A2 + A4. A3 skip (Etherscan clone lagta hai). A5 optional.

---

## Track B — DevOps practice (max interview flex)

Ye tera main ask hai. Sequenced beginner → advanced.

### B1. Docker Hub push (30 min)
- Backend image build → tag → push to `mayuresh/chainsight-backend:v1.0.0`
- Update `docker-compose.prod.yml` to pull from Docker Hub instead of local build
- **Interview line**: "Immutable versioned artifacts, pull-based deploys"
- **Evidence**: Docker Hub public repo link in resume

### B2. GitHub Actions — full CI/CD (1-2 hrs)
Current workflow sirf test chalata hai. Extend:
- On push to `main`: run tests → build Docker image → push to Docker Hub with git SHA tag
- On tag `v*`: also push `:latest` and `:vX.Y.Z`
- **Interview line**: "Trunk-based CI/CD, image tagged with commit SHA for traceability"
- **Evidence**: green workflow run link

### B3. AWS EC2 deployment (2-3 hrs, ~$5 cost)
- Launch `t3.small` (cheaper than `t3.medium` for demo)
- SSH → install Docker → `docker compose pull && up -d`
- Nginx already configured, add Let's Encrypt for HTTPS (free)
- Free `nip.io` or Duck DNS domain
- **Interview line**: "Deployed to AWS EC2 with Docker Compose, Nginx reverse proxy, LE HTTPS"
- **Evidence**: live URL + `curl` health check screenshot

### B4. GitHub Actions auto-deploy to EC2 (1 hr)
- Add SSH key as GitHub secret
- Workflow step: SSH → `docker compose pull && up -d`
- **Interview line**: "Zero-touch deploy on merge to main"
- **Evidence**: commit → live in 3 min video/gif

### B5. Monitoring stack — Prometheus + Grafana (2 hrs, bonus flex)
- Add Prometheus + Grafana containers to `docker-compose.prod.yml`
- Scrape backend `/actuator/prometheus`
- 1 dashboard: JVM heap, HTTP req/sec, ingestion rate, PostgreSQL connections
- **Interview line**: "Production observability — metrics-driven"
- **Evidence**: Grafana screenshot in evidence ledger

### B6. Bonus — Terraform for EC2 (advanced flex)
- IaC for EC2 + security group + EIP
- **Interview line**: "Infrastructure as code, reproducible environments"
- Only if B1-B5 done and interview date is far

---

## Recommended sequence (2 weekends)

**Weekend 1 (DevOps focus, high resume ROI)**
1. B1 — Docker Hub push
2. B2 — CI/CD image push
3. B3 — AWS EC2 deploy with HTTPS
4. Update `docs/interview/interview_evidence.md` + `interview_aws.md` + `interview_devops.md` with real URLs/screenshots

**Weekend 2 (features + polish)**
5. A4 — Ingestion metrics panel (pairs well with B5)
6. B5 — Prometheus + Grafana
7. A2 — CSV export
8. A1 — Wallet compare (if time)

Skip A3, A5, B6 unless bored.

---

## What I need from you to start

Pick one:
- **(1)** Start with **B1+B2** (Docker Hub + CI/CD) — I write configs, you run commands locally
- **(2)** Start with **A1/A2/A4 features** — I code frontend + backend spec
- **(3)** Full weekend 1 plan (B1→B2→B3) with step-by-step commands for you to run

Bata kaunsa — accordingly next plan mein exact files + commands du.
