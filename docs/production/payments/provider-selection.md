# Portal18 — PSP Provider Candidate Selection & Underwriting Matrix

> [!IMPORTANT]
> **MULTI-DIMENSIONAL EVALUATION | ZERO BLIND FAILOVER | STRICT SOURCE OF TRUTH**

---

## 1. Provider Candidate Evaluation Matrix

| Provider | Brazil Support | PIX | Card | Recurring Card | 3DS | Tokenization | Commercial Status | Compliance Status | Adult Business Status | Production Eligibility |
|---|---|---|---|---|---|---|---|---|---|---|
| **Mercado Pago** | Yes | Yes | Yes | Yes | Yes | Yes | Under Review | Under Review | **REQUIRES_EXTERNAL_CONFIRMATION** | Ineligible (Pending Underwriting) |
| **PagBank** | Yes | Yes | Yes | Yes | Yes | Yes | Under Review | Under Review | **REQUIRES_EXTERNAL_CONFIRMATION** | Ineligible (Pending Underwriting) |
| **Pagar.me** | Yes | Yes | Yes | Yes | Yes | Yes | Under Review | Under Review | **REQUIRES_EXTERNAL_CONFIRMATION** | Ineligible (Pending Underwriting) |
| **Asaas** | Yes | Yes | Yes | Yes | Partial | Yes | Under Review | Under Review | **REQUIRES_EXTERNAL_CONFIRMATION** | Ineligible (Pending Underwriting) |
| **Adyen** | Yes | Yes | Yes | Yes | Yes | Yes | Under Review | Under Review | **REQUIRES_EXTERNAL_CONFIRMATION** | Ineligible (Pending Underwriting) |
| **Stripe** | Yes | Yes | Yes | Yes | Yes | Yes | **REJECTED** | **REJECTED** | **PROHIBITED (Adult Advertising)** | **PERMANENTLY BLOCKED** |

---

## 2. Multi-Dimensional Source of Truth

A provider candidate transitions to `production_eligible` **only** when all dimensions are independently approved:
1. **Technical Capability**: Verified in Sandbox certification.
2. **Commercial Approval**: Commercial agreement executed.
3. **Compliance Approval**: KYC, AML, and chargeback policies accepted.
4. **Adult Business Acceptance**: Formal underwriting approval for adult classifieds advertising.
5. **Product Approvals**: Granular approval for `advertiser_subscription`, `consumer_subscription`, and `boost`.
6. **Method Approvals**: Specific approval for `pix`, `credit_card`, and `recurring_card`.
