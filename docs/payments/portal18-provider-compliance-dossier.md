# PORTAL18 — INSTITUTIONAL COMPLIANCE & BUSINESS MODEL DOSSIER

> **Document Type**: Institutional Compliance, Platform Governance & PSP Onboarding Dossier
> **Platform**: Portal18 (Portal18 Tecnologia e Publicidade Digital Ltda.)
> **Target Audience**: Payment Service Providers (PSPs), Acquiring Banks, Underwriting & Risk Committees
> **Current Version**: Phase 28C.1 (Hardened & Truthful Claims)
> **Active Environment Invariant**: `PORTAL18_PAYMENT_KILL_SWITCH=true` (Zero live charges until formal execution)

---

## 1. EXECUTIVE SUMMARY
Portal18 is a Brazilian digital technology and advertising marketplace platform created specifically for verified independent adult professionals and digital creators (18+). The platform provides classified advertising, digital profile showcases, search discovery, and trust-verification infrastructure for consenting adult advertisers across Brazilian metropolitan areas.

---

## 2. BUSINESS MODEL
Portal18 operates as a pure-play digital media and advertising SaaS marketplace. The platform monetizes exclusively by charging advertisers and consumer members for **its own proprietary digital services** (subscription plans, featured placement, priority discovery, and member features).

---

## 3. WHAT PORTAL18 SELLS
Portal18 charges customers and advertisers exclusively for digital platform features:

### A. Advertiser Subscription Plans
- **Essencial**: R$ 49,90/mês (disponível em ciclos de 7, 30 e 90 dias)
- **Destaque**: R$ 89,90/mês (disponível em ciclos de 7, 30 e 90 dias)
- **Premium**: R$ 149,90/mês (disponível em ciclos de 7, 30 e 90 dias)
- **VIP**: R$ 249,90/mês (disponível em ciclos de 7, 30 e 90 dias)

### B. Consumer Membership (Consumer Premium)
- **Portal18 Premium Member**: R$ 24,90/mês (disponível em ciclos de 7, 30 e 90 dias) — Concede acesso a vídeos e galerias em alta definição e recursos de comunidade.

### C. Promotional Boost Products
- **Destaque 24 Horas**: R$ 19,90
- **Destaque 3 Dias**: R$ 49,90
- **Destaque 7 Dias**: R$ 99,90
- **Topo da Cidade & Destaque de Categoria**

---

## 4. WHAT PORTAL18 DOES NOT PROCESS
To ensure absolute clarity regarding operational and regulatory boundaries:
- **NO Peer-to-Peer Intermediation**: Portal18 **DOES NOT** process, intermediate, or collect payments for services negotiated privately between visitors and independent advertisers.
- **NO Commission on External Agreements**: Portal18 **DOES NOT** take a fee, cut, or percentage of any agreement arranged privately between consenting adults outside the platform.
- **NO Custody or Escrow**: Portal18 **DOES NOT** maintain financial wallets, customer balances, or peer-to-peer payouts for advertisers.
- **NO Financial Institution Status**: Portal18 is not a payment institution, escrow agent, or money transmitter.

---

## 5. 18+ SAFETY ARCHITECTURE
Portal18 implements strict boundary controls in compliance with Brazilian youth protection statutes (ECA Digital / Lei 8.069/1990):
- **Fail-Closed Age Assurance**: Interstitial Age Gate requiring explicit confirmation of legal majority (18+) with cryptographically signed session tokens.
- **Safe Mode by Default**: Unverified visitors operate under blurred media filters with sensitive terms redacted.
- **Independence Principle**: Payment completion or subscription status never substitutes for Age Assurance.

---

## 6. ADVERTISER CONTROLS
Before an advertiser profile can be published to the public directory:
- **Identity Review**: Onboarding flow collecting official identification documents, subject to compliance verification.
- **Live Authenticity Video Challenge**: Ephemeral in-app challenge video where the advertiser demonstrates dynamic codes/gestures to eliminate catfishing and fake profiles.
- **Publication Gate**: Advertisers cannot go live without active Trust & Safety review.

