# Portal18 — Payment Security, Tokenization & Price Authority Policy

> [!IMPORTANT]
> **ZERO PAN/CVV STORAGE | SERVER-AUTHORITATIVE PRICING | WEBHOOK SIGNATURE INTEGRITY**

---

## 1. Zero Cardholder Data Retention (PCI Scope Minimization)

Portal18 adheres to strict client-side hosted tokenization:
- **No PAN (Primary Account Number) Ingestion**: Raw card numbers are tokenized directly via provider SDKs/iframes.
- **No CVV Storage**: Card security codes are never transmitted to or persisted in Portal18 backend infrastructure.
- **Token Storage**: Only opaque provider payment method tokens (`pm_...`) and masked last 4 digits (`**** 1234`) are retained for recurring billing.

---

## 2. Server-Authoritative Price Enforcement

- **Immutable Order Snapshot**: Price and itemization are computed exclusively on the backend and locked into an immutable JSON snapshot upon order creation.
- **Client Price Tampering Immunity**: Any client request submitting altered minor integer cent amounts is rejected by server validation.
- **Provider Amount Alignment**: The amount sent to the PSP matches the backend order record down to the single integer cent.
