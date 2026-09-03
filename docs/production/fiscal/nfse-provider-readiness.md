# Portal18 — NFS-e Provider Integration Readiness & Municipal Abstraction

> [!IMPORTANT]
> **ABSTRACTED MUNICIPAL GATEWAY | ZERO HARDCODED PREFEITURA APIS | DIGITAL CERTIFICATE GATES**

---

## 1. Abstracted Integration Topologies

Portal18 supports two future fiscal integration pathways:
1. **Third-Party Fiscal API Aggregator** (e.g., Focus NFe, PlugNotas, eNotas): Normalizes disparate municipal schemas into a uniform REST API.
2. **Direct Municipal Web Services** (SOAP/REST): Direct connection requiring municipality-specific XML parsing and RPS conversion.

---

## 2. Digital Certificate Governance (A1)

- **Storage**: Encrypted server-side key vault (e.g., AWS KMS / Secret Manager).
- **Security**: **Zero** plaintext certificate storage; barred from client environments (`NEXT_PUBLIC_` prefixes) and version control.
- **Monitoring**: Automated alert triggers 30 days prior to certificate expiration.
