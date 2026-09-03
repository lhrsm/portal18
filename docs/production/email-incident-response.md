# Portal18 — Transactional Email Incident Management Runbook

> [!IMPORTANT]
> **EMERGENCY KILL SWITCH | COMPROMISE REVOCATION | MAIL BOMB CONTAINMENT**

---

## 1. Emergency Kill Switch Activation

If unexpected email surges, spam complaints, or provider account compromise occurs:
1. **Immediate Action**: Set `PORTAL18_EMAIL_KILL_SWITCH = true` in production environment.
2. **Redeploy / Invalidate**: Trigger immediate edge redeploy to enforce fail-closed dispatching.
3. **Provider Console**: Pause sending or revoke active API key on provider dashboard.

---

## 2. Incident Scenarios & Playbooks

### A. High Bounce Rate (> 5%)
- **Triage**: Inspect `notification_deliveries` failure reasons.
- **Action**: Verify whether invalid test emails entered registration queue; enforce stricter email validation regex and rate limits on `/register` and `/forgot-password`.

### B. Mail Bombing / Enumeration Attack
- **Triage**: High frequency of password reset requests targeting varying email domains.
- **Action**: Verify that IP sliding window rate limiters (5 requests/min) are active on `/forgot-password` and ensure generic enumeration-safe responses are returned.
