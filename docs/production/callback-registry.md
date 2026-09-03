# Portal18 — External Callbacks & Webhooks Central Registry

> [!IMPORTANT]
> **CANONICAL CALLBACKS | REPLAY PROTECTION | STRICT SIGNATURE VALIDATION**

---

## 1. External Callbacks & Webhook Endpoints

| System / Subsystem | Endpoint Route | HTTP Method | Authentication / Signature | Canonical Domain Required? | Current Readiness Status |
|---|---|---|---|---|---|
| **Supabase Auth Callback** | `/auth/callback` | GET | PKCE code exchange | Yes | **READY_FOR_DOMAIN** |
| **Google OAuth Return** | `/auth/callback` | GET | Google Client Secret | Yes | **READY_FOR_DOMAIN** |
| **Age Assurance Return** | `/age-verification/callback` | GET | HMAC Session Token | Yes | **READY_FOR_DOMAIN** |
| **KYC Identity Return** | `/advertiser/verification/return` | GET | Session Nonce / CSRF | Yes | **READY_FOR_DOMAIN** |
| **Payment Provider Webhook** | `/api/webhooks/payments` | POST | HMAC-SHA256 Provider Secret | Yes | **READY_FOR_DOMAIN** |
| **KYC Provider Webhook** | `/api/webhooks/identity-verification` | POST | HMAC-SHA256 Provider Secret | Yes | **READY_FOR_DOMAIN** |
| **Email Delivery Webhook** | `/api/webhooks/email` | POST | Provider Signature | Yes | **READY_FOR_DOMAIN** |
