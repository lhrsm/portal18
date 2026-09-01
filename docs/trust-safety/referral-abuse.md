# Portal18 — Referral Fraud Detection & Graph Intelligence

> [!NOTE]
> **CYCLE DETECTION | REWARD HOLD | GRAPH ANOMALIES**

---

## 1. Padrões de Abuso no Programa de Indicação

1. **Auto-Indicação e Contas Vinculadas**:
   - Criação de contas secundárias utilizando o mesmo dispositivo ou padrão de sessão para resgatar créditos de indicação.
2. **Ciclos Fechados de Indicação ($A \rightarrow B \rightarrow C \rightarrow A$)**:
   - Detecção de grafos circulares configurando conluio de qualificação mútua.
3. **Retenção Preventiva de Recompensa (`reward_hold`)**:
   - Quando um padrão anômalo é detectado, a recompensa entra em status de retenção (`risk_hold`) para validação humana sem quebrar a assinatura ou conta do usuário.
