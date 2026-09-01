# Portal18 — Safety Incident Response Runbook

> [!CAUTION]
> **CRITICAL INCIDENT PROTOCOL: ZERO-TOLERANCE & MANDATORY ESCALATION**

---

## 1. Classificação de Incidentes Críticos

1. **Suspeita de Menor de Idade (`suspected_minor`)**:
   - Prioridade crítica imediata (SLA 4h).
   - Bloqueio preventivo instantâneo de veiculação pública do perfil.
   - Notificação da equipe jurídica e preservação de metadados para autoridades competentes.
2. **Conteúdo Não Consensual (`non_consensual_content`)**:
   - Despublicação imediata das mídias sinalizadas.
   - Inclusão do hash perceptual (`pHash` / `sha256`) na tabela `blocked_media_fingerprints` para impedir reupload.
3. **Campanha Coordenada de Falsidade Ideológica / Impersonation**:
   - Abertura de caso de investigação com bloqueio de troca de contato.
   - Exigência de novo vídeo de desafio de autenticidade dinâmico.
