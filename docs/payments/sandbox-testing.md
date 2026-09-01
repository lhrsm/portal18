# PORTAL18 — SANDBOX TESTING & INTEGRATION HARNESS RUNBOOK

> **Document Classification**: Engineering Operations
> **Platform**: Portal18

---

## 1. Sandbox Testing Principles

1. **Strict Realism Without Fakes**: Tests only run against real PSP sandboxes when explicit environment variables (`MERCADOPAGO_SANDBOX_*`, `PAGBANK_SANDBOX_*`, etc.) are configured.
2. **Safe Mock Driver**: In absence of external credentials, the `Internal Test Driver` (`unconfigured`) handles local end-to-end simulation safely.
3. **Zero Financial Leakage**: No real money or real credit card PANs are ever used in sandbox testing.

---

## 2. Test Execution & Verification

### Running Automated Homologation Suites
```bash
# Run deterministic architecture & sandbox homologation verification
npx tsx scripts/verify-phase28b-sandbox-homologation.ts
```

### Testing Via Admin UI
1. Navigate to `/admin/payments/providers`.
2. Click **"Homologação & Testes"** on any provider card.
3. Select the **"Testes Sandbox"** tab.
4. Click **"Executar Testes"** to run the live test suite against the configured PSP endpoint.
