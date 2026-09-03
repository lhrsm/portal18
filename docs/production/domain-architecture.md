# Portal18 — Canonical Domain Architecture & Host Policy

> [!IMPORTANT]
> **CANONICAL HOST AUTHORITY | ZERO HOST HEADER INJECTION | STRICT HTTPS**

---

## 1. Canonical Domain Model

| Parameter | Governance Rule | Production Policy |
|---|---|---|
| **Canonical Origin** | `PORTAL18_CANONICAL_ORIGIN` / `NEXT_PUBLIC_SITE_URL` | Explicitly configured via environment variable |
| **Apex vs WWW Policy** | Single Canonical Host | Non-canonical variant permanently redirects (301) to canonical |
| **Subdomain Strategy** | Dedicated Functional Subdomains | `notify.<domain>` (Email), `status.<domain>` (Monitoring) |
| **TLS Enforcement** | Automatic HTTPS-only | HTTP requests upgrade via 308 permanent redirect |
| **Cookie Domain** | Host-only isolation | `SameSite=Lax` / `SameSite=Strict`, `Secure=true`, `HttpOnly=true` |

---

## 2. Host Header Injection Prevention

All password recovery links, email verification tokens, OAuth redirection URLs, and webhook callbacks derive **strictly** from configured canonical environment settings (`NEXT_PUBLIC_SITE_URL` / `CANONICAL_ORIGIN`), completely ignoring untrusted inbound client `Host` request headers.
