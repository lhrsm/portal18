# Portal18 — Domain & DNS Migration Change Plan

> [!IMPORTANT]
> **CHANGE CONTROL | ROLLBACK PROCEDURES | PROPAGATION VERIFICATION**

---

## 1. Migration Protocol & Change Window

1. **Pre-Migration Checklist**:
   - Confirm domain ownership at registrar.
   - Lower DNS TTL to 300 seconds (5 min) at least 24 hours prior to migration.
   - Prepare edge routing targets and SSL certificates.
2. **Execution Steps**:
   - Point Apex `@` and `www` CNAME records to production edge infrastructure.
   - Configure SPF, DKIM, and DMARC TXT records.
   - Issue automated Let's Encrypt / Managed TLS certificates.
   - Update `NEXT_PUBLIC_SITE_URL` in production environment settings.
   - Update Supabase Auth Site URL and Google OAuth Authorized Redirect URIs.
3. **Rollback Procedure**:
   - If TLS issuance or edge routing fails after 30 minutes, revert DNS records to standby holding page.
