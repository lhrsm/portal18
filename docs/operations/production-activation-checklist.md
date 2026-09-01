# CHECKLIST & PROTOCOLO DE ATIVAÇÃO EM PRODUÇÃO (GO-LIVE)

**Projeto:** Portal Nacional de Entretenimento Adulto 18+
**Versão:** 2.0 (Pós-Fase 22)
**Data:** 27 de Agosto de 2026
**Status Operacional Atual:** `CLOSED BETA / GO WITH RESTRICTIONS`

---

## 1. ORDEM RIGOROSA DE ATIVAÇÃO (ETAPAS 1 A 17)

```text
1. Provisionar Projeto Supabase Dedicado (Região sa-east-1 / São Paulo) [CONCLUÍDO]
2. Executar Migrations do Banco (00001 a 00017) via CLI com pre-flight check [CONCLUÍDO]
3. Validar 100% das Políticas de RLS em todas as tabelas públicas e privadas [CONCLUÍDO]
4. Criar e validar Buckets de Storage (uploads, kyc-documents, exports, ticket-attachments) [CONCLUÍDO]
5. Configurar Supabase Auth (Site URL, Redirect URLs, PKCE, MFA) [CONCLUÍDO]
6. Fazer deploy do Frontend Next.js 16 (App Router, Turbopack, PWA) [CONCLUÍDO]
7. Configurar Domínio Oficial, DNS e Certificado SSL/HTTPS [EM ANDAMENTO / TEMPORÁRIO VERCEL.APP]
8. Validar Entregabilidade de E-mail Transacional (SPF, DKIM, DMARC) [CREDENCIAIS PENDENTES]
9. Homologar Provedor de Identidade e Idade 18+ (KYC Sumsub) [SANDBOX PRONTO / PROD PENDENTE]
10. Iniciar Fase de Closed Beta (Acesso restrito / Testes controlados) [LIBERADO]
11. Escalar Equipe de Moderação Humana e Treinamento de Runbooks de Segurança [STAFF DESIGNADO]
12. Concluir Credenciamento Comercial com Adquirente Especializado no Segmento Adulto [PENDENTE]
13. Ativar Pagamentos e Planos de Assinatura (payments_enabled = true) [KILL SWITCH ATIVO]
14. Ativar Recursos de Impulsionamento e Destaques Regionais [BLOQUEADO ATÉ PAGAMENTOS]
15. Configurar Replicação Secundária de Backups em Bucket S3 Externo [PENDENTE]
16. Validação Geral de Segurança, Headers e Testes de Carga [CONCLUÍDO]
17. Lançamento Comercial Aberto ao Público Geral [AGUARDANDO GATES COMERCIAIS]
```

---

## 2. STATUS DOS PORTÕES DE GO-LIVE

### Portão 1: Infraestrutura & Banco de Dados
- [x] Projeto Supabase conectado e validado em runtime.
- [x] Migrations 00001 a 00017 aplicadas com paridade total (Local == Remote).
- [x] 0 erros de aplicação no `supabase db lint`.
- [x] 4 buckets de storage criados e isolados com políticas RLS estritas.

### Portão 2: Segurança, Identidade & Trust & Safety
- [x] Publication Gate endurecido: somente perfis `active + public + verified` e não-deletados são exibidos.
- [x] Fluxo de suspensão instantânea com remoção de buscas, sitemaps e categorias.
- [x] Hash SHA-256 de mídias bloqueadas verificado no upload.
- [x] RBAC multinível (Super Admin, Admin, Moderator, Support, Compliance, User).
- [x] Proteção anti-lockout: o último `super_admin` não pode ser rebaixado ou excluído.
- [x] Zero segredos ou chaves privadas expostos nos bundles do cliente.

### Portão 3: Verificação de Idade & KYC (Sumsub)
- [x] Arquitetura desacoplada via `IdentityProviderFactory` e adapter `SumsubProvider`.
- [x] Sandbox 100% validado com verificação de assinatura HMAC e detecção de menores (<18 anos).
- [ ] **Pendente:** Aprovação do contrato comercial de produção com a Sumsub e inserção de credenciais de produção.
- [x] Guard ativo: `isKycProductionEnabled = false` até fornecimento de credenciais válidas.

### Portão 4: Pagamentos, Assinaturas & Faturamento
- [x] Arquitetura desacoplada via `PaymentProvider` e `billingService`.
- [x] Preços e cupons calculados exclusivamente no servidor em centavos inteiros (BRL).
- [x] Prevenção de falsos checkouts, ataques de repetição e divergência de valores na conciliação.
- [ ] **Pendente:** Contratação formal de adquirente autorizada para o segmento 18+.
- [x] Kill Switch ativo: `payments_enabled = false`, `subscriptions_enabled = false`, `promotions_enabled = false`.

### Portão 5: Comunicação & E-mail Transacional
- [x] Multi-adapter resiliente (`Resend`, `SendGrid`, `SMTP Relay` e fallback de desenvolvimento).
- [x] 15 templates transacionais neutros e discretos prontos.
- [ ] **Pendente:** Configuração de registros DNS (SPF, DKIM, DMARC) no domínio definitivo.

---

## 3. DECISÃO OPERACIONAL DE PRODUÇÃO

- **Modo Operacional:** `CLOSED BETA`
- **Decisão Final:** `GO WITH RESTRICTIONS`
- O portal está 100% estável e seguro para operação em ambiente controlado com anunciantes piloto, mantendo as travas de proteção financeiras e de verificação externa ativas até a conclusão dos contratos comerciais.
