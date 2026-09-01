# PORTAL18 — MULTI-GATEWAY PAYMENT PROVIDER EVALUATION & HOMOLOGATION DOSSIER

> **Document Classification**: Restricted / Financial Architecture & Compliance
> **Platform**: Portal18 (Classificados Adultos & Conteúdo Digital 18+)
> **Status**: Evaluation & Homologation Foundation (Phase 28A)
> **Active Rule**: `PORTAL18_PAYMENT_KILL_SWITCH=true` (Zero real charges, zero card collection)

---

## 1. Executive Summary & Architectural Invariants

Portal18 operates as a high-trust, age-assured (ECA Digital / 18+) national marketplace platform for independent advertisers and verified consumer members.

### Core Architectural Invariants:
1. **Decoupled Commercial Domain**: Portal18’s business entities (`subscriptions`, `orders`, `consumer_subscriptions`, `boosts`, `entitlements`) are strictly decoupled from external Payment Service Providers (PSPs). No PSP is the source of truth for platform entitlements.
2. **Tripartite Homologation Gate**: A gateway can only transition to production when it receives simultaneous approval across three independent dimensions:
   - `Technical Status = APPROVED` (API contracts, webhook signatures, idempotency, 3DS/Tokenization)
   - `Commercial Status = APPROVED` (Contract executed, pricing versioned, underwriting confirmed)
   - `Compliance Status = APPROVED` (Explicit disclosure and formal written approval of adult advertising business model)
3. **No Automatic Multi-Gateway Retries**: To prevent double-charging the customer, timeout errors never trigger automatic sequential charges across different PSPs without prior state confirmation.
4. **Authoritative Server-Side Pricing**: The client browser sends only product parameters (`planId`, `billingPeriod`, `productType`). Total amounts, discounts, and currency are 100% computed server-side.

---

## 2. PSP Comparative Evaluation & Capability Matrix

| Feature / Capability | Unconfigured (Mock) | Mercado Pago | PagBank (PagSeguro) | Pagar.me (StoneCo) | Asaas | Adyen | Stripe |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Technical Status** | APPROVED | Under Review | Under Review | Under Review | Under Review | Under Review | **REJECTED** |
| **Commercial Status** | APPROVED | Candidate | Candidate | Candidate | Candidate | Candidate | **REJECTED** |
| **Compliance Status** | APPROVED | Candidate | Candidate | Candidate | Candidate | Candidate | **REJECTED** |
| **Adult Model Approval** | **APPROVED (SAFE)** | **REQUIRES FORMAL APPROVAL** | **REQUIRES FORMAL APPROVAL** | **REQUIRES FORMAL APPROVAL** | **REQUIRES FORMAL APPROVAL** | **REQUIRES FORMAL APPROVAL** | **PROHIBITED** |
| **PIX Instantâneo** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **PIX Copia & Cola / QR** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Cartão de Crédito** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Tokenização / Transparent** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Recorrência (Cartão)** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Recorrência (PIX Automático)** | Supported | Unknown | Unknown | Unknown | Supported | Unknown | Unsupported |
| **Split de Pagamento** | Unsupported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Antifraude Nativo** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **3D Secure (3DS 2.0)** | Supported | Supported | Supported | Supported | Unknown | Supported | Supported |
| **Webhook Signature HMAC** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Conciliação Automatizada** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Ambiente Sandbox** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |

---

## 3. Detailed Provider Profiles

### A. Mercado Pago (Mercado Livre Group)
- **Overview**: Leading PSP in Brazil and Latin America. Excellent native PIX integration, robust hosted/transparent checkouts, and high consumer familiarity.
- **Technical Fit**: **HIGH**. APIs are well-documented (v1/v2), webhooks support HMAC SHA256 signatures, and SDKs are mature.
- **Commercial & Compliance Status**: **REQUIRES FORMAL APPROVAL**. Mercado Pago requires explicit MCC mapping (MCC 7273 / 5967) and formal risk review for adult classifieds advertising platforms.
- **Recommendation**: Priority 1 candidate for Brazilian PIX and transparent card processing once commercial underwriting is granted.

### B. PagBank (PagSeguro UOL)
- **Overview**: Long-standing Brazilian acquiring platform with deep consumer brand trust and wide coverage of credit cards and PIX.
- **Technical Fit**: **HIGH**. Complete REST API v4, robust webhook notifications, and PCI-compliant transparent tokenization.
- **Commercial & Compliance Status**: **REQUIRES FORMAL APPROVAL**. Commercial terms must explicitly encompass digital media advertising platforms for verified adults.
- **Recommendation**: Priority 2 candidate for fallback and card processing.

