# Portal18 — Multi-Channel Notification Policy Engine

> [!IMPORTANT]
> **PRIORITY MATRIX | MANDATORY CHANNELS | DEDUPLICATION**

---

## 1. Matriz de Prioridade e Canais

| Categoria | Prioridade | In-App | E-mail | Push |
|---|---|---|---|---|
| **Segurança & Fraude** | `critical` | **Obrigatório** | Recomendado | Opcional |
| **Sanção & Trust & Safety** | `high` | **Obrigatório** | Enviado | Opcional |
| **Moderação de Perfil/Mídia** | `high` | Ativo | Ativo | Opcional |
| **Faturamento & Cobrança** | `high` | Ativo | Ativo | Opcional |
| **Avaliações & Reviews** | `normal` | Ativo | Conforme Pref | Opcional |
| **Indicações (Referrals)** | `normal` | Ativo | Conforme Pref | Opcional |
| **Marketing & CRM** | `low` | Conforme Consent | Conforme Consent | Conforme Consent |

---

## 2. Idempotência e Deduplicação

- Cada evento pode possuir uma `dedupe_key` única (ex.: `billing_failed:cycle-123:attempt-1`).
- Requisições repetidas no intervalo de 24h retornam o evento existente sem duplicar e-mails ou pushes.
