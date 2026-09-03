# Portal18 — KYC Privacy & Data Minimization Policy

> [!IMPORTANT]
> **LGPD CONFORMITY | DATA MINIMIZATION | ZERO RAW BIOMETRIC RETENTION**

---

## 1. Data Minimization Matrix

| Data Element | Collected by Provider? | Stored in Portal18 DB? | Exposed in Public API? | Retention Scope |
|---|---|---|---|---|
| **Civil Full Name** | Yes | No (or encrypted audit hash) | **NO** | Compliance only |
| **CPF / RG Document Number** | Yes | No (Masked / Hashed) | **NO** | Zero plaintext storage |
| **Document Image (Front/Back)** | Yes | Isolated Private Storage | **NO** | Short-lived signed URLs |
| **Selfie Video / Liveness** | Yes | Transient Provider Scope | **NO** | Zero facial templates stored |
| **Date of Birth** | Yes | Age boolean result | **NO** | Compliance age check |
| **Public Verification Badge** | Result | Yes (`verification_status`) | **YES** | Public trust claim |

---

## 2. Public Profile Sanitization

Public profile APIs return strictly:
- `is_verified: boolean`
- `trust_signals: ['identity_verified', 'authenticity_verified']`

**STRICTLY BARRED FROM PUBLIC ENDPOINTS**:
- Real civil names.
- Document numbers (CPF, RG, Passport).
- Dates of birth.
- Facial embeddings or biometrics.
- Provider session tokens or raw webhook responses.
