# Portal18 — Transactional Email Architecture & Lifecycle

> [!IMPORTANT]
> **STATE MACHINE | PROVIDER ABSTRACTION | FAIL-CLOSED RESOLVER | ATOMIC QUEUE CONCURRENCY**

---

## 1. Subsystem Architecture

```
[Application Trigger / Auth Event]
           │
           ▼
[Canonical Notification Dispatcher]
  ├── Category Classification (Security, Account, Billing, Moderation, Support)
  ├── Server-Side Deduplication (dedupe_key)
  └── Template Engine (Discreet Subjects, Tag Sanitization, Multipart Text/HTML)
           │
           ▼
[Notification Queue (notification_deliveries)]
  ├── Atomic Claim / Concurrency Lock
  ├── Suppression Verification (Hard Bounce / Complaint Blacklist)
  └── Fail-Closed Resolver (PORTAL18_EMAIL_KILL_SWITCH Check)
           │
     ┌─────┴─────────────────────────────────┐
     ▼                                       ▼
[Kill Switch Active]                 [Provider Configured]
  └─► status: disabled_by_policy       ├─► Resend Adapter
      is_simulated: true               ├─► AWS SES Adapter
      Zero external network calls      └─► Custom SMTP Adapter
```

---

## 2. Standardized Delivery State Machine

| State | Definition | Transition Triggers |
|---|---|---|
| `queued` | Event enqueued in `notification_deliveries` ledger | Initial dispatch |
| `processing` | Atomic worker lock acquired | Worker heartbeat claim |
| `accepted` | Provider accepted payload for queueing | Provider HTTP 200/202 with Message ID |
| `delivered` | Recipient SMTP server confirmed receipt | Inbound provider webhook |
| `temporary_failure` | Transient error (429, timeout, provider 5xx) | Exponential backoff retry scheduled |
| `permanent_failure` | Unrecoverable error (bad syntax, dead letter threshold) | Abandoned / Escalated to admin |
| `suppressed` | Recipient address blocked by bounce/complaint list | Dropped pre-send |
| `disabled_by_policy` | Dispatch prevented by kill switch | Logged without external dispatches |
