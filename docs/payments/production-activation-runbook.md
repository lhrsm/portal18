# PORTAL18 — PRODUCTION PAYMENT ACTIVATION RUNBOOK

> **Document Classification**: Restricted / Executive Operational Runbook
> **Platform**: Portal18
> **Pre-Condition**: All tripartite gates must be cleared before following this runbook.

---

## 1. 10-Point Pre-Activation Verification Checklist

1. [ ] **Sandbox Certification**: Target provider holds `technical_status = 'SANDBOX_PASSED'`.
2. [ ] **Commercial Contract**: Formal signed agreement executed with the PSP.
3. [ ] **Adult Model Underwriting**: Written confirmation of underwriting approval for adult classifieds marketplace operations.
4. [ ] **Production Credentials**: Securely injected into the production environment (e.g. Vercel/Vault) with zero frontend visibility.
5. [ ] **Webhook Endpoints & HMAC Keys**: Webhook URLs registered in the PSP portal with live signature keys verified.
6. [ ] **Pricing Verification**: Server-side plan pricing audited against current commercial catalog.
7. [ ] **Reconciliation Jobs**: Automated cron reconciling `payment_reconciliation_logs` scheduled.
8. [ ] **Idempotency Guard**: Database constraints and Redis locks tested under concurrent load.
9. [ ] **Staff Training**: Support and Moderation teams briefed on chargeback and refund escalation workflows.
10. [ ] **Executive Sign-Off**: Joint sign-off by Principal Payments Architect, Compliance Officer, and General Counsel.

---

## 2. Kill Switch Deactivation Protocol

1. Update environment variable in production vault:
   ```env
   PORTAL18_PAYMENT_KILL_SWITCH=false
   PAYMENTS_ENVIRONMENT=production
   PAYMENT_PROVIDER=mercadopago  # or chosen primary approved gateway
   ```
2. Trigger canary deploy.
3. Execute micro-transaction (R$ 1,00) with internal test account.
4. Verify webhook arrival, entitlement activation, and immediate programmatic refund.
5. Monitor error rate telemetry for 60 minutes before opening to public users.
