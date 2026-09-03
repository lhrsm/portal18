# Portal18 — KYC Security & Identity Fraud Incident Runbook

> [!IMPORTANT]
> **SEV-0 IDENTITY ESCALATION | FRAUD CONTAINMENT | IMMEDIATE TRUST BADGE REVOCATION**

---

## 1. Identity Incident Classification

- **SEV-0 (Critical Identity Compromise)**:
  - Document tampering or identity theft confirmed on published advertiser.
  - Minor (< 18 years old) successfully bypassed verification gate.
  - Private KYC storage bucket public exposure.
- **SEV-1 (High Impact)**:
  - Provider webhook spoofing or replay attack detected.
  - Systematic verification failure due to provider outage.
- **SEV-2 (Operational Anomaly)**:
  - High manual review queue backlog (> 50 items).

---

## 2. Emergency Identity Fraud Containment Playbook

1. **Immediate Profile Suspension**: Trigger automated suspension of the flagged advertiser profile.
2. **Revoke Trust Signals**: Call server RPC `revoke_identity_verification` removing `Identidade Verificada` badge immediately.
3. **Audit Log Inspection**: Review `audit_logs` and `verification_history` to identify actor and review history.
4. **Law Enforcement & Legal Escalation**: Notify Legal Counsel and preserve cryptographic audit hashes.
