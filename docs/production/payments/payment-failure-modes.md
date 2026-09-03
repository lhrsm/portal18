# Portal18 — Payment Failure Modes, Blind Failover Prohibition & Reconciliation

> [!IMPORTANT]
> **PROHIBITION OF BLIND FAILOVER | RECONCILIATION-FIRST RECOVERY | DUPLICATE CHARGE CONTAINMENT**

---

## 1. Prohibition of Blind Failover

In the event of a provider timeout or network interruption during payment initiation:
- **STRICT INVARIANT**: The system **MUST NOT** immediately submit the charge to a secondary provider without conclusive reconciliation.
- **Rationale**: Blind retries create severe risk of double-charging the customer when the original provider processed the payment asynchronously.
- **Enforcement**: Orders enter `requires_reconciliation` state until the primary provider returns a definitive success or failure status.

---

## 2. Duplicate Charge Containment Playbook

If an anomalous duplicate charge is detected:
1. **Immediate Retry Lockout**: Halt automated retry workers on the affected billing cycle.
2. **Provider State Query**: Query PSP reconciliation endpoints to verify captured authorization IDs.
3. **Idempotent Refund**: Trigger automated refund of the secondary duplicate transaction.
4. **Customer Notification**: Dispatch discreet transaction adjustment notification via in-app alert.
5. **Audit Logging**: Record event details in `audit_logs` with provider reference IDs.
