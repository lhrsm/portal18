# Portal18 — Deployment & Rollback Runbook

> [!IMPORTANT]
> **ATOMIC DEPLOYMENTS | FORWARD-FIX PREFERRED | FAIL-CLOSED ROLLBACK**

---

## 1. Deployment Pipeline

```
Developer Push → CI Quality Gate (Typescript, Lint, Tests, Build) → Staging Environment → Automated E2E Verification → Staff Sign-Off → Production Blue/Green Switch → Post-Deploy Smoke
```

---

## 2. Rollback Procedures

### A. Application-Only Rollback
- Revert commit on `master` branch and trigger automated redeployment, or switch traffic back to previous stable container/lambda release.

### B. Database Migration Rollback
- **Forward-Fix Preference**: Apply a new forward migration repairing the schema inconsistency rather than running destructive down-migrations.
- **Critical Failure Rollback**: Restore pre-migration database snapshot to a designated recovery instance.
