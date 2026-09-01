# Portal18 — Programmatic SEO Governance & Combination Control

> [!IMPORTANT]
> **INDEXABILITY GATE | COMBINATION FILTER CONTROL | CANONICAL INTEGRITY**

---

## 1. Diretrizes de SEO Programático

1. **Gate de Indexabilidade**:
   - Uma landing page regional (`/acompanhantes/[estado]/[cidade]`) só é elegível para indexação quando possui no mínimo 1 perfil aprovado no inventário ativo.
   - Páginas com 0 perfis recebem a diretiva `robots: { index: false }`.
2. **Controle de Combinações de Filtros**:
   - Parâmetros de URL como `?bairro=`, `?categoria=`, `?ordenar=` não geram novas páginas indexáveis. O cabeçalho canônico aponta sempre para a rota base limpa (`/acompanhantes/[estado]/[cidade]`).
3. **Links Internos Contextuais**:
   - As páginas de cidade linkam para cidades vizinhas do mesmo estado com atividade real, evitando redes artificiais ou links órfãos.