### C. Pagar.me (StoneCo)
- **Overview**: Developer-first payment gateway by StoneCo, specialized in high conversion, custom split rules, and customized risk routing.
- **Technical Fit**: **VERY HIGH**. Excellent developer experience, transparent checkout components, and customizable webhook retries.
- **Commercial & Compliance Status**: **REQUIRES FORMAL APPROVAL**. StoneCo merchant underwriting requires company registration dossier and age assurance process audit.
- **Recommendation**: Priority 3 candidate, ideal for flexible recurring card subscriptions.

### D. Asaas
- **Overview**: Brazilian financial automation platform with comprehensive billing engines, automated PIX recurring schedules, and automated notification messaging.
- **Technical Fit**: **MEDIUM/HIGH**. Strong subscription features and PIX automation; card 3DS requires specific verification.
- **Commercial & Compliance Status**: **REQUIRES FORMAL APPROVAL**. Terms of Service require formal addendum for adult advertising marketplace operations.
- **Recommendation**: Priority 4 candidate for subscription automation.

### E. Adyen
- **Overview**: Global tier-1 omni-channel acquiring platform with multi-acquirer redundancy and sophisticated RevenueAccelerate antifraud.
- **Technical Fit**: **VERY HIGH**. Enterprise-grade reliability and global scale.
- **Commercial & Compliance Status**: **REQUIRES FORMAL APPROVAL**. High volume processing thresholds ($500k+/month minimum) and international adult content risk committee review.
- **Recommendation**: Long-term enterprise candidate once processing volumes warrant direct tier-1 acquiring.

### F. Stripe (Strictly Unsupported / Prohibited)
- **Overview**: Global developer platform.
- **Compliance Policy**: **PROHIBITED**. Section *Restricted Businesses* of Stripe Services Agreement strictly and unconditionally prohibits:
  - *Adult content and services, including pornography and other sexually explicit materials (including literature, imagery and other media); sites offering any sexually-related services.*
- **Decision**: **PERMANENTLY REJECTED & PROHIBITED**. The Stripe adapter is registered with status `rejected` and cannot be enabled in any environment.

---

## 4. Homologation Lifecycle & Production Readiness Runbook

```
┌───────────┐     ┌──────────────────┐     ┌───────────────────┐
│ Candidate │ ──> │ Technical Review │ ──> │ Commercial Review │
└───────────┘     └──────────────────┘     └───────────────────┘
                            │                         │
                            ▼                         ▼
                  ┌───────────────────┐     ┌───────────────────┐
                  │ Compliance Review │ ──> │   Sandbox Ready   │
                  └───────────────────┘     └───────────────────┘
                                                      │
                                                      ▼
                  ┌───────────────────┐     ┌───────────────────┐
                  │     APPROVED      │ <── │   Homologating    │
                  └───────────────────┘     └───────────────────┘
```

### 14-Point Homologation Checklist:
1. [ ] **Business Model Disclosed**: Formal notification of adult advertising directory nature.
2. [ ] **Age Assurance Integration Disclosed**: Verification of Age Assurance & ECA Digital compliance.
3. [ ] **Advertiser Subscriptions Disclosed**: Plans (Essencial, Destaque, Premium, VIP) across 7, 30, and 90-day cycles.
4. [ ] **Consumer Premium Disclosed**: Independent consumer membership subscription products.
5. [ ] **Premium Media Products Disclosed**: Commercial media, video, and audio promotion features.
6. [ ] **Promotional Boost Products Disclosed**: Instant 24h/3d boost and placement campaigns.
7. [ ] **Dynamic PIX Certified**: Successful QR Code generation, Copy/Paste string validation, and expiration handling.
8. [ ] **Card Tokenization Certified**: Zero PAN/CVV storage on Portal18 servers; 100% tokenized sessions.
9. [ ] **Recurring Subscriptions Certified**: Automated cycle renewal and grace period handling.
10. [ ] **Refund Policy & Partial Refunds Certified**: Server-side programmatic refund validation.
11. [ ] **Chargeback Webhooks & Dispute Handling Certified**: Replay-protected dispute notifications.
12. [ ] **HMAC Webhook Signatures Certified**: Cryptographic signature validation with timing-safe comparison.
13. [ ] **Sandbox Test Suite Executed**: All integration test cases passing with zero mock revenue leakage.
14. [ ] **Formal Written Approval Received**: Signed commercial contract with explicit MCC underwriting.

---

## 5. Security & Risk Governance

- **Zero Client Trust**: Total amounts, item units, and discounts are determined entirely on the backend.
- **Idempotency Guard**: Every financial request carries a unique `idempotency_key` bound to `order_id` and `provider_code`.
- **Sanitized Logging**: Telemetry and audit logs strictly redact credit card numbers, CVVs, webhook secrets, and private tokens.
- **Kill Switch Enforcement**: The platform defaults to `PORTAL18_PAYMENT_KILL_SWITCH=true`. Payment endpoints reject live charging until explicitly authorized by executive command.
