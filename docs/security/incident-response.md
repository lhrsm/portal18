# Procedimento Operacional de Resposta a Incidentes (Incident Response)

## 1. Fluxo de Resposta a Incidentes de Segurança

```text
DETECT → CONTAIN → INVESTIGATE → MITIGATE → RECOVER → POSTMORTEM
```

### 1.1 Detecção (Detect)
- Monitoramento de telemetria, logs de erro, taxas de falha em webhooks e fila de eventos críticos (`security_events`).
- Notificações de anomalias no painel `/admin/security`.

### 1.2 Contenção (Contain)
- **Ativação de Kill Switches**: Desativação imediata de uploads (`disable_uploads`), cadastros (`disable_signup`) ou login (`disable_login_except_admin`).
- **Revogação em Massa de Sessões**: Bloqueio preventivo de sessões suspeitas via RPC `revoke_all_other_sessions`.
- **Publicação de Status**: Registro de incidente no `/admin/security` com aviso público em `/status`.

### 1.3 Investigação (Investigate)
- Análise de correlações via `correlation_id` e identificadores sanitizados.
- Verificação de logs de auditoria (`audit_logs`) e trilhas de alteração de privilégio.

### 1.4 Mitigação (Mitigate)
- Aplicação de patch de código ou ajuste em regras de RLS / Edge Functions.
- Ajuste de regras de rate limiting e limites de risco no Risk Engine.

### 1.5 Recuperação (Recover)
- Restauração de serviços desativados via desligamento dos Kill Switches.
- Comunicação de resolução para os usuários na página `/status`.

### 1.6 Postmortem (Postmortem)
- Elaboração de relatório técnico sem PII documentando causa raiz, impacto e ações preventivas futuras.
