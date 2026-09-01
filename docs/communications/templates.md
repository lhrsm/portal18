# Portal18 — Versioned Templates & Sanitization

> [!NOTE]
> **ALLOWLISTED VARIABLES | STRICT HTML SANITIZATION | VERSION INTEGRITY**

---

## 1. Regras de Renderização e Segurança

1. **Variáveis Permitidas**:
   - `{{display_name}}`: Nome de exibição do usuário.
   - `{{plan_name}}`: Nome do plano de assinatura.
   - `{{activity_description}}`: Descrição da atividade de segurança.
   - `{{period_end}}`: Data de término do período contratual.
2. **Sanitização de Código Malicioso**:
   - A função `templateEngine.render()` remove incondicionalmente tags `<script>` e `<iframe>` de qualquer template.
3. **Imutabilidade de Versões**:
   - Alterações em templates existentes geram uma nova versão incremental (`version + 1`), garantindo que o histórico de auditoria permaneça fiel ao que foi enviado.
