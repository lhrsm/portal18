# Portal18 — Phase 37 Production Operations Manifest

> [!IMPORTANT]
> **OPERATIONAL INVENTORY | OBSERVABILITY | RUNBOOKS**

---

## 1. Environment Topology

- **Local / Dev**: Local Next.js dev server with mocked external services and active kill switches.
- **Staging / Homologation**: Supabase hosted staging database, simulated test drivers, full RLS enforcement.
- **Production**: **PRODUCTION ENVIRONMENT NOT PROVISIONED** (Awaiting external blockers resolution).

---

## 2. Operational Endpoints & End-to-End Monitoring

- **Health Endpoint**: `/api/health` (Returns JSON uptime and basic status with `no-store` cache).
- **Readiness Endpoint**: `/api/ready` (Returns database connectivity and policy-disabled states for payment/email).
- **Security Headers**: HSTS, CSP, X-Content-Type-Options (nosniff), X-Frame-Options (SAMEORIGIN), Referrer-Policy.
- **Private Cache Control**: Enforced `no-store, max-age=0, must-revalidate` for `/account/*`, `/advertiser/*`, `/admin/*`, and `/api/*`.
