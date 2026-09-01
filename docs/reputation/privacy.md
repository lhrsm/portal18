# Portal18 — Privacy & Sensitive Data Isolation in Trust Signals

> [!IMPORTANT]
> **ISOLATION OF RISK SIGNALS | NO BIOMETRIC DATA PUBLIC | REVIEWER ANONYMITY | LGPD COMPLIANCE**

---

## 1. Diretrizes de Privacidade e Proteção de Dados

1. **Isolamento de Dados Sensíveis e Internos**:
   - Sinais de risco da Phase 29, notas internas da equipe de moderação, motivos de rejeição/sanção e histórico de disputas são **estritamente excluídos** do payload público retornado por `get_public_advertiser_trust`.
   - Dados brutos de documentos KYC (CPF, RG, comprovante de residência, biometria facial) jamais são expostos em endpoints públicos.
2. **Anonimização de Avaliadores**:
   - Avaliações de clientes exibem apenas rótulos neutros como `"Usuário Autenticado"`, garantindo total sigilo de identidade civil, e-mail e dados de contato do autor da avaliação.
3. **Preservação do Age Gate**:
   - Os sinais de confiança públicos podem ser exibidos para visitantes não autenticados, mas fotos explícitas e contatos diretos permanecem 100% protegidos atrás do modal obrigatório de Age Assurance.
4. **Direito ao Esquecimento e Retenção**:
   - Perfis excluídos (`deleted_at IS NOT NULL`) têm seus sinais públicos imediatamente suspensos.
   - Snapshots históricos permanecem acessíveis apenas internamente pela equipe de segurança para fins de cumprimento de obrigações legais e prevenção a fraudes.

