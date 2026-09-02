# Portal18 — Domain Readiness & DNS Configuration Runbook

> [!IMPORTANT]
> **CANONICAL DOMAIN STATUS: DOMAIN_PENDING | ZERO UNAUTHORIZED DNS MUTATIONS**

---

## 1. Domain Configuration Status

- **Status**: `DOMAIN_PENDING` (Pending corporate DNS registration and final domain assignment).
- **Canonical Origin**: Configured via `NEXT_PUBLIC_SITE_URL` once domain is provisioned.
- **Traffic State**: `TRAFFIC_DISABLED` (Edge routing gates public requests prior to launch).

---

## 2. Required DNS Records (Target Production Architecture)

| Record Type | Host | Target / Value | Purpose |
|---|---|---|---|
| `A` / `CNAME` | `@` | Hosting Edge IP / Canonical CNAME | Apex domain routing |
| `CNAME` | `www` | Apex Domain / Hosting CNAME | WWW subdomain redirect |
| `TXT` | `@` | `v=spf1 include:... ~all` | SPF Email Authentication (Future) |
| `TXT` | `_dmarc` | `v=DMARC1; p=reject; ...` | DMARC Policy (Future) |
| `CNAME` | `*._domainkey` | DKIM Provider Host | DKIM Email Signature (Future) |

---

## 3. Auth Redirect URL Whitelist

Upon domain confirmation, the Supabase Auth configuration must allow strictly:
- `https://<canonical-domain>/auth/callback`
- `https://<canonical-domain>/age-verification/callback`
- `https://<canonical-domain>/advertiser/verification/return`

**PROHIBITED**: Wildcard redirects (`https://*`) or open redirect patterns.
