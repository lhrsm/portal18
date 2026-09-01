# PORTAL18 — INSTITUTIONAL COMPLIANCE & BUSINESS MODEL DOSSIER

> **Document Type**: Institutional Compliance, Platform Governance & PSP Onboarding Dossier
> **Platform**: Portal18 (Portal18 Tecnologia e Publicidade Digital Ltda.)
> **Target Audience**: Payment Service Providers (PSPs), Acquiring Banks, Underwriting & Risk Committees
> **Status**: Technical & Commercial Homologation Phase 28C
> **Active Environment Rule**: `PORTAL18_PAYMENT_KILL_SWITCH=true` (Zero live charges until formal execution)

---

## 1. Company & Platform Overview
Portal18 is a Brazilian technology and digital advertising marketplace platform designed specifically for verified independent professionals and adult digital creators (18+). The platform provides classified advertising, digital profile showcase, search discovery, and trust-verification infrastructure for verified consenting adult advertisers across Brazilian metropolitan markets.

---

## 2. Business Model & Boundaries
- **Marketplace of Digital Classifieds**: Portal18 monetizes strictly by charging advertisers and consumer members for **its own proprietary digital services** (subscription plans, featured placement, priority discovery, member features).
- **Strict Separation of Peer-to-Peer Transactions**:
  - Portal18 **DOES NOT** process, intermediate, or collect payments for services negotiated between visitors and independent advertisers.
  - Portal18 **DOES NOT** take a fee or percentage of any agreement arranged privately between consenting adults outside the platform.
  - Portal18 **DOES NOT** maintain financial wallets, escrow balances, or peer-to-peer payouts for advertisers.
  - Portal18 is a **pure-play digital media and advertising SaaS marketplace**, not a financial institution or escrow agent.

---

## 3. Products Sold Directly by Portal18
Portal18 charges customers and advertisers exclusively for digital platform features:

### A. Advertiser Subscription Plans
- **Essencial** (R$ 49,90/mês | 7, 30 ou 90 dias)
- **Destaque** (R$ 89,90/mês | 7, 30 ou 90 dias)
- **Premium** (R$ 149,90/mês | 7, 30 ou 90 dias)
- **VIP** (R$ 249,90/mês | 7, 30 ou 90 dias)

### B. Consumer Membership (Consumer Premium)
- **Portal18 Premium Member** (R$ 24,90/mês | 7, 30 ou 90 dias): Grants access to verified video showcases, high-definition galleries, and community review insights.

### C. Instant Promotional Boost Products
- **Destaque 24 Horas** (R$ 19,90)
- **Destaque 3 Dias** (R$ 49,90)
- **Destaque 7 Dias** (R$ 99,90)
- **Topo da Cidade & Destaque de Categoria**

---

## 4. Payment Flow & Transaction Integrity
```
USER / ADVERTISER
       │ (1) Selects Platform Digital Product (Plan / Boost / Membership)
       ▼
PORTAL18 SERVER-SIDE PRICING ENGINE
       │ (2) Authoritative Price, Duration & Tax Calculation (Zero Client Trust)
       ▼
IDEMPOTENCY & ORDER RECORD
       │ (3) Registers Unique Order + Idempotency Key in Database
       ▼
AUTHORIZED PAYMENT SERVICE PROVIDER (PSP)
       │ (4) Generates Dynamic PIX / Hosted Transparent Card Tokenization
       ▼
CUSTOMER SETTLEMENT
       │ (5) Customer authorizes payment directly with the PSP / Central Bank PIX
       ▼
CRYPTOGRAPHICALLY SIGNED WEBHOOK
       │ (6) Provider sends HMAC SHA-256 webhook to /api/webhooks/payments
       ▼
STATE NORMALIZATION & MONOTONIC STATE MACHINE
       │ (7) Replay validation, monotonic state transition, and entitlement activation
       ▼
ENTITLEMENT ACTIVE
```

---

## 5. Advertiser Commercial Model
Advertisers access Portal18 self-service tools through a structured lifecycle (`trial` $\rightarrow$ `active` $\rightarrow$ `grace_period` $\rightarrow$ `limited` $\rightarrow$ `expired`). All advertiser subscriptions require mandatory KYC identity verification, authenticity confirmation, and adherence to platform publishing guidelines.

---

## 6. Consumer Premium Model
Consumer members subscribe to unlock enhanced viewing features. **Consumer Premium does not grant immunity from moderation rules, nor does it bypass Age Assurance.**

---

## 7. Adult Content Controls & Safe Mode
Portal18 implements strict boundary controls:
- **Default Safe Mode**: Unverified visitors or users without explicit age confirmation operate under blurred media filters with sensitive terms redacted.
- **Fail-Closed Architecture**: Access to uncensored galleries, videos, or direct contact links requires full pass-through of the Age Gate.

---

## 8. Age Assurance (ECA Digital / 18+ Compliance)
Portal18 operates in compliance with Brazilian youth protection statutes (ECA Digital / Lei 8.069/1990):
- Interstitial Age Assurance modal with cryptographically signed consent tokens.
- Immediate termination and redirection to educational resources for non-consenting visitors.
- **Independence Principle**: Payment completion or subscription status never substitutes for Age Assurance.

---

## 9. Advertiser Identity Verification (KYC)
Before an advertiser profile can be published to the public directory:
- Government-issued official photo ID verification (RG, CNH, Passaporte).
- Biometric liveness check and selfie validation via accredited identity provider (Sumsub / Unconfigured sandbox driver).
- Automated facial matching against document photos with manual moderation fallback.

