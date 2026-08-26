# Procedimento de Rotação de Segredos e Chaves de API

## 1. Mapeamento de Segredos
- `SUPABASE_SERVICE_ROLE_KEY`: Acesso administrativo de infraestrutura de backend.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública para cliente frontend com RLS obrigatório.
- `WEBHOOK_SIGNING_SECRETS`: Chaves HMAC para validação de webhooks de KYC, pagamentos e e-mails.

## 2. Protocolo de Rotação Sem Downtime (Zero Downtime Rotation)
1. **Geração do Novo Segredo**: Gerar credencial criptograficamente segura no provedor upstream.
2. **Atualização no Vault / Variáveis de Ambiente**: Injetar chave secundária nas Edge Functions.
3. **Período de Transição com Chaves Duplas (Dual Key Validation)**: Aceitar assinaturas validadas com chave nova ou antiga por 24 horas.
4. **Desativação da Chave Antiga**: Revogar a chave antiga no painel do provedor e verificar ausência de erros nos logs de telemetria.
5. **Auditoria**: Registrar evento em `audit_logs` documentando a rotação.
