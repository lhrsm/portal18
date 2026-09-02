# Portal18 — Phase 36 E2E Evidence Manifest

> [!IMPORTANT]
> **TEST RUN ID:** `E2E-20260902-RC` | **RELEASE STATUS:** RELEASE CANDIDATE TECHNICALLY VALIDATED
> **ENVIRONMENT:** Homologation / Controlled Staging Database | **ZERO REAL MONEY CHARGES**

---

## 1. Test Personas & Isolation

| Persona ID | Role | Email Identifier | Verification Status | Scope |
|---|---|---|---|---|
| `E2E_VISITOR_01` | Anonymous Visitor | `anonymous@session.local` | Unverified (Safe Mode) | Public Discovery & Age Gate |
| `E2E_CONSUMER_01` | Authenticated Consumer | `test-consumer-01@portal18.homolog` | Age Verified | Favorites, Lists, Following, Reviews |
| `E2E_ADVERTISER_01` | Primary Advertiser | `test-advertiser-01@portal18.homolog` | Verified (18+ Video) | Full Onboarding, Published, Gallery |
| `E2E_ADVERTISER_02` | Secondary Advertiser | `test-advertiser-02@portal18.homolog` | Suspended / Moderation | Sanction, Appeal, Rejection |
| `E2E_MODERATOR_01` | Content Moderator | `test-moderator-01@portal18.homolog` | Staff (Moderator) | Media, Review & Profile Moderation |
| `E2E_ADMIN_01` | Super Administrator | `test-admin-01@portal18.homolog` | Staff (Super Admin) | Four-Eyes, Finance, T&S, Security |

---

## 2. Verified Journeys Ledger

### A. Discovery & Age Assurance
- **Safe Mode Enforcement**: Anonymous session restricted from explicit media and direct contacts until 18+ gate passed.
- **Fail-Closed Verification**: Underage result strictly blocks access (`isAgeVerified = false`).
- **Search & Synonyms**: Full-text and normalized search (`salvador massagem`) returns matching verified active profiles.

### B. Advertiser Lifecycle
- **Onboarding Progression**: Draft recovery, field validation, and state preservation confirmed across browser refresh.
- **Media Pipeline**: Test media uploaded, queued in moderation, and published upon approval.
- **Direct Object Isolation**: Advertiser A strictly denied from editing or viewing billing/analytics of Advertiser B.

### C. Commercial Simulation & Finance
- **Simulated Settlement**: Internal Test Driver executes end-to-end checkout, settlement, and fulfillment without external PSP.
- **Double Fulfillment Prevention**: Duplicate callback replay rejected idempotently.
- **Finance Privacy**: Sanitized exports contain 0 PAN, 0 CVV, 0 raw KYC, and 0 visitor PII.

---

## 3. External Blockers (Pre-Production Readiness)

The following items are recognized external dependencies and are not classified as defects:
1. **PSP Production Underwriting**: Active internal test driver; external gateway pending business entity contract.
2. **External Production KYC Vendor**: Sandbox simulation driver active.
3. **Production SMTP/Transactional Email**: Simulation driver active (`PORTAL18_EMAIL_KILL_SWITCH = true`).
4. **Automated Municipal NFS-e Gateway**: Manual batch ledger export active.
