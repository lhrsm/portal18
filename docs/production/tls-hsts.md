# Portal18 — TLS & Phased HSTS Deployment Policy

> [!IMPORTANT]
> **TLS GOVERNANCE | PHASED HSTS ROLLOUT | PRELOAD DISABLED BY DEFAULT**

---

## 1. TLS Certificate Lifecycle

- **Certificate Authority / Issuer**: `PROVIDER_DEPENDENT` (Managed by hosting / edge platform upon domain attachment).
- **Renewal Process**: `MANAGED_BY_HOSTING_PROVIDER / TO_BE_CONFIRMED`.
- **Protocols**: TLS 1.3 preferred; TLS 1.2 minimum. Insecure ciphers disabled.
- **Monitoring**: Automated synthetic monitor tracks certificate expiration.

---

## 2. Phased HSTS Rollout Protocol

To prevent accidental domain-wide lockouts during initial provisioning:
- **Phase 1 (Initial Launch)**: `Strict-Transport-Security: max-age=300` (5 minutes).
- **Phase 2 (Post-Verification - 7 days)**: `Strict-Transport-Security: max-age=86400` (1 day).
- **Phase 3 (Steady State - 30 days)**: `Strict-Transport-Security: max-age=31536000; includeSubDomains` (1 year).
- **HSTS Preload Policy**: `DISABLED / FUTURE EXPLICIT SECURITY DECISION` (Zero arbitrary timeframes; requires explicit platform security review).
