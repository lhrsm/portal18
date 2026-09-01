# Portal18 — Email Provider Readiness & Mock Driver

> [!WARNING]
> **PORTAL18_EMAIL_KILL_SWITCH = ACTIVE | ZERO REAL EXTERNAL EMAILS**

---

## 1. Estado Atual da Infraestrutura de E-mail

1. **Simulador Interno (Test Driver)**:
   - Todas as intenções de envio de e-mail são processadas pelo driver simulado `internal_mock`.
   - Nenhuma conexão externa de SMTP, SES ou Resend é disparada enquanto as credenciais oficiais não forem validadas em produção.
2. **Adapters Preparados**:
   - `resend`: Adapter pronto para integração via API Key.
   - `ses`: Adapter preparado para envio via Amazon SES.
   - `smtp`: Adapter legado para servidores SMTP padrão.
