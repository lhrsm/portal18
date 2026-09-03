# Portal18 — Canonical Domain Go-Live & Activation Checklist

> [!IMPORTANT]
> **25-STEP DOMAIN ACTIVATION PROTOCOL | OPERATOR SIGN-OFF | ZERO PREMATURE TRAFFIC RELEASE**

---

## 1. 25-Step Domain Activation Checklist

1. [ ] **Domain Acquired**: Domain registration confirmed under legal operating entity.
2. [ ] **Ownership Verified**: Domain ownership validated at DNS registrar.
3. [ ] **DNS Provider Confirmed**: Enterprise authoritative DNS established.
4. [ ] **Hosting Custom Domain Attached**: Custom domain mapped in edge hosting console.
5. [ ] **DNS Apex / CNAME Configured**: DNS records configured per hosting provider requirements.
6. [ ] **DNS Global Propagation Confirmed**: Verified across multi-region DNS resolvers.
7. [ ] **TLS Certificate Issued**: Valid certificate issued by hosting / edge platform.
8. [ ] **HTTPS Enforcement Tested**: HTTP to HTTPS 308 redirect functioning.
9. [ ] **Canonical Origin Configured**: `NEXT_PUBLIC_SITE_URL` updated in production environment.
10. [ ] **Apex / WWW Redirect Verified**: Secondary host variant redirects cleanly to canonical.
11. [ ] **Supabase Auth Site URL Updated**: Site URL configured to canonical origin.
12. [ ] **Supabase Additional Redirects Updated**: `/auth/callback` whitelist locked to canonical origin.
13. [ ] **Google OAuth Origins & Redirects Updated**: Google Developer Console credentials updated.
14. [ ] **KYC Identity Return URL Updated**: Verified return URL locked to canonical origin.
15. [ ] **Payment Webhook URL Registered**: PSP console webhook updated with production URL.
16. [ ] **Email Sender Subdomain Created**: `notify.<domain>` DNS delegation active.
17. [ ] **SPF TXT Record Configured**: Valid SPF record published.
18. [ ] **DKIM Records Configured**: DKIM public keys verified per email provider requirements.
19. [ ] **DMARC Monitoring Configured**: `p=none` DMARC policy active.
20. [ ] **CSP Production Directives Verified**: Production CSP headers active without unsafe sources.
21. [ ] **PWA Installability Verified**: Web App Manifest resolves cleanly on canonical origin.
22. [ ] **Canonical SEO Tags Verified**: `<link rel="canonical">` matches canonical origin.
23. [ ] **Health & Readiness Endpoints Verified**: `/api/health` and `/api/ready` return 200 OK.
24. [ ] **Traffic Gate State Confirmed**: Traffic gate remains closed during initial verification.
25. [ ] **Executive & Platform Sign-Off**: Written authorization for traffic gate opening.
