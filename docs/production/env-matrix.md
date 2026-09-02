# Portal18 — Production Environment Variables Matrix

> [!IMPORTANT]
> **STRICT ZERO-PLAINTEXT POLICY**: This document defines variable requirements, classifications, and safety guards. **NO RAW SECRET VALUES PERMITTED.**

---

## 1. Environment Variables Schema

| Variable Name | Classification | Scope | Staging Value | Production Value Requirement | Safety Invariant |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Required | Client + Server | Staging Supabase URL | Dedicated Production Supabase URL | Must not point to staging or localhost |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Required | Client + Server | Staging Anon Key | Dedicated Production Anon Key | Must be distinct from staging key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / Required | Server Only | Staging Service Role | Dedicated Production Service Role | Never exposed to client bundle |
| `NEXT_PUBLIC_SITE_URL` | Public / Required | Client + Server | Staging URL | Canonical Production Origin | Canonical URL for metadata & callbacks |
| `PORTAL18_PAYMENT_KILL_SWITCH` | Policy / Required | Server Only | `true` | `true` (Mandatory) | Prevents real financial charges |
| `PORTAL18_EMAIL_KILL_SWITCH` | Policy / Required | Server Only | `true` | `true` (Mandatory) | Prevents unverified email sending |
| `AGE_VERIFICATION_SECRET` | Secret / Required | Server Only | Staging Salt | Production Salt | HMAC signature for age sessions |
| `PAYMENT_PROVIDER_WEBHOOK_SECRET` | Secret / Required | Server Only | Staging Webhook Secret | Production Webhook Secret | Validates inbound webhook signatures |

---

## 2. Production Startup Safety Gates

The application refuses to boot in production if:
1. `PORTAL18_PAYMENT_KILL_SWITCH` is set to `false` prior to executive commercial authorization.
2. `NEXT_PUBLIC_SUPABASE_URL` contains staging, preview, or localhost hosts.
3. `SUPABASE_SERVICE_ROLE_KEY` matches known staging or development keys.
4. Any `NEXT_PUBLIC_*` variable contains strings matching `SECRET`, `PRIVATE_KEY`, or `SERVICE_ROLE`.
