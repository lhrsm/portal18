# Portal18 — Fiscal Reconciliation & Discrepancy Detection Runbook

> [!IMPORTANT]
> **RECONCILIATION-FIRST INTEGRITY | MANUAL REVIEW QUEUE | AUDIT LOGGING**

---

## 1. Discrepancy Classification

- **Uninvoiced Settled Sales**: Order paid and settled without corresponding authorized NFS-e record.
- **Orphan Fiscal Documents**: Authorized NFS-e without corresponding paid order ID.
- **Value Mismatch**: Gross amount on authorized NFS-e diverges from immutable commercial order snapshot.
- **Refund Divergence**: Settled order refunded without required fiscal credit adjustment or cancellation note.

---

## 2. Reconciliation Playbook

1. Daily scheduled job reconciles eligible commercial transactions against `fiscal_documents`.
2. Detected anomalies route to `/admin/finance/fiscal-readiness` manual review queue.
3. Automated correction is **strictly barred** for authorized municipal documents; adjustments require audited manual review.
