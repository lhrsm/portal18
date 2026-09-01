# Portal18 — Production Go/No-Go Decision Matrix

> [!IMPORTANT]
> **DECISÃO ATUAL: BLOCKED / NOT_ELIGIBLE | KILL SWITCH ACTIVE**

---

## 1. Matriz de Avaliação dos 8 Portões de Governança

| Portão | Status | Descrição / Requisitos |
|---|---|---|
| **1. TECHNICAL** | `PASS` | Drivers de homologação certificados, webhooks com HMAC, idempotência em pedidos e estornos. |
| **2. SECURITY** | `PASS` | Zero segredos em frontend, zero armazenamento de PAN/CVV, Age Assurance isolado. |
| **3. COMMERCIAL** | `PENDING_EXTERNAL_REVIEW` | Dossiê de 14 seções pronto; aguardando aprovação formal de underwriting das credenciadoras. |
| **4. COMPLIANCE** | `PENDING_EXTERNAL_REVIEW` | Regras de bandeiras e moderação de conteúdo no Trust Center em revisão contratual. |
| **5. LEGAL** | `PENDING_EXTERNAL_REVIEW` | Revisão de Termos de Uso, CDC (Direito de Arrependimento) e contratos de anunciantes. |
| **6. ACCOUNTING** | `PENDING_EXTERNAL_REVIEW` | Validação contábil de enquadramento tributário e procedimentos de fechamento. |
| **7. FISCAL** | `NOT_CONFIGURED` | Emissão de NFS-e inativa e provedor fiscal municipal não configurado. |
| **8. OPERATIONS** | `PASS` | Runbooks operacionais de estorno, chargeback, conciliação e desligamento de emergência. |

---

## 2. Critérios Mandatórios para Go Produtivo

Para que o status geral mude para `READY`:
- **TODOS** os 8 portões devem atingir o status `PASS`.
- Uma ação deliberada de **Super Admin** deve alterar a variável `PORTAL18_PAYMENT_KILL_SWITCH=false` no servidor, com registro formal na trilha de auditoria.
