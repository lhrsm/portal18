# PORTAL18 — PAYMENT INCIDENT & EMERGENCY MITIGATION RUNBOOK

> **Document Classification**: Emergency Operational Runbook (P0/P1)
> **Platform**: Portal18

---

## 1. Instant Kill Switch Activation (Global Emergency)

If unexpected double-charges, security breaches, or rogue webhook spikes are detected:

```bash
# 1. Immediately set the global kill switch in production environment
PORTAL18_PAYMENT_KILL_SWITCH=true

# 2. Redeploy or restart edge instances
```
When active, all checkout endpoints immediately divert to safe mock mode, completely stopping external charges.

---

## 2. PSP Outage or Degradation

1. **Detection**: Health check alert triggers when provider latency exceeds 2000ms or 5xx rate > 5%.
2. **Mitigation**:
   - Do NOT execute automatic cross-provider retries on pending/timeout transactions.
   - Flag transactions as `UNKNOWN / REQUIRES_RECONCILIATION`.
   - Reroute new checkouts via `PaymentProviderResolver` to secondary approved provider if one exists.
   - If no secondary approved provider exists, display user-friendly maintenance banner: *"Processamento temporariamente indisponível. Nenhuma cobrança foi realizada."*

---

## 3. Disputed Charges & Fraud Surge

1. Any incoming chargeback webhook immediately registers in `payment_chargebacks`.
2. Associated advertiser/consumer account is flagged for review without destructive immediate deletion of data.
3. Chargeback evidence package is generated and reviewed by the Admin Finance team.
