# Portal18 — Email Deliverability, Bounces & Suppression Policy

> [!IMPORTANT]
> **REPUTATION MANAGEMENT | BOUNCE & COMPLAINT RECOVERY | ZERO SENSITIVE CONTENT**

---

## 1. Bounce & Complaint Processing

- **Hard Bounce (5.x.x)**: Permanent delivery failure (e.g., mailbox does not exist). Address is **immediately added to the suppression list**.
- **Soft Bounce (4.x.x)**: Transient failure (e.g., mailbox full, rate limited). Queued for retry with exponential backoff (up to 3 attempts over 24 hours).
- **Spam Complaint (FBL)**: Recipient marked email as spam. **Immediate suppression from marketing and non-critical campaigns**.

---

## 2. Lockscreen & Subject Privacy

To ensure complete visitor and user privacy on mobile lockscreens:
- **Discreet Subjects**: Subjects use generalized phrasing ("Atualização importante da sua conta", "Confirme seu endereço de e-mail").
- **Prohibited in Subjects / Previews**:
  - Explicit sexual terms or adult category names.
  - Verification video or selfie review details.
  - Risk scores, ban reasons, or moderation heuristic logs.
  - Advertiser stage names when associated with private personal emails.
