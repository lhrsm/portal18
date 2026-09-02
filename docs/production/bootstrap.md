# Portal18 — Production Database Bootstrap & Initial Admin Runbook

> [!IMPORTANT]
> **CLEAN INITIALIZATION | 39/39 MIGRATIONS | ZERO SEED FIXTURES | SECURE SUPER ADMIN**

---

## 1. Schema Migration Bootstrap

The production database is initialized by applying the 39 official repository migrations in sequence:
1. `20260826000001_initial_schema.sql` through `20260902000038_phase35_advertiser_conversion_intelligence.sql`.
2. Confirm 100% schema alignment with zero schema divergence.
3. Validate Row Level Security (RLS) enforcement across all tables.

---

## 2. Super Admin Initial Account Bootstrap

To provision the first Super Administrator securely without committing passwords to Git:
1. **User Creation via Supabase Console**:
   - Create auth user using corporate administrator email via Supabase Dashboard Auth interface.
2. **Role Assignment via Server-Authoritative SQL**:
   ```sql
   -- Execute in secure Supabase SQL Editor:
   INSERT INTO public.user_roles (profile_id, role)
   SELECT id, 'admin'
   FROM public.profiles
   WHERE email = '<corporate-admin-email>'
   ON CONFLICT (profile_id, role) DO NOTHING;
   ```
3. **MFA Enforcement**:
   - Super Admin must immediately activate Time-based One-Time Password (TOTP) MFA upon initial login.
