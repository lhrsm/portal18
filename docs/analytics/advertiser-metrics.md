# Portal18 — Advertiser Metrics & Health Intelligence

> [!IMPORTANT]
> **ACTIONABLE METRICS | PERIOD COMPARISON | SMALL SAMPLE GUARDRAIL**

---

## 1. Métricas Principais

1. **Impressões de Busca**: Número de exibições do card de anúncio nos resultados de busca orgânica e páginas regionais.
2. **Visualizações de Perfil**: Quantidade de acessos únicos à página completa do anunciante.
3. **Intenções de Contato**: Contagem consolidada de cliques direcionados ao WhatsApp, telefone e canais cadastrados.
4. **Taxa de Abertura (Open Rate)**: Proporção entre visualizações e impressões.
5. **CTR de Contato**: Proporção entre intenções de contato e visualizações.

---

## 2. Guardrail de Amostra Pequena (Small Sample Guard)

Para evitar conclusões enganosas em perfis recém-cadastrados:
- Se o volume de visualizações for inferior a 5, o sistema sinaliza `insufficient_sample = true`.
- Em vez de exibir oscilações irreais (ex: "+100%"), o sistema rotula a tendência como **"estável"** e exibe orientação de acúmulo de dados.
