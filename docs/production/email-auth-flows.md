# Portal18 — Authentication Email Dependency & UX Truthfulness

> [!IMPORTANT]
> **AUTH JOURNEY AUDIT | ZERO FALSE SUCCESS CLAIMS | ENUMERATION RESILIENCE**

---

## 1. Authentication Email Journeys Matrix

| Journey | Email Mechanism | Triggering Endpoint | Dependency | Impact if Email Provider Inactive |
|---|---|---|---|---|
| **User Registration** | Supabase Auth Native | `/register` | SMTP / Resend in Supabase | User cannot confirm email if confirmation required |
| **Password Recovery** | Supabase Auth Native | `/forgot-password` | SMTP / Resend in Supabase | User cannot receive password reset link |
| **Email Address Change** | Supabase Auth Native | `/account/security` | SMTP / Resend in Supabase | Confirmation link not delivered |
| **Security Login Alerts** | Portal18 Notification Engine | Internal Auth Trigger | `notification_events` | Queued / Handled by fail-closed policy |
| **Account Sanctions** | Portal18 Notification Engine | Admin T&S Moderation | `notification_events` | In-app notification active; email deferred |

---

## 2. UX Truthfulness Invariant

While `PORTAL18_EMAIL_KILL_SWITCH = true`:
- The application never falsely guarantees external email delivery to users.
- Public responses for password reset return privacy-safe feedback: *"Se existir uma conta associada a esse e-mail, enviaremos as instruções de recuperação."*
- Admin dashboards clearly label mock deliveries as `disabled_by_policy` / `mock_mode`.
