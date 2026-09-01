# PORTAL18 — MULTI-GATEWAY PAYMENT PROVIDER EVALUATION & HOMOLOGATION DOSSIER

> **Document Classification**: Restricted / Financial Architecture & Compliance
> **Platform**: Portal18 (Classificados Adultos & Conteúdo Digital 18+)
> **Current Version**: Phase 28C
> **Active Rule**: `PORTAL18_PAYMENT_KILL_SWITCH=true` (Zero real charges, zero card collection)

---

## 1. Executive Summary & Architectural Invariants

Portal18 operates as a high-trust, age-assured (ECA Digital / 18+) national marketplace platform for independent advertisers and verified consumer members.

### Core Architectural Invariants:
1. **Decoupled Commercial Domain**: Portal18’s business entities (`subscriptions`, `orders`, `consumer_subscriptions`, `boosts`, `entitlements`) are strictly decoupled from external Payment Service Providers (PSPs). No PSP is the source of truth for platform entitlements.
2. **Tripartite Homologation Gate & Granular Scope**: A gateway can only transition to production when it receives simultaneous approval across three independent dimensions (Technical, Commercial, Compliance 18+) **AND** explicit product/method clearance (e.g. PIX for advertiser subscriptions vs Card for consumer memberships).
3. **No Automatic Multi-Gateway Retries**: To prevent double-charging the customer, timeout errors never trigger automatic sequential charges across different PSPs without prior state confirmation.
4. **Authoritative Server-Side Pricing**: The client browser sends only product parameters (`planId`, `billingPeriod`, `productType`). Total amounts, discounts, and currency are 100% computed server-side.

---

## 2. PSP Comparative Evaluation & Capability Matrix

| Feature / Capability | Internal Test Driver (Mock) | Mercado Pago | PagBank (PagSeguro) | Pagar.me (StoneCo) | Asaas | Adyen | Stripe |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Technical Status** | SANDBOX_PASSED | NOT_CONFIGURED | NOT_CONFIGURED | NOT_CONFIGURED | NOT_CONFIGURED | NOT_CONFIGURED | **PRODUCTION_BLOCKED** |
| **Commercial Status** | NOT_APPLICABLE | Candidate | Candidate | Candidate | Candidate | Candidate | **REJECTED** |
| **Compliance Status** | NOT_APPLICABLE | Candidate | Candidate | Candidate | Candidate | Candidate | **REJECTED** |
| **Contact Status** | APPROVED (LOCAL) | Not Contacted | Not Contacted | Not Contacted | Not Contacted | Not Contacted | **REJECTED** |
| **Adult Model Approval** | **APPROVED (TEST ONLY)** | **UNDER REVIEW** | **UNDER REVIEW** | **UNDER REVIEW** | **UNDER REVIEW** | **UNDER REVIEW** | **PROHIBITED** |
| **PIX Instantâneo** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **PIX Copia & Cola / QR** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Cartão de Crédito** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Tokenização / Transparent** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Recorrência (Cartão)** | Supported | Supported | Supported | Supported | Supported | Supported | Supported |
| **Recorrência (PIX Automático)** | Supported | Unknown | Unknown | Unknown | Supported | Unknown | Unsupported |
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
- **Commercial & Compliance Status**: **UNDER REVIEW**. Outreach package prepared in `docs/payments/provider-outreach-templates.md` for submission under MCC 7273 / 5967.
- **Recommendation**: Priority 1 candidate for Brazilian PIX and transparent card processing once commercial underwriting is granted.

### B. PagBank (PagSeguro UOL)
- **Overview**: Long-standing Brazilian acquiring platform with deep consumer brand trust and wide coverage of credit cards and PIX.
- **Technical Fit**: **HIGH**. Complete REST API v4, robust webhook notifications, and PCI-compliant transparent tokenization.
- **Commercial & Compliance Status**: **UNDER REVIEW**. Commercial terms must explicitly encompass digital media advertising platforms for verified adults.
- **Recommendation**: Priority 2 candidate for fallback and card processing.

### C. Pagar.me (StoneCo)
- **Overview**: High-performance acquiring infrastructure designed for digital platforms and marketplaces.
- **Technical Fit**: **HIGH**. Excellent API v5, granular split capabilities, and robust recurring subscription engine.
- **Commercial & Compliance Status**: **UNDER REVIEW**. Requires formal underwriting review from StoneCo risk committee.
- **Recommendation**: Priority 3 candidate for automated subscriptions and advanced risk rules.

### D. Asaas
- **Overview**: Brazilian billing management platform known for specialized recurring billing and dynamic automated PIX.
- **Technical Fit**: **MEDIUM-HIGH**. Comprehensive API for subscriptions and notification automation.
- **Commercial & Compliance Status**: **UNDER REVIEW**. Requires terms of service review regarding classified advertising.
- **Recommendation**: Alternative candidate for PIX recurring automation.

### E. Adyen
- **Overview**: Global omni-channel payments leader providing direct acquiring connections and RevenueAccelerate risk engines.
- **Technical Fit**: **HIGH**. World-class infrastructure, high-volume scalability, and native 3DS 2.0.
- **Commercial & Compliance Status**: **UNDER REVIEW**. High-volume onboarding requirements and global risk committee review.
- **Recommendation**: Tier-1 international candidate for expansion and high transaction volume.

### F. Stripe
- **Status**: **PRODUCTION_BLOCKED / REJECTED**.
- **Reason**: Prohibited by Stripe Restricted Businesses Policy (Section: Adult content and services / Adult advertising).
