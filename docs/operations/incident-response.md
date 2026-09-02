# Portal18 — Incident Management & Response Runbook

> [!IMPORTANT]
> **SEV-0 TO SEV-3 CLASSIFICATION | EVIDENCE PRESERVATION | LEGAL ESCALATION**

---

## 1. Incident Severity Classification

- **SEV-0 (Critical Emergency)**:
  - Age Assurance bypass or under-18 safety failure.
  - Cross-user private data or KYC document exposure.
  - Real unauthorized payment execution attempt.
  - Production credential or secret compromise.
- **SEV-1 (High Impact)**:
  - Total authentication or database outage.
  - Public profile moderation pipeline failure.
  - Major financial ledger corruption.
- **SEV-2 (Medium Impact)**:
  - Degraded search performance or transient notification delays.
- **SEV-3 (Low Impact)**:
  - Minor cosmetic discrepancy or non-critical UX glitch.

---

## 2. Response Lifecycle

1. **Detection & Triage**: Automatic alert or user report triggers classification.
2. **Containment**: Apply Kill Switch (`PORTAL18_PAYMENT_KILL_SWITCH`, `PORTAL18_EMAIL_KILL_SWITCH`) or maintenance mode if safety is compromised.
3. **Investigation & Remediation**: Identify root cause, apply hotfix or rollback.
4. **Post-Mortem**: Document root cause, timeline, and preventive actions within 48 hours.
