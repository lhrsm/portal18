# RUNBOOK OPERACIONAL: ATIVAÇÃO DE PROVEDOR DE AGE ASSURANCE (ECA DIGITAL)

**Plataforma:** Portal Nacional 18+
**Responsável Técnico:** Equipe de Segurança & Compliance
**Data:** 28 de Agosto de 2026
**Ambiente:** Homologação $\rightarrow$ Produção

---

## 1. OBJETIVO DO PROCEDIMENTO

Instruir a equipe operacional sobre as etapas necessárias para transição do ambiente de **Sandbox/Simulação** para **Produção Real** do provedor de verificação de idade de visitantes (*Verifica ID* ou *Sumsub Age Verification*).

---

## 2. ETAPAS PRÉ-REQUISITO (COMPLIANCE & COMERCIAL)

1. **Aprovação Comercial & Underwriting:**
   - Formalizar contratação com o fornecedor credenciado com escopo explícito para catálogo publicitário adulto.
2. **Assinatura do DPA (LGPD):**
   - Garantir cláusulas de responsabilidade onde o provedor atua como Operador de Dados e o Portal18 recebe apenas o sinal técnico (sem biometria ou cópia de documentos).
3. **Definição de Custos:**
   - Confirmar tarifas por primeira verificação e tarifa reduzida (ou gratuita) por checagem de credencial reutilizada.

---

## 3. CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE EM PRODUÇÃO

No painel de gerenciamento do servidor / Vercel Production:

```env
# 1. Provedor Ativo ('verifica_id' | 'sumsub_age' | 'mock_sandbox')
AGE_VERIFICATION_PROVIDER="verifica_id"

# 2. URLs e Credenciais de API
AGE_VERIFICATION_API_URL="https://api.verificaid.com.br"
AGE_VERIFICATION_CLIENT_ID="<CLIENT_ID_FORNECIDO_PELO_PROVEDOR>"
AGE_VERIFICATION_CLIENT_SECRET="<CLIENT_SECRET_CONFIDENCIAL>"
AGE_VERIFICATION_WEBHOOK_SECRET="<CHAVE_SECRETA_HMAC_DO_WEBHOOK>"

# 3. Chave Secreta para Assinatura das Sessões do Portal18
AGE_VERIFICATION_SESSION_SECRET="<CHAVE_CRIPTOGRAFICA_DE_32_BYTES_MINIMO>"

# 4. Ambiente e Feature Flags
AGE_VERIFICATION_ENVIRONMENT="production"
AGE_VERIFICATION_ENABLED="true"
```

> [!CAUTION]
> NUNCA expor variáveis de credenciais como `NEXT_PUBLIC_`. Toda comunicação com a API do provedor e validação de assinatura deve ocorrer exclusivamente no ambiente server-side.

---

## 4. CADASTRO DE WEBHOOKS NO PAINEL DO PROVEDOR

Configurar o endpoint seguro de notificações no painel do fornecedor:

- **URL de Ingress:** `https://portal18.com.br/api/webhooks/age-verification`
- **Método HTTP:** `POST`
- **Autenticação:** Assinatura HMAC-SHA256 no header `X-Provider-Signature`
- **Eventos Monitorados:**
  - `verification.approved` (Maioridade confirmada)
  - `verification.rejected` (Menor de 18 anos ou falha biométrica)
  - `credential.revoked` (Revogação solicitada pelo usuário)
  - `credential.expired` (Expiração do ciclo de garantia)

---

## 5. TESTES DE HOMOLOGAÇÃO PÓS-CONFIGURAÇÃO (SMOKE TEST)

Executar a bateria de testes operacionais:
1. **Visitante Novo (18+):** Iniciar verificação $\rightarrow$ Redirecionar ao provedor $\rightarrow$ Aprovar $\rightarrow$ Validar emissão do cookie `portal18_age_session` $\rightarrow$ Confirmar liberação imediata da galeria e contatos.
2. **Visitante Recorrente (Reutilização):** Limpar cookie local $\rightarrow$ Clicar em "Já Sou Verificado" $\rightarrow$ Provedor reconhece credencial válida $\rightarrow$ Sessão emitida sem repetir biometria.
3. **Tentativa de Acesso por Menor:** Provedor retorna resultado `under_18` $\rightarrow$ Portal bloqueia acesso e exibe mensagem neutra de restrição.
4. **Queda do Provedor (Fail-Closed):** Simular falha de rede ou timeout $\rightarrow$ O Portal18 deve manter o conteúdo sensível em Modo Seguro (nunca liberar por fallback).

---

## 6. AUDITORIA E OBSERVABILIDADE

Acompanhar as métricas no **Admin Security Center** ([`/admin/security`](file:///d:/Antigravity/Portal%20Adulto/src/app/admin/security)):
- Taxa de sucesso de verificações iniciadas
- Proporção de reutilização de credenciais
- Latência média de redirecionamento e callback
- Zero erros de integridade ou chamadas com falha de assinatura HMAC.
