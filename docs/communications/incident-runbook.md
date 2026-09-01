# Portal18 — Communication & Email Outage Runbook

> [!CAUTION]
> **INCIDENT PROTOCOL FOR EMAIL / PUSH OUTAGES**

---

## 1. Procedimento em Caso de Falha de Provedor

1. **Falha de Conectividade ou Rejeição em Massa**:
   - Os disparos com falha transitória recebem status `retry_scheduled` com recuo exponencial (15 min, 1h, 4h).
   - Erros permanentes (`invalid_recipient`, `hard_bounce`) movem a entrega para status `failed` sem novas tentativas.
2. **Desligamento de Emergência (Kill Switch)**:
   - Se houver suspeita de disparo indevido ou comprometimento de chaves, definir `PORTAL18_EMAIL_KILL_SWITCH=true` para interromper imediatamente todos os envios externos.
