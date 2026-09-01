# Portal18 — Trust & Safety Case Management & Investigation Workspace

> [!IMPORTANT]
> **SLA-DRIVEN TRIAGE | CONFIDENTIAL STAFF NOTES | AUDITED CONCURRENCY**

---

## 1. Ciclo de Vida dos Casos

1. **Priorização e SLAs**:
   - **Crítica (`critical`)**: SLA de 4 horas (suspeita de menores, conteúdo não consensual, ameaça iminente).
   - **Alta (`high`)**: SLA de 12 horas (duplicação coordenada, abuso sistemático de avaliações, fraude de indicação).
   - **Normal (`normal`)**: SLA de 24 horas (anomalias de login, tentativas repetidas de verificação).
   - **Baixa (`low`)**: SLA de 48 horas (revisão de rotina).
2. **Atribuição e Concorrência**:
   - Um caso é atribuído formalmente a um operador (`assigned_to`) para evitar deliberações conflitantes simultâneas.
3. **Linha do Tempo e Notas Internas**:
   - Notas adicionadas por operadores são estritamente confidenciais e protegidas por RLS, gravadas na tabela `case_internal_notes` com trilha de auditoria imutável.
