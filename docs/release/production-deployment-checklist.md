# Portal18 — Production Deployment & Go-Live Checklist

> [!IMPORTANT]
> **MANDATORY MANUAL SIGN-OFF BEFORE PRODUCTION PROVISIONING**

---

## 1. Automated Readiness Gates (Must Pass in CI)

- [x] TypeScript compiler passes with 0 errors (`npx tsc --noEmit`).
- [x] Next.js production build succeeds for all 111 routes (`npm run build`).
- [x] Database migration parity confirmed (39/39 migrations).
- [x] Pre-deploy safety check passes (`scripts/pre-deploy-check.ts`).
- [x] All 15 regression suites pass 100%.

---

## 2. Business & Legal Approval Gates (External Prerequisites)

- [ ] **Corporate Banking & PSP Underwriting**: Merchant agreement executed; real settlement accounts configured.
- [ ] **Biometric KYC Vendor Contract**: Live API keys obtained and sandbox certified.
- [ ] **Transactional Email DNS**: DKIM/SPF/DMARC records configured on corporate domain.
- [ ] **Municipal NFS-e Provider**: Digital certificate installed for fiscal reporting.
- [ ] **Legal & Compliance Sign-Off**: Terms of service and Age Assurance policies ratified.
- [ ] **Accounting Sign-Off**: Ledger charts and tax classification confirmed.
