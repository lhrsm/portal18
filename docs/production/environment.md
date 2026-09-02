# Portal18 — Production Environment Architecture & Isolation Topology

> [!IMPORTANT]
> **PRODUCTION ENVIRONMENT: PROVISIONED (ISOLATED) | TRAFFIC: DISABLED | KILL SWITCHES: ACTIVE**

---

## 1. Environment Separation Architecture

The Portal18 infrastructure enforces strict separation between environments across all layers:

```
[STAGING / HOMOLOGATION]
  ├── Database: Supabase Staging Instance (Isolated Project)
  ├── Storage: Staging S3 / Supabase Storage Buckets
  ├── Identity: Staging Auth Schema & Users
  ├── Payments: Internal Test Driver (Mocked / Simulated Settlement)
  └── Dispatches: Mock Email Driver (Simulated Deliveries)

[PRODUCTION (GATED)]
  ├── Database: Dedicated Supabase Production Project (Clean 39/39 Migrations)
  ├── Storage: Dedicated Production Storage Buckets
  ├── Identity: Clean Production Auth Schema (Zero Synthetic Test Personas)
  ├── Payments: BLOCKED BY KILL SWITCH (PORTAL18_PAYMENT_KILL_SWITCH = true)
  └── Dispatches: BLOCKED BY KILL SWITCH (PORTAL18_EMAIL_KILL_SWITCH = true)
```

---

## 2. Zero Shared Secrets & Resources Matrix

| Resource Layer | Staging Environment | Production Environment | Shared Elements |
|---|---|---|---|
| **Database Instance** | `db.staging.portal18` | `db.production.portal18` | **0 Shared Data** |
| **Service Role Key** | `stg_service_role_...` | `prod_service_role_...` | **0 Shared Keys** |
| **JWT Signing Salt** | `stg_jwt_secret_...` | `prod_jwt_secret_...` | **0 Shared Salts** |
| **Storage Buckets** | `stg-media`, `stg-kyc` | `prod-media`, `prod-kyc` | **0 Shared Files** |
| **Webhook Secrets** | `stg_whsec_...` | `prod_whsec_...` | **0 Shared Secrets** |
| **VAPID Keys** | Staging Keypair | Production Keypair | **0 Shared Keys** |

---

## 3. Empty Production Invariant

The production database is bootstrapped strictly with:
- Schema definitions (Migrations `000001` through `000038`).
- Static system taxonomy (States, Cities, Categories).
- Core system roles and permissions.

**STRICTLY PROHIBITED IN PRODUCTION**:
- `E2E_*` test users.
- Demo or synthetic advertiser profiles.
- Mock order records or test payments.
- Simulated reviews or fake analytics events.
