# Portal18 — DNS Readiness & Zone Record Specifications

> [!IMPORTANT]
> **RECORD SPECIFICATIONS | ZERO FABRICATED VALUES | PROVIDER DEPENDENT**

---

## 1. Planned DNS Zone Inventory

| Record Type | Hostname / Name | Target / Purpose | TTL (Initial) | Status |
|---|---|---|---|---|
| **A / AAAA** | `@` (Apex) | Routing target provided by hosting platform | **PROVIDER_DEPENDENT** | **DNS_PROVIDER_PENDING** |
| **CNAME** | `www` | Canonical Apex / CNAME Target | **PROVIDER_DEPENDENT** | **DNS_PROVIDER_PENDING** |
| **TXT** | `@` | SPF Email Authorization (`v=spf1 ...`) | **PROVIDER_DEPENDENT** | **SENDER_DOMAIN_PENDING** |
| **CNAME / TXT** | `*._domainkey.notify` | DKIM Public Key Selectors | **PROVIDER_DEPENDENT** | **PROVIDER_DEPENDENT** |
| **TXT** | `_dmarc` | DMARC Policy (`v=DMARC1; p=none; ...`) | **PROVIDER_DEPENDENT** | **DOMAIN_PENDING** |
| **CAA** | `@` | TLS Certificate Authority Authorization | **OPTIONAL** | **REVIEW_AFTER_TLS_PROVIDER_SELECTION** |
| **DNSSEC** | `@` | Domain Name System Security Extensions | **OPTIONAL** | **PROVIDER_CAPABILITY_PENDING** |
