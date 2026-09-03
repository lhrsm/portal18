# Portal18 — Sandbox Certification Protocol & Test Harness

> [!IMPORTANT]
> **SANDBOX VALIDATION GATES | SYNTHETIC TEST CARDS | WEBHOOK REPLAY DRILLS**

---

## 1. Sandbox Certification Checklist

Before any candidate provider is considered for production approval, it must pass the following 12 certification tests in an isolated sandbox environment:

1. [ ] **Account Provisioning**: Dedicated sandbox merchant account established.
2. [ ] **Sandbox Credentials Injected**: Test public/secret keys injected into staging environment.
3. [ ] **Dynamic PIX Generation**: Valid simulated PIX QR and copy-paste string generated.
4. [ ] **PIX Payment Simulation**: Simulated PIX settlement confirmed via webhook callback.
5. [ ] **PIX Expiration Handling**: Unpaid PIX expired gracefully after TTL.
6. [ ] **Credit Card Tokenization**: Client-side hosted tokenization completed without raw PAN.
7. [ ] **3DS 2.0 Challenge**: Successful authentication and liability shift simulated.
8. [ ] **Full & Partial Refund**: Simulated refund processed and recorded in ledger.
9. [ ] **Webhook Signature Verification**: Cryptographic HMAC signature validated.
10. [ ] **Webhook Replay Protection**: Duplicate test webhook discarded idempotently.
11. [ ] **Out-of-Order Webhook Protection**: Delayed pending webhook does not overwrite paid state.
12. [ ] **Reconciliation Query**: `getPaymentStatus()` returns consistent state.
