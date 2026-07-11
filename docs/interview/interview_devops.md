# DevOps Interview Notes

## 30 Second Answer

The repo has CI and release-readiness files, but no captured passing remote CI run yet. Evidence is tracked separately so claims stay honest.

## Code Mapping

- GitHub Actions workflow: `.github/workflows/backend-ci.yml`
- Release checklist: `docs/release-checklist.md`
- Evidence ledger: `docs/interview/interview_evidence.md`
- Benchmark template: `docs/benchmark-report.md`
- Sprint roadmap: `docs/sprint-roadmap.md`

## Concepts Used

| Concept | What it is | Why used |
|---|---|---|
| CI workflow | Automated test run on push/PR | Proves repeatable build/test process |
| Release checklist | Go/no-go list | Prevents premature v1.0 claims |
| Evidence ledger | Proof table | Keeps interviews fact-based |
| Maven cache | Faster CI dependencies | Speeds repeated builds |

## What Exists

- Backend CI workflow file exists.
- Release checklist exists.
- Benchmark report template exists.
- Evidence ledger exists.

## What Is Pending

- Passing GitHub Actions run link.
- Release tag `v1.0.0`.
- Benchmark results.
- Deployment evidence.

## Do Not Claim Yet

- CI/CD is passing in production.
- Automated deployment.
- Release tag published.
