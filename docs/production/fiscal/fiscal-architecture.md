# Portal18 — Fiscal Architecture, Lifecycle & NFS-e Governance

> [!IMPORTANT]
> **FAIL-CLOSED KILL SWITCH | SOURCE OF TRUTH SEPARATION | ZERO FAKE ISSUANCE**

---

## 1. Domain Separation of Truth

| Domain | Source of Truth | Key Entities | Output State |
|---|---|---|---|
| **Commercial** | `orders`, `order_items` | Orders, minor cent pricing, snapshot | `order.status = 'fulfilled'` |
| **Payment** | `payments`, `payment_attempts` | Transaction IDs, authorization codes | `payment.status = 'paid'` |
| **Financial Ledger** | `payment_settlements`, `financial_periods` | Double-entry ledger, fees, net settlements | `period.status = 'closed'` |
| **Fiscal** | `fiscal_documents`, `fiscal_events` | NFS-e verification codes, municipal numbers | `fiscal_event.status = 'issued'` |
| **Accounting** | Exported CSV ledger representation | Revenue recognition, tax classifications | Accounting Ledger Export |

*Rule:* `payment.status = 'paid'` **does not** automatically mean `fiscal.status = 'issued'` without certified municipal transmission.

---

## 2. Fiscal Event Lifecycle

```
[Commercial Order Fulfilled]
             │
             ▼
[Fiscal Eligibility Evaluation] ──► Disabled by Policy (PORTAL18_FISCAL_KILL_SWITCH = true)
             │
             ▼ (Post-Activation)
[Fiscal Queue & Idempotent Claim Lock]
             │
             ▼
[FiscalProvider.issue(request)]
             ├── Validates Digital Certificate & Municipal Code
             ├── Transmits to Certified Fiscal Provider / Prefeitura
             └── Records Authorized NFS-e (verification_code, municipal_number)
```
