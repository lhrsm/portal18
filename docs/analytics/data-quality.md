# Portal18 — Analytics Data Quality & Bot Exclusion Policy

> [!IMPORTANT]
> **BOT FILTERING | SELF-VIEW EXCLUSION | ADMIN-VIEW EXCLUSION | STRICT DEDUPLICATION**

---

## 1. Filtros de Integridade de Dados

1. **Self-View Exclusion**:
   - Visualizações originadas pelo próprio anunciante autenticado em seu perfil são identificadas e **excluídas das métricas de visitantes**.
2. **Admin-View Exclusion**:
   - Acessos de moderadores e administradores para auditoria ou aprovação de conteúdo não são contabilizados no funil comercial.
3. **Bot & Crawler Exclusion**:
   - Requisições provenientes de crawlers e user-agents automatizados (ex: Googlebot, Bingbot) não disparam eventos de conversão.
4. **Deduplicação de Eventos**:
   - Impressões e visualizações na mesma sessão de navegação são deduplicadas através de janela temporal deslizante.
