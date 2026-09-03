# Portal18 — Versioned Tax Configuration & Classification Matrix

> [!IMPORTANT]
> **DYNAMIC VERSIONING | ZERO HARDCODED RATES | MUNICIPALITY ISOLATION**

---

## 1. Corporate Identity & Tax Governance Gates

| Parameter | Configuration Status | Governing Authority | Default Value |
|---|---|---|---|
| **Corporate Entity (CNPJ)** | `CORPORATE_IDENTITY_PENDING` | Legal / Executive | None (Unconfigured) |
| **Tax Regime** | `ACCOUNTING_CONFIRMATION_PENDING` | Certified Accountant | None (Unconfigured) |
| **CNAE Primary/Secondary** | `ACCOUNTING_CONFIRMATION_PENDING` | Certified Accountant | None (Unconfigured) |
| **Municipal Service Code (LC 116)** | `MUNICIPAL_CONFIGURATION_PENDING` | Certified Accountant / Prefeitura | None (Unconfigured) |
| **ISS Tax Rate (%)** | `MUNICIPAL_CONFIGURATION_PENDING` | Municipal Tax Law | None (Unconfigured) |

---

## 2. Tax Configuration Immutability & Snapshots

Every issued fiscal document embeds an immutable JSON snapshot of the effective tax configuration (regime, rate, service code, municipality). Subsequent tax rule updates apply only to future billing periods.
