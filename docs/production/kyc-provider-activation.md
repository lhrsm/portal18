# Portal18 — KYC Provider Production Activation Runbook

> [!IMPORTANT]
> **18-STEP PROVIDER ACTIVATION PROTOCOL | ZERO PLAINTEXT CREDENTIALS | STRICT AUDIT**

---

## 1. 18-Step Activation Protocol

1. [ ] **Provider Selected**: Didit, Verifica ID, or Sumsub selected based on enterprise evaluation.
2. [ ] **Commercial Agreement Signed**: Production contract executed.
3. [ ] **DPA & Privacy Review**: Data Processing Agreement signed ensuring LGPD/GDPR compliance.
4. [ ] **Subprocessors Updated**: Public privacy policy updated with vendor identity.
5. [ ] **Production Credentials Injected**: API keys stored in server-only environment variables.
6. [ ] **Webhook Signing Secret Configured**: Secret configured for HMAC-SHA256 signature verification.
7. [ ] **Callback Origin Whitelisted**: Canonical domain callback registered in provider console.
8. [ ] **Sandbox Certification**: 100% synthetic document test pass in staging.
9. [ ] **Document Flow Tested**: Valid CNH/RG flow completes verification.
10. [ ] **Selfie / Liveness Tested**: Active liveness detection completes without errors.
11. [ ] **Age Result Tested**: Under-18 document is strictly flagged and rejected.
12. [ ] **Failed Flow Tested**: Invalid or expired document triggers `rejected` state safely.
13. [ ] **Replay Protection Tested**: Replayed webhook event is dropped idempotently.
14. [ ] **Revocation Tested**: Revocation triggers immediate removal of public trust badge.
15. [ ] **Private Storage Access Tested**: Short-lived signed URLs (<= 300s) verified.
16. [ ] **Retention Policy Approved**: Document retention timeline confirmed by legal.
17. [ ] **Legal & Compliance Sign-Off**: Written authorization obtained.
18. [ ] **Manual Activation**: Provider activated in production environment settings.
