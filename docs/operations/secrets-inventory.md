# Portal18 — Production Secrets Inventory & Governance

> [!IMPORTANT]
> **STRICT ZERO-PLAINTEXT POLICY**: This inventory documents metadata, ownership, rotation policies, and revocation procedures. **NEVER COMMIT RAW SECRET VALUES.**

---

## 1. Secrets Inventory Matrix

| Secret Identifier | Purpose | Environment | Owner | Rotation Cycle | Emergency Revocation Procedure |
|---|---|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-authoritative backend RPC and administration access | Staging / Prod | Platform Lead | 90 Days | Generate new key via Supabase dashboard, deploy updated env, revoke old key |
| `SUPABASE_ANON_KEY` | Public client database read/write under RLS policies | All | Platform Lead | 180 Days | Regenerate in Supabase console and rebuild application bundles |
| `PAYMENT_WEBHOOK_SECRET` | Validates HMAC-SHA256 signature on payment callbacks | Staging / Prod | FinOps Lead | 90 Days | Update secret in gateway dashboard, synchronize backend config |
| `AGE_VERIFICATION_SECRET` | HMAC signature for visitor Age Assurance sessions | Staging / Prod | Security Lead | 90 Days | Rotate signing salt; invalidates active temporary age sessions gracefully |
| `VAPID_PRIVATE_KEY` | Web Push notification payload signing | Staging / Prod | SRE Lead | 180 Days | Regenerate VAPID key pair via web-push tooling |
| `INTERNAL_API_SIGNING_KEY` | Inter-service request authentication | Staging / Prod | Platform Lead | 90 Days | Zero-downtime dual-key rotation |

---

## 2. Environment Variable Schema Classification

- **PUBLIC (`NEXT_PUBLIC_*`)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
- **SERVER ONLY / SECRET**: `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENT_WEBHOOK_SECRET`, `AGE_VERIFICATION_SECRET`.
- **TEST / POLICY GUARDS**: `PORTAL18_PAYMENT_KILL_SWITCH`, `PORTAL18_EMAIL_KILL_SWITCH`.
