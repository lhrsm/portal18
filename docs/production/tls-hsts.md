# Portal18 — TLS 1.3 & Phased HSTS Deployment Policy

> [!IMPORTANT]
> **AUTOMATED TLS RENEWAL | PHASED HSTS ROLLOUT | ZERO PRELOAD PREMATURE ACTIVATION**

---

## 1. TLS Certificate Lifecycle

- **Certificate Authority**: Managed Let's Encrypt / Cloudflare Edge / Vercel Managed TLS.
- **Protocols**: TLS 1.3 preferred; TLS 1.2 minimum. Insecure ciphers disabled.
- **Monitoring**: Automated synthetic monitor alerts operations 30 days prior to certificate expiration.

---

## 2. Phased HSTS Rollout Protocol

To prevent accidental domain-wide lockouts during initial provisioning:
- **Phase 1 (Initial Launch)**: `Strict-Transport-Security: max-age=300` (5 minutes).
- **Phase 2 (Post-Verification - 7 days)**: `Strict-Transport-Security: max-age=86400` (1 day).
- **Phase 3 (Steady State - 30 days)**: `Strict-Transport-Security: max-age=31536000; includeSubDomains` (1 year).
- *Preload Warning*: HSTS `preload` submission is **barred** until 6 months of continuous flawless production operation.
