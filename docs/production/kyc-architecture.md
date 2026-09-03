# Portal18 — KYC & Identity Verification Architecture

> [!IMPORTANT]
> **DOMAIN SEPARATION | PROVIDER ABSTRACTION | FAIL-CLOSED GATE | MINIMAL EVIDENCE RETENTION**

---

## 1. Domain Separation Invariant

Portal18 enforces strict separation between three distinct identity, safety, and authenticity domains:

| Domain | Target Entity | Mechanism | Data Stored | Public Trust Signal |
|---|---|---|---|---|
| **Visitor Age Assurance** | Anonymous Site Visitors | Privacy-preserving token (`ageSessionService`) | Opaque subject hash, 18+ boolean token | Age Gate access clearance |
| **Advertiser KYC / Identity** | Professional Advertisers | IdentityVerificationProvider (`IdentityProviderFactory`) | Verification status, country, document type | `Identidade Verificada` badge |
| **Authenticity Video** | Professional Advertisers | Dynamic single-use challenge (`authenticityService`) | 15-min challenge code, signed video evidence | `Perfil Autenticado` badge |

*Invariants:*
- Authenticity video cannot substitute for civil KYC.
- Visitor Age Assurance cannot grant advertiser verification.
- Paid commercial plans (VIP/Premium) have zero influence on KYC trust signals.

---

## 2. KYC Lifecycle & State Machine

```
[Advertiser Initiates KYC]
           │
           ▼
[IdentityProviderFactory.getProvider()]
  ├── Checks active provider (unconfigured / didit / verifica_id / sumsub)
  ├── Enforces fail-closed safety when unconfigured
  └── Generates server-bound verification session token
           │
           ▼
[External Provider Webhook / Callback]
  ├── Cryptographic Signature Validation
  ├── Replay Protection & Timestamp Tolerance
  └── Idempotent State Transition (verified / rejected / requires_action / manual_review)
           │
           ▼
[Publication Gate & Trust Signal Ledger]
  ├── Public Profile Badge: "Identidade Verificada"
  └── Unverified Profiles Barred from Publication
```
