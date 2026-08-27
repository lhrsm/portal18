# Checklist de Ativação em Produção (Production Activation Checklist)

## Ordem Rigorosa de Ativação (Etapas 1 a 17)

```text
1. Provisionar Projeto Supabase Dedicado (Região sa-east-1 / São Paulo)
2. Executar Migrations do Banco (00001 a 00014) via CLI com pre-flight check
3. Validar 100% das Políticas de RLS em todas as tabelas
4. Criar e validar Buckets de Storage (uploads, kyc-documents, exports, ticket-attachments)
5. Configurar Supabase Auth (Site URL, Redirect URLs, PKCE, MFA)
6. Fazer deploy das Edge Functions e configurar Secrets de servidor
7. Validar e ativar Jobs agendados seguros
8. Deploy do Frontend Next.js (App Router, Turbopack)
9. Configurar Domínio Oficial, DNS e Certificado SSL/HTTPS
10. Validar Entregabilidade de E-mail Transacional (SPF, DKIM, DMARC)
11. Escalar Equipe de Moderação Humana e Treinamento do Runbook
12. Homologar Provedor de Identidade e Idade 18+ (KYC)
13. Iniciar Fase de Closed Beta (Acesso restrito / Testes controlados)
14. Concluir Credenciamento Comercial com Adquirente Especializado no Segmento Adulto
15. Ativar Pagamentos e Planos de Assinatura (payments_enabled = true)
16. Ativar Recursos de Impulsionamento e Destaques Regionais
17. Lançamento Comercial Aberto ao Público Geral
```

---

## 1. Portão Supabase
- [ ] Projeto Supabase exclusivo de produção provisionado (sem compartilhar com dev).
- [ ] Conexão e variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` preenchidas no ambiente.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada exclusivamente no backend seguro.
- [ ] Migrations 00001 a 00014 aplicadas sem erros e sem desvio de schema.
- [ ] Backup PITR / snapshots diários confirmados e ativos no Supabase.
- [ ] Rotina externa de backup de objetos de storage validada.

---

## 2. Portão de Autenticação e Segurança
- [ ] URL do site configurada no Supabase Auth.
- [ ] Redirect allowlist restrita exclusivamente ao domínio de produção.
- [ ] MFA obrigatório ativado para todos os perfis administrativos (`super_admin`, `admin`, `moderator`, `compliance`).
- [ ] Rotina segura de bootstrap do primeiro `super_admin` executada com sucesso.

---

## 3. Portão de Conteúdo e Moderação
- [ ] Moderação humana 100% ativa antes da aprovação de qualquer anúncio.
- [ ] Equipe de moderação designada para monitoramento contínuo da fila crítica de denúncias.
- [ ] Termos de Uso, Política de Privacidade e Trust Center publicados.

---

## 4. Portão Comercial e Financeiro
- [ ] Aprovação formal do merchant com adquirente especializado no segmento adulto obtida por escrito.
- [ ] Webhook de pagamentos configurado com chave HMAC de produção.
- [ ] Ativação da flag `payments_enabled = true` somente após testes bem-sucedidos em sandbox do merchant.
