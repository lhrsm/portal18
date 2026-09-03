# Portal18 — Email Sender Domain & DNS Configuration Runbook

> [!IMPORTANT]
> **SENDER DOMAIN STATUS: SENDER_DOMAIN_PENDING | GRADUAL DMARC ROLLOUT**

---

## 1. Domain Architecture Recommendation

To protect primary domain reputation, transactional email should be dispatched via a dedicated subdomain:
- **Canonical App Domain**: `<canonical-domain>`
- **Transactional Sender Subdomain**: `notify.<canonical-domain>`
- **From Address**: `Portal18 <notificacoes@notify.<canonical-domain>>`
- **Reply-To Address**: `suporte@<canonical-domain>`

---

## 2. DNS Records Matrix (Target Subdomain)

| Record Type | Host | Target / Value | Purpose |
|---|---|---|---|
| `TXT` | `notify.<canonical-domain>` | `v=spf1 include:<provider-spf> ~all` | Sender Policy Framework (SPF) |
| `CNAME` | `resend1._domainkey.notify` | `<provider-dkim-1>` | DKIM Key 1 |
| `CNAME` | `resend2._domainkey.notify` | `<provider-dkim-2>` | DKIM Key 2 |
| `TXT` | `_dmarc.notify.<canonical-domain>` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@<canonical-domain>` | DMARC Monitoring (Phase 1) |

---

## 3. DMARC Enforcement Phasing

1. **Phase 1 (Monitoring)**: `p=none; sp=none; rua=mailto:...` (Analyze aggregate reports for 14-30 days).
2. **Phase 2 (Quarantine)**: `p=quarantine; pct=25` (Incrementally route unaligned mail to spam folder).
3. **Phase 3 (Enforcement)**: `p=reject; pct=100` (Reject all spoofed or unaligned dispatches).
