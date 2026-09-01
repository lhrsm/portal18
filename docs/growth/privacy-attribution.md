# Portal18 — Privacy-First Attribution & UTM Governance

> [!NOTE]
> **FIRST-PARTY TRACKING | ZERO PII | LGPD GOVERNANCE**

---

## 1. Diretrizes de Rastreamento e Atribuição

1. **Minimização de Dados em UTMs**:
   - Parâmetros `utm_source`, `utm_medium` e `utm_campaign` são sanitizados e limitados a 100 caracteres.
   - Nomes de usuários, e-mails, dados de pagamento e documentos são **estritamente proibidos** em parâmetros UTM.
2. **Isolamento de Dados Sensíveis**:
   - Dados de Age Assurance, biometria e moderação não são utilizados para segmentação ou retargeting.
