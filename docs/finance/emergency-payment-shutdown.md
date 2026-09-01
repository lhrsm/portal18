# Portal18 — Emergency Payment Shutdown Runbook

> [!CAUTION]
> **EMERGENCY PAYMENT SHUTDOWN PROCEDURE**

---

## 1. Gatilhos para Desligamento Emergencial

1. Detecção de ataque de fraude em massa ou anomalia severa de chargebacks.
2. Indício de comprometimento de chaves de API ou segredos bancários de PSP.
3. Instabilidade crítica ou comportamento inconsistente no gateway adquirente.
4. Determinação judicial ou notificação regulatória urgente.

---

## 2. Procedimento Operacional de Emergência

1. **Ativação Instantânea do Kill Switch**:
   - Definir `PORTAL18_PAYMENT_KILL_SWITCH=true` no ambiente de produção.
   - O `PaymentProviderResolver` redirecionará imediatamente 100% das novas intenções de pagamento para o mock de bloqueio, impedindo qualquer nova cobrança externa.
2. **Revogação e Rotação de Credenciais**:
   - Inativar as credenciais comprometidas no portal administrativo do gateway.
   - Gerar novos tokens de autenticação e segredos de assinatura de webhook HMAC.
3. **Auditoria e Conciliação do Intervalo**:
   - Executar varredura na tabela `payment_reconciliation_logs` para identificar transações pendentes ou divergentes durante o incidente.
   - Notificar as equipes jurídica, de compliance e de atendimento ao cliente.
