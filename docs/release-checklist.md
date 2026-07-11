# ChainSight Release Checklist

Status: checklist created, release not tagged yet.

Use this before creating a portfolio release tag such as `v1.0.0`.

## Required Before `v1.0.0`

- All code needed for the release is committed on `main`.
- `backend` tests pass locally with JDK 21.
- GitHub Actions has at least one passing run for the release commit.
- Docker Compose production stack has been started at least once.
- Dashboard has been manually opened and checked.
- `docs/interview.md` stays a small index and maintenance contract.
- Relevant `docs/interview/` topic files describe only implemented features.
- `docs/interview/interview_evidence.md` links every major claim to proof.
- `docs/benchmark-report.md` contains real measurements or clearly says measurements are pending.
- AWS deployment evidence is captured before claiming hosting.

## Suggested Release Evidence

- Git commit hash.
- GitHub Actions run URL.
- Screenshot of dashboard.
- `curl /actuator/health` output.
- Benchmark report section with raw query output.
- Public URL only if EC2 deployment is live.

## Tagging Command

Do not run this until the checklist above is complete.

```powershell
git tag -a v1.0.0 -m "ChainSight v1.0.0"
git push origin v1.0.0
```
