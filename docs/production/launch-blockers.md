# Portal18 — Production Launch Blockers Matrix

> [!IMPORTANT]
> **COMPREHENSIVE EXTERNAL DEPENDENCY & LAUNCH READINESS REGISTER**

---

## 1. Launch Blockers Matrix

| Blocker ID | Domain | Description | Owner | Status | Traffic Blocking? | Payment Blocking? |
|---|---|---|---|---|---|---|
| `BLK-01` | Finance / PSP | Corporate merchant underwriting for PIX & Credit Card | FinOps Lead | **PENDING** | No | **YES** |
| `BLK-02` | KYC / Trust | Production agreement & live API credentials with Biometric KYC vendor | Security Lead | **PENDING** | No | **YES** |
| `BLK-03` | Communications | Production transactional email provider DNS DKIM/DMARC configuration | SRE Lead | **PENDING** | **YES** (Auth recovery depends on email) | No |
| `BLK-04` | Fiscal / NFS-e | Municipal electronic invoice API digital certificate registration | Accounting Lead | **PENDING** | No | **YES** |
| `BLK-05` | Legal / Policy | Terms of Service, Age Assurance compliance dossier, and Privacy Policy ratification | Legal Counsel | **PENDING** | **YES** | **YES** |
| `BLK-06` | DNS / Domain | Corporate canonical domain provisioning and DNS delegation | Platform Lead | **PENDING** | **YES** | No |

---

## 2. Traffic Eligibility Decision

- **Public Traffic Eligibility**: **NO** (Blocked by `BLK-03`, `BLK-05`, `BLK-06`).
- **Payment Eligibility**: **NO** (Blocked by `BLK-01`, `BLK-04`, `BLK-05` and Kill Switch).