---

## 10. Authenticity Verification (Live Video Challenge)
To eliminate catfishing, impersonation, and fraudulent imagery:
- Advertisers must record an ephemeral in-app authenticity challenge video holding a dynamically generated gesture/code.
- Authenticity video metadata and biometric hashes are reviewed by the Trust & Safety team.
- Authenticity challenges expire periodically, requiring renewal.

---

## 11. Content Moderation Framework
- **Multi-Stage Moderation Queue**: Every public profile, photo, audio recording, commercial video, and user review passes through moderation prior to public directory indexing.
- **Strict Prohibitions**: Immediate rejection and reporting of non-consensual imagery, hate speech, weapons, illicit substances, or unverified third parties.

---

## 12. Minor Protection & Zero Tolerance Policy
Portal18 maintains absolute zero-tolerance regarding minors (under 18 years of age):
- Strict AI document age estimation and manual moderation cross-validation during onboarding.
- Automated blocking of any submitted media containing or suspecting underage individuals.
- Immediate permanent profile suspension, IP banning, and reporting to competent Brazilian authorities (Polícia Federal, Ministério Público, SaferNet).

---

## 13. Reporting & Rapid Content Takedown
- Dedicated public **Denúncia (Reporting)** button accessible on every advertiser card and profile.
- Priority SLA for urgent reports (impersonation, non-consensual media, extortion): Takedown executed within 15 minutes.
- Public **Content Removal Portal** (`/trust/content-removal`) providing takedown mechanisms for any individual requesting image de-indexing.

---

## 14. Review Moderation & Anti-Extortion
- Advertiser reviews must be authenticated by real users with verified phone/email.
- Automated sentiment analysis flags extortion attempts or abusive blackmail.
- Advertisers have the right of reply and dispute resolution under staff moderation.

---

## 15. LGPD & Privacy Governance
- Full compliance with the Brazilian General Data Protection Law (LGPD - Lei 13.709/2018).
- Dedicated Privacy & Data Protection Center (`/trust/lgpd` and `/trust/privacy`).
- Data Subject Access Request (DSAR) automation for data extraction, rectification, and deletion.

---

## 16. Data Minimization & Privacy
- Identification documents and authenticity challenge videos are stored in encrypted, non-public private buckets (`private_documents`).
- Advertiser analytics display aggregated counters without exposing visitor PII or contact details.

---

## 17. Financial Security & PCI Compliance
- **Zero Card Storage**: Portal18 servers NEVER store, process, or transmit primary account numbers (PAN), CVVs, or cardholder magnetic track data.
- 100% of card transactions utilize PSP-hosted tokenization fields and 3D Secure (3DS 2.0).
- Encrypted HTTPS TLS 1.3 transmission with strict Content Security Policies (CSP).

---

## 18. Antifraud & Risk Prevention
- Idempotency hashing preventing accidental double-charges.
- Velocity checks preventing automated card-testing attacks.
- Real-time risk scoring integrated with device fingerprinting and geolocation telemetry.

---

## 19. Refund & Cancellation Readiness
- Programmatic server-side refund capability for full and partial amounts.
- Pro-rata refund rules for accidental double transactions.
- Transparent self-service subscription cancellation with entitlement preserved until period end.

---

## 20. Chargeback & Dispute Management
- Dedicated `payment_chargebacks` audit ledger tracking the full dispute lifecycle (`received` $\rightarrow$ `under_review` $\rightarrow$ `evidence_required` $\rightarrow$ `submitted` $\rightarrow$ `won` / `lost`).
- Immediate notification hooks for swift evidence assembly (proof of digital delivery, account logs, IP records).

---

## 21. Customer Support & Escalation
- Dedicated Support Ticket System (`/support`) with categorized queues (Financial, Moderation, Identity, Technical).
- Response SLA of under 4 hours for financial inquiries.

---

## 22. Incident Response & Emergency Protocols
- Dedicated Kill Switch mechanism capable of instantly pausing payment processing platform-wide without disrupting existing active advertiser subscriptions.
- Documented emergency playbook in `docs/payments/payment-incident-runbook.md`.

---

## 23. Technical Multi-Gateway Architecture
- Decoupled payment orchestration layer built on Next.js, Node.js, and Supabase PostgreSQL.
- Modular adapter pattern supporting dynamic routing, health checks, and sanitized logging.

---

## 24. Requested Payment Methods & Capabilities
Portal18 formally requests underwriting and API credential access for:
1. **PIX Instantâneo**: Dynamic QR Code and Copia e Cola string generation with automated webhook confirmation.
2. **Transparent Credit Card Processing**: Tokenized card checkout with native 3DS 2.0 authentication.
3. **Automated Recurring Subscriptions**: Scheduled cycle management for 7, 30, and 90-day subscription intervals.

---

## 25. Formal Approval & Underwriting Request
Portal18 formally requests the commercial and risk underwriting team of the recipient PSP to:
1. Review and validate this Institutional Compliance Dossier.
2. Formally assign the appropriate merchant category code (e.g. **MCC 7273 - Dating & Escort Services / Online Classified Advertising** or **MCC 5967 - Direct Marketing Inbound Telemarketing / Digital Media**).
3. Authorize the issuance of sandbox and production API credentials for digital classifieds advertising operations.
