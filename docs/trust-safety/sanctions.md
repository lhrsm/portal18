# Portal18 — Tiered Sanctions & Enforcement Framework

> [!NOTE]
> **PROPORTIONAL ENFORCEMENT | SEPARATION OF REASONS | IDEMPOTENT APPLICATION**

---

## 1. Níveis de Sanção

1. **Advertência (`warning`)**: Notificação formal de infração aos Termos de Uso sem restrição de funcionalidades.
2. **Restrição de Funcionalidade (`feature_restriction`)**: Limitação específica de ações (ex.: envio de mensagens, comentários).
3. **Bloqueio de Uploads (`upload_restriction`)**: Bloqueio de novos uploads de fotos/vídeos.
4. **Retenção de Troca de Contato (`contact_change_hold`)**: Bloqueio temporário de alteração de WhatsApp/telefone para prevenir sequestro de perfil.
5. **Bloqueio Temporário (`temporary_account_hold`)**: Suspensão preventiva de 1 a 30 dias enquanto um caso é investigado.
6. **Despublicação de Perfil (`profile_unpublished`)**: Remoção temporária da listagem pública sem exclusão de dados.
7. **Suspensão de Conta (`account_suspended`)**: Desativação de acesso com preservação de registros para auditoria legal.
8. **Encerramento Definitivo (`account_terminated`)**: Ação extrema executada apenas por Super Admin com evidências completas.

---

## 2. Separação de Motivo Interno e Mensagem Pública

- **`reason_internal`**: Detalhes técnicos, sinais associados e histórico para fins de auditoria.
- **`reason_public`**: Mensagem sanitizada em linguagem acessível exibida ao usuário, sem revelar heurísticas de evasão.