---

## 7. CONTENT MODERATION
- **Pre-Publication Queue**: Every public profile, photo, audio recording, commercial video, and user review is queued for moderation before indexing.
- **Strict Prohibitions**: Immediate rejection of non-consensual imagery, hate speech, weapons, illicit substances, or unverified third parties.
- **Anti-Extortion Review System**: Authenticated reviews with right of reply and dispute mechanisms to protect independent creators.

---

## 8. MINOR PROTECTION
Portal18 enforces an uncompromising zero-tolerance policy regarding minors (under 18 years of age):
- Strict 18+ onboarding gating and rejection of underage applicants.
- Immediate suspension and blacklisting of any profile suspected of involving minors.
- Documented escalation protocols for referral to Brazilian competent authorities (Ministério Público, Polícia Federal, SaferNet) as required by law.

---

## 9. PRIVACY / LGPD
- Full alignment with the Brazilian General Data Protection Law (LGPD - Lei 13.709/2018).
- Sensitive KYC documents and challenge videos are stored in encrypted, access-restricted private storage buckets (`private_documents`).
- Advertiser analytics display aggregated views without exposing visitor PII.
- Dedicated Privacy & LGPD Center (`/trust/lgpd` and `/trust/privacy`).

---

## 10. PAYMENT ARCHITECTURE
- **Multi-Gateway Orchestration**: Decoupled payment orchestration layer built on Next.js and Supabase PostgreSQL.
- **Zero Card Storage**: Portal18 servers NEVER store, log, or transmit primary account numbers (PAN) or CVVs. 100% of card transactions utilize PSP-hosted tokenization fields.
- **3D Secure Readiness**: Architecture supports 3DS 2.0 challenge flows.
- **Server-Authoritative Pricing**: Total amounts, discounts, and billing intervals are 100% computed server-side (zero client trust).
- **Cryptographic Webhooks**: HMAC SHA-256 validation with replay protection and monotonic state transitions preventing out-of-order data corruption.

---

## 11. REQUESTED PAYMENT METHODS
Portal18 formally requests underwriting and integration credentials for:
1. **PIX Instantâneo**: Dynamic QR Code and Copia e Cola generation with automated webhook confirmation.
2. **Transparent Credit Card Processing**: Tokenized card checkout with 3DS authentication.
3. **Automated Recurring Subscriptions**: Scheduled cycle management for 7, 30, and 90-day subscription intervals.

---

## 12. CURRENT PAYMENT STATUS
To ensure full transparency during onboarding:
- **Production Payments**: `DISABLED`
- **Global Payment Kill Switch**: `ACTIVE` (`PORTAL18_PAYMENT_KILL_SWITCH=true`)
- **Real PIX Transactions**: `0`
- **Real Credit Card Transactions**: `0`
- **Real Recurring Charges**: `0`
- **Provider Sandbox Credentials**: `PENDING CONFIGURATION`
- **Provider Commercial Approval**: `UNDER REVIEW / CANDIDATE`

---

## 13. PROVIDER APPROVAL REQUEST
Portal18 formally requests the commercial, compliance, and risk underwriting teams of the recipient PSP to:
1. Review this Institutional Compliance Dossier and platform governance model.
2. Formally evaluate the appropriate merchant category code (suggested classification: **MCC 7273 - Dating & Escort Services / Online Classified Advertising** or **MCC 5967 - Direct Marketing / Digital Media**).
3. Authorize the issuance of sandbox credentials for technical certification and commercial onboarding.

---

## 14. KNOWN PENDING ITEMS
- Formal execution of commercial contracts with selected PSPs.
- Reception of live sandbox API keys for external automated test certification.
- Final legal counsel review of subscription terms, cancellation workflows, and refund policies.
