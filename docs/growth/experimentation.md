# Portal18 — Privacy-Preserving A/B Experimentation

> [!NOTE]
> **DETERMINISTIC ASSIGNMENT | ZERO TRACKERS | STRICT GUARDRAILS**

---

## 1. Diretrizes de Testes A/B

1. **Atribuição Determinística por Hash**:
   - As variantes (`control`, `variant_a`, etc.) são calculadas via hash da chave do experimento com o identificador de sessão.
   - Não requer cookies de terceiros ou pixels externos.
2. **Métricas Primárias e Guardrails**:
   - Cada teste define previamente sua hipótese e métrica alvo (ex.: `contact_intent`, `advertiser_started`).
   - **Guardrails invioláveis**: Testes A/B nunca podem flexibilizar o Age Gate, ocultar preços reais ou ignorar requisitos de segurança.
