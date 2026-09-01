# Portal18 — Search & Recommendation Privacy Policy

> [!IMPORTANT]
> **DATA MINIMIZATION | ZERO TARGETING AD PROFILES | NO SENSITIVE ATTRIBUTE INFERENCE**

---

## 1. Diretrizes de Privacidade e LGPD

1. **Zero Profiling Oculto**:
   - O Portal18 não constrói perfis psicológicos ou de segmentação de marketing para venda a terceiros.
   - Nenhuma informação digitada na barra de busca é associada de forma persistente e identificável à conta do usuário.
2. **Minimização de Dados em Analytics**:
   - Consultas de busca são agregadas por termo normalizado na tabela `search_query_aggregates`, registrando apenas contagens gerais de volume e zero-resultados.
   - Nenhum IP, User-Agent ou User ID é persistido em logs públicos de busca.
3. **Buscas Salvas Privadas**:
   - Buscas salvas em `saved_searches` pertencem exclusivamente ao usuário autenticado (protegidas por RLS).
   - Anunciantes nunca têm acesso à lista de usuários que salvaram buscas em sua região ou categoria.
4. **Isolamento de Sinais Sensíveis**:
   - Dados de Age Assurance, KYC e Sanções nunca são passados como parâmetros para o motor de busca ou recomendação.
