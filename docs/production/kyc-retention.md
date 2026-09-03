# Portal18 — KYC Evidence Retention & Erasure Policy

> [!IMPORTANT]
> **LEGAL REVIEW REQUIRED | REGULATED RETENTION | AUDITED DISPOSAL**

---

## 1. Retention Schedule (Configurable Baseline)

- **Verification Metadata & Audit Logs**: Retained for duration of active advertiser account + statutory limitation period (5 years).
- **Private Document Images**: Retained in encrypted private bucket during active account status; scheduled for secure deletion 90 days after account termination unless subject to regulatory freeze.
- **Biometric Templates**: **ZERO STORAGE POLICY** (Handled transiently by certified identity provider; never ingested into Portal18 database).

---

## 2. LGPD Deletion Handling

When an advertiser submits an LGPD account deletion request:
1. **Public Profile & Media**: Deleted immediately.
2. **KYC Audit Trail**: Archived in restricted regulatory vault with access restricted to Compliance Officers (`LEGAL_RETENTION_LOCK`).
3. **Evidence Cleanup**: Document photos purged following statutory clearance.
