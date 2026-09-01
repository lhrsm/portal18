# PORTAL18 — RUNBOOK: PAYMENT PROVIDER ACTIVATION & GATEWAY GOVERNANCE

## 1. Overview
This document specifies the strict operational procedure required to activate a commercial payment gateway on Portal18.
Until this procedure is formally executed in a certified launch window, **PAYMENTS REMAIN DISABLED** via the active Kill Switch.

---

## 2. Invariants & Pre-requisites
1. **Zero Mock Charges**: No simulated charges or mock credit card transactions in production.
2. **Age Assurance Primacy**: Subscriptions or payments NEVER grant an exemption from Age Assurance (ECA Digital).
3. **Idempotency**: All webhook handlers must guarantee idempotency (`checkout_session_id` or `payment_intent_id` deduplication).
4. **Kill Switch Authority**: Only `super_admin` with approved release tag may toggle the payment kill switch.

---

## 3. Activation Runbook Steps

### Step 1: Gateway Provider Selection & Sandbox Setup
- Choose PCI-DSS Level 1 compliant gateway provider (e.g. Asaas, Pagar.me, Stripe Brasil, Mercado Pago).
- Obtain sandbox API credentials (Public Key, Secret Key, Webhook Secret).
- Ensure provider supports Pix (instant settlement BRL) and Credit Card (tokenized with 3D Secure 2.0).

### Step 2: Environment Configuration
Configure secure environment variables:
```bash
NEXT_PUBLIC_PAYMENT_PROVIDER="<provider_name>"
PAYMENT_SECRET_KEY="<provider_secret_key>"
PAYMENT_WEBHOOK_SIGNING_SECRET="<webhook_signing_secret>"
PORTAL18_PAYMENT_KILL_SWITCH="false" # Only toggle in Step 5
```

### Step 3: Webhook Verification Smoke Test
- Send signed test webhook event (`charge.success`, `subscription.renewed`, `refund.processed`).
- Verify signature validation in `/api/webhooks/payments`.
- Verify database state updates in `public.subscriptions` and `public.payment_transactions`.
- Verify duplicate payload rejection (idempotency test).

### Step 4: End-to-End Production Checkout Smoke Test
- Execute a single real R$ 1,00 test transaction on live environment.
- Confirm subscription lifecycle transitions (`active`, `current_period_end` calculated accurately).
- Immediately issue an administrative refund (`refunded` status verified in ledger).

### Step 5: Formal Commercial Launch & Monitoring
- Disable kill switch (`PORTAL18_PAYMENT_KILL_SWITCH="false"`).
- Monitor webhook delivery rates and error logs in `/admin/commercial`.
- If error rate exceeds 1% within 1 hour: trigger Rollback & Kill Switch re-activation immediately.

---

## 4. Rollback & Emergency Kill Switch Procedure
If unexpected billing behavior occurs:
1. Set `PORTAL18_PAYMENT_KILL_SWITCH="true"` in production environment.
2. All checkout CTA buttons will immediately fallback to `"Assinaturas em fase de homologação controlada"`.
3. Webhook endpoint switches to fail-safe ingestion logging without automated mutation.
