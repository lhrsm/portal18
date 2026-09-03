# Portal18 — Fiscal Incident Response & Outage Containment

> [!IMPORTANT]
> **FISCAL OUTAGE RECOVERY | SEV-1 ESCALATION | DIGITAL CERTIFICATE ROTATION**

---

## 1. Incident Severity Definitions

- **SEV-1 (Fiscal Outage)**: Municipal API gateway outage or third-party fiscal vendor unavailable (> 2 hours).
- **SEV-2 (Certificate Expiration / Failure)**: Digital Certificate A1 revoked or expired.
- **SEV-3 (Reconciliation Mismatch Spike)**: Discrepancy volume exceeding 1% of daily settled orders.

---

## 2. Emergency Outage Playbook

1. **Trigger Fail-Closed State**: Activate `PORTAL18_FISCAL_KILL_SWITCH = true`.
2. **Buffer Inbound Events**: Queue eligible fiscal events in `fiscal_events` with status `queued`.
3. **Notify FinOps & Accounting**: Dispatch operations notification to Accounting Lead.
4. **Resumption & Idempotent Drain**: Post-resolution, drain queued items with atomic deduplication locks.
