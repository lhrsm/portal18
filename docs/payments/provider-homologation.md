# PORTAL18 — PSP HOMOLOGATION FRAMEWORK & COMPLIANCE SPECIFICATION

> **Document Classification**: Confidential / Financial Architecture & Compliance
> **Platform**: Portal18 (18+ Classifieds & Verified Creator Platform)
> **Current Version**: Phase 28B
> **Global State**: `PORTAL18_PAYMENT_KILL_SWITCH=true`

---

## 1. Tripartite Homologation Governance

No payment service provider (PSP) can be activated for production traffic on Portal18 without simultaneously obtaining three independent gates of approval:

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Technical Gate      │      │ 2. Commercial Gate      │      │ 3. Compliance 18+ Gate  │
│  - Sandbox Suite Passed│      │  - Contract Executed    │      │  - Adult Model Disclosed│
│  - Webhook Signatures  │  &&  │  - Pricing Versioned    │  &&  │  - MCC Underwriting     │
│  - Tokenization & 3DS  │      │  - SLA & Chargeback Cap │      │  - Formal Written OK    │
└───────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘
            │                                │                                │
            └────────────────────────────────┼────────────────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   PRODUCTION ELIGIBLE     │
                               │  (Requires Kill Switch    │
                               │   Executive Deactivation) │
                               └───────────────────────────┘
```

---

## 2. Technical Homologation States

- `NOT_CONFIGURED`: The provider adapter exists in code, but no sandbox API keys/tokens are configured in the environment.
- `CONFIGURED`: Valid sandbox credentials have been injected and basic format validation has passed.
- `SANDBOX_READY`: Adapter connectivity and authentication with the PSP sandbox environment have been verified.
- `SANDBOX_TESTING`: Automated and manual capability tests (PIX, card tokenization, webhooks) are actively executing.
- `SANDBOX_PASSED`: All official test scenarios have succeeded against the PSP's test environment. *(Note: Does NOT grant production eligibility without commercial approval).*
- `SANDBOX_PARTIAL`: Core payment methods passed, but secondary features (e.g. automatic recurring PIX) are unsupported or degraded.
- `SANDBOX_FAILED`: Sandbox transactions returned unexpected errors, invalid signature verification, or communication timeouts.
- `PRODUCTION_REVIEW`: Technical and commercial gates are cleared, waiting for final executive review.
- `PRODUCTION_APPROVED`: Fully approved and eligible for live routing once the global kill switch is deactivated.
- `PRODUCTION_BLOCKED`: The provider is permanently rejected due to policy incompatibility (e.g. Stripe).

---

## 3. Adult Business Compliance Invariant

Payment providers often maintain restrictive acceptable use policies. Portal18 enforces strict transparency:
1. **Explicit Business Model Disclosure**: When opening commercial dialogues, Portal18 explicitly discloses that it operates an adult classifieds directory with Age Assurance (ECA Digital / 18+).
2. **No Stealth Onboarding**: Portal18 will never register under a generic e-commerce MCC to bypass underwriting.
3. **Audit Evidence**: All approval references, underwriting agreements, and MCC definitions must be recorded in the database table `payment_providers.business_model_review`.
