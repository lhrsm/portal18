# Portal18 — Email Provider Production Activation Runbook

> [!IMPORTANT]
> **17-STEP ACTIVATION PROTOCOL | SENDER DOMAIN DELEGATION | ZERO PLAINTEXT SECRETS**

---

## 1. 17-Step Provider Activation Checklist

1. [ ] **Canonical domain defined**: Primary portal domain registered and DNS delegated.
2. [ ] **Sender domain defined**: Subdomain delegated (e.g., `notify.<canonical-domain>`).
3. [ ] **Provider selected**: Resend, AWS SES, or SMTP chosen based on commercial requirements.
4. [ ] **Provider account approved**: Production volume tier unlocked with provider.
5. [ ] **Server-only credentials configured**: Secret stored in environment manager (`RESEND_API_KEY`, etc.).
6. [ ] **DKIM verified**: 3x CNAME records validated via provider console.
7. [ ] **SPF verified**: Single TXT record with `include:...` validated.
8. [ ] **DMARC monitoring active**: `v=DMARC1; p=none; rua=mailto:...` configured.
9. [ ] **Webhook registered**: Webhook URL configured in provider with signing secret.
10. [ ] **Suppression sync verified**: Test bounce and complaint suppressions registered.
11. [ ] **Bounce handling tested**: Inbound webhook marks delivery as `bounced`.
12. [ ] **Complaint handling tested**: Inbound webhook immediately suppresses marketing address.
13. [ ] **Auth email tested**: Signup confirmation link verified from test mailbox.
14. [ ] **Password reset tested**: Password recovery link verified from test mailbox.
15. [ ] **Production smoke completed**: Post-deploy smoke test executed.
16. [ ] **Executive manual sign-off**: Platform & Security Leads approve transition.
17. [ ] **Kill switch deactivation**: Set `PORTAL18_EMAIL_KILL_SWITCH = false`.
