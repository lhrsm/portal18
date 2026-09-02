# Portal18 — Secret Rotation & Emergency Revocation Runbook

> [!IMPORTANT]
> **ZERO DOWNTIME ROTATION | AUDITED PROCEDURES | LEAST PRIVILEGE**

---

## 1. Supabase Service Role Key Rotation

1. **Pre-requisite**: Confirm access to Supabase Project Settings > API.
2. **Step 1**: Generate replacement `SERVICE_ROLE_KEY`.
3. **Step 2**: Update staging / production environment variables in hosting provider.
4. **Step 3**: Trigger deployment and verify `/api/health` and `/api/ready`.
5. **Step 4**: Revoke old key in Supabase console.

---

## 2. Webhook Signing Secret Rotation

1. **Step 1**: Register secondary webhook secret in payment / KYC provider portal if dual-secret mode is supported.
2. **Step 2**: Update `PAYMENT_WEBHOOK_SECRET` on server.
3. **Step 3**: Validate inbound test webhook signature.
4. **Step 4**: Deprecate old secret on provider portal.

---

## 3. Emergency Secret Compromise Procedure

If a secret is inadvertently leaked or exposed:
1. **Declare SEV-0 Incident**: Notify Platform and Security Leads.
2. **Immediate Revocation**: Revoke key at provider console immediately.
3. **Emergency Redeployment**: Inject rotated credentials and redeploy.
4. **Audit Log Inspection**: Review `public.audit_logs` for unauthorized actions during exposure window.
