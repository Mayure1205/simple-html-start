# ChainSight Interview Docs Index

This file is only the index and maintenance contract. Do not turn it into the full interview guide.

Canonical interview notes live under:

```text
docs/interview/
```

## Maintenance Contract

- Never create one huge `interview.md`.
- Create topic-specific interview documents under `docs/interview/`.
- Each file should be independently readable in 10-15 minutes.
- If a file exceeds about 300-400 lines, split it further.
- Update the relevant topic file after every completed sprint, feature, refactor, architectural change, optimization, deployment change, or important bug fix.
- Update docs before marking a sprint complete.
- Never document planned features as completed.
- Never invent benchmark, latency, throughput, `EXPLAIN ANALYZE`, CI, AWS, or deployment evidence.
- Put planned or partial work under `Do Not Claim Yet`.
- Put proof-only material in `docs/interview/interview_evidence.md`.

## What To Open

| Interview question | Open |
|---|---|
| Tell me about the project | `docs/interview/interview_project_overview.md` |
| Explain the architecture | `docs/interview/interview_architecture.md` |
| Why PostgreSQL, indexes, SQL, window functions? | `docs/interview/interview_database.md` |
| What APIs exist? | `docs/interview/interview_api.md` |
| How ingestion works | `docs/interview/interview_ingestion.md` |
| ExecutorService, CompletableFuture, thread pools | `docs/interview/interview_concurrency.md` |
| Redis, cache, distributed lock, rate limiter | `docs/interview/interview_redis.md` |
| JWT, Spring Security, wallet login | `docs/interview/interview_security.md` |
| Tests and verification | `docs/interview/interview_testing.md` |
| Docker and local PostgreSQL/Redis | `docs/interview/interview_docker.md` |
| AWS deployment plan | `docs/interview/interview_aws.md` |
| CI/CD, release, evidence process | `docs/interview/interview_devops.md` |
| Benchmarks and EXPLAIN ANALYZE | `docs/interview/interview_performance.md` |
| Resume bullets | `docs/interview/interview_resume_points.md` |
| Last-day revision questions | `docs/interview/interview_faq.md` |
| Proofs only | `docs/interview/interview_evidence.md` |

## Global Honesty Rule

Implemented and coded features may be explained. Unverified runtime behavior must be labelled as pending verification. Planned features must stay under `Do Not Claim Yet`.
