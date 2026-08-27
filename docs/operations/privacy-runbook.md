# Manual Operacional de Privacidade e LGPD (Privacy Runbook)

## 1. Princípios e Direitos do Titular (LGPD)
O Portal Nacional garante o exercício pleno dos direitos previstos na Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
- Confirmação de existência de tratamento e acesso aos dados;
- Correção de dados incompletos ou inexatos;
- Portabilidade / Exportação de dados;
- Eliminação e anonimização de dados pessoais;
- Revogação de consentimentos.

---

## 2. Fluxo de Exportação de Dados (Portabilidade)
1. **Solicitação do Titular**: Realizada em `/account/privacy`.
2. **Processamento Assíncrono**: Job transacional coleta perfil, consentimentos, favoritos, histórico e faturas do titular.
3. **Geração de Pacote Seguro**: Arquivo JSON criptografado salvo em bucket privado (`exports`).
4. **Download Seguro**: Disponibilizado ao titular via Signed URL com validade de 7 dias.
5. **Expurgo Automático**: Após 7 dias, o arquivo temporário é purgado do storage pelo job de retenção.

---

## 3. Fluxo de Exclusão de Conta
1. **Período de Tolerância (Grace Period de 7 Dias)**:
   - O perfil público é imediatamente **despublicado e ocultado** do catálogo e buscas.
   - O titular pode cancelar a solicitação dentro do prazo de 7 dias via `/account/privacy`.
2. **Exclusão Definitiva Pós-Prazo**:
   - Dados pessoais não essenciais (favoritos, histórico, preferências, mídias) são apagados permanentemente.
   - Registros financeiros e fiscais são retidos anonimizados pelo prazo legal de guarda obrigatória (Art. 16 da LGPD).
3. **Legal Hold (Trava Legal)**:
   - Se houver registro ativo em `legal_holds` (investigação de menor, fraude ou ordem judicial), a exclusão física é bloqueada até liberação formal do Encarregado de Proteção de Dados (DPO).
