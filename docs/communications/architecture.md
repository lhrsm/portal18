# Portal18 — Centralized Communications & Messaging Architecture

> [!NOTE]
> **CANONICAL EVENT DISPATCH | MULTI-CHANNEL FAN-OUT | ZERO SPAM**

---

## 1. Princípios Arquiteturais

1. **Evento Canônico Único**:
   - Todas as notificações disparam um registro canônico (`notification_events`) desacoplado dos canais de entrega (`in_app`, `email`, `push`).
2. **Separação Rigorosa**:
   - **Transacional vs Marketing**: Alertas de segurança, cobrança e moderação operam com prioridade e regras de entrega distintas de campanhas comerciais.
   - **Comunicação Obrigatória**: Eventos de segurança (troca de senha, sanção de conta, login anômalo) não podem ser desativados pelo usuário no canal In-App.
3. **Isolamento de Dados Sensíveis**:
   - Dados de verificação etária (Age Assurance) e documentos de identificação (KYC) são **100% excluídos** de fluxos de mensageria e templates de marketing.
