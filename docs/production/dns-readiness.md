# Portal18 — DNS Readiness & Zone Record Specifications

> [!IMPORTANT]
> **RECORD SPECIFICATIONS | ZERO FABRICATED VALUES | LOW INITIAL TTL**

---

## 1. Planned DNS Zone Inventory

| Record Type | Hostname / Name | Target / Purpose | TTL (Initial) | Status |
|---|---|---|---|---|
| **A / ALIAS** | `@` (Apex) | Hosting Provider Edge Anycast IP | 300s (5 min) | **DOMAIN_PENDING** |
| **CNAME** | `www` | Canonical Apex / CNAME Target | 300s (5 min) | **DOMAIN_PENDING** |
| **CNAME** | `_domainconnect` | Automated DNS Delegation | 3600s | **OPTIONAL** |
| **TXT** | `@` | SPF Email Authorization (`v=spf1 ...`) | 300s | **SENDER_DOMAIN_PENDING** |
| **CNAME** | `*._domainkey.notify` | 3x DKIM Public Key Selectors | 300s | **PROVIDER_PENDING** |
| **TXT** | `_dmarc` | DMARC Policy (`v=DMARC1; p=none; ...`) | 300s | **DOMAIN_PENDING** |
| **CAA** | `@` | TLS Certificate Authority Authorization | 3600s | **OPTIONAL** |
