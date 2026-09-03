# Portal18 — Domain & DNS Migration Change Plan

> [!IMPORTANT]
> **CHANGE CONTROL | ROLLBACK PROCEDURES | PROPAGATION VERIFICATION**

---

## 1. Migration Protocol & Change Window

1. **Pre-Migration Checklist**:
   - Confirm domain ownership at registrar.
   - Lower DNS TTL per operator change window.
   - Prepare edge routing targets and SSL certificates.
2. **Execution Steps**:
   - Point Apex `@` and `www` records per hosting platform requirements.
   - Configure SPF, DKIM, and DMARC TXT records per provider instructions.
   - Issue managed TLS certificate via hosting provider.
   - Update `NEXT_PUBLIC_SITE_URL` in production environment settings.
   - Update Supabase Auth Site URL and Google OAuth Authorized Redirect URIs.
3. **Rollback Procedure**:
   - If TLS issuance or edge routing fails during change window, revert DNS records to standby holding target.
