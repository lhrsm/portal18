# Portal18 — Production Traffic Gating & Access Controls

> [!IMPORTANT]
> **TRAFFIC STATUS: DISABLED | EDGE GATING ACTIVE | ACCESS RESTRICTED**

---

## 1. Traffic Gating Architecture

Prior to official commercial launch, public visitor traffic to the production environment is blocked at the edge infrastructure layer:

- **Public Traffic**: Returns `503 Service Unavailable` or maintenance splash page with `Retry-After` headers.
- **Staff / Operational Traffic**: Restricted to verified corporate IP ranges or VPN gateways with MFA.
- **Search Engine Crawlers**: Served `noindex, nofollow` headers and robots exclusion.

---

## 2. Safe Mode & Kill Switch Interlocking

Even if edge gating is opened for internal verification drills:
1. `PORTAL18_PAYMENT_KILL_SWITCH = true`: Rejects all real charge attempts.
2. `PORTAL18_EMAIL_KILL_SWITCH = true`: Rejects all external transactional dispatches.
3. Age Assurance Gate: Remains fail-closed on unverified sessions.
