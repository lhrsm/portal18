# PORTAL18 — COMMERCIAL LAUNCH CHECKLIST & OPERATIONS GOVERNANCE

## 1. Commercial Catalog & Pricing
- [x] **Canonical Advertiser Plans**: Essencial, Destaque, Premium, VIP defined and active.
- [x] **Billing Periods**: 7 Days (`7_days`), 30 Days (`30_days`), 90 Days (`90_days`) seeded.
- [x] **Price Versioning**: `plan_pricing` configured in integer BRL cents under Policy `v1`.
- [x] **Consumer Premium Catalog**: Free and Premium tiers configured with exclusive media and review entitlements.
- [x] **Authenticity Exemption**: Media authenticity and verification challenge remain 100% Free across all tiers.

---

## 2. Discovery, Campaigns & Inventory
- [x] **Organic Ranking**: Multidimensional scoring (Quality, Profile Completeness, Recency, Bayesian CTR).
- [x] **Sponsored Inventory**: Strict slot limits configured per geographic scope (State, City, Category).
- [x] **Campaign Analytics**: Tracking impressions, clicks, and conversion intent with zero Denominator protection.
- [x] **Megaphone Badges**: Standard neutral visual treatment for sponsored profiles.

---

## 3. Referral Program & Fraud Engine
- [x] **Referral Attribution**: Cryptographic codes and cookies with 30-day attribution window.
- [x] **Reward Ledger**: Immutable append-only ledger granting visibility bonus days upon qualification.
- [x] **Antifraud Guards**: IP cluster detection, device fingerprint velocity, and self-referral prevention.
- [x] **Manual Review Queue**: Administrative workflow to review or revoke rewards with required justification.

---

## 4. Trust & Safety Invariants
- [x] **Age Assurance Primacy**: ECA Digital verification required before any 18+ content access.
- [x] **No Commercial Bypass**: Neither Advertiser Subscriptions nor Consumer Premium bypass Age Assurance.
- [x] **Contacts Liquidity**: Direct advertiser WhatsApp, Phone, and Telegram channels remain unblocked.
- [x] **Moderated Reviews**: Structured reviews require admin moderation before public rendering.
- [x] **Zero Surveillance**: Commercial Control Center displays zero raw biometrics, KYC documents, or visitor identities.

---

## 5. Payment Governance & Kill Switch
- [x] **Kill Switch State**: Active in production (`PORTAL18_PAYMENT_KILL_SWITCH="true"`).
- [x] **Checkout UI**: Buttons transparently indicate `"Assinaturas em fase de homologação controlada"`.
- [x] **Orders & Webhook Contract**: Handlers prepared for idempotent execution upon future gateway activation.

---

## 6. Legal & Compliance Review Flags
- [ ] **Referral Program Terms**: Legal validation of visibility bonus days as promotional consideration.
- [ ] **Consumer Premium Terms**: Legal review of digital subscription cancellation and right of withdrawal.
- [ ] **Review Policy**: Compliance with Brazilian Consumer Defense Code (CDC) and Marco Civil da Internet.
- [ ] **Privacy Policy & LGPD**: Data minimization confirmation for analytics aggregation.
