# Procedimento Seguro de Criação do Primeiro Super Admin (Admin Bootstrap)

## 1. Regra de Segurança Absoluta
- **NUNCA** criar endpoints públicos para atribuição de privilégios.
- **NUNCA** utilizar senhas padrão fracas ou pré-definidas (ex: `admin123`).
- **NUNCA** conceder papel administrativo automaticamente a e-mails sem verificação.

---

## 2. Roteiro de Provisionamento do Primeiro Super Admin

### Etapa 1: Cadastro da Conta Autenticada
1. O responsável operacional realiza o cadastro normal via `/register` utilizando o e-mail corporativo oficial seguro.
2. Confirmação do e-mail é concluída com sucesso.
3. O identificador único do usuário (`auth.uid()`) é obtido.

### Etapa 2: Elevação via CLI / Script Server-Side
A partir do servidor seguro (ou terminal administrativo com a chave de serviço `SUPABASE_SERVICE_ROLE_KEY`), executar a concessão deliberada:

```sql
-- Executado no SQL Editor do Supabase ou via script administrativo restrito
INSERT INTO public.user_roles (profile_id, role)
SELECT id, 'super_admin'
FROM public.profiles
WHERE email = 'admin-titular@portalnacional.com.br'
ON CONFLICT (profile_id, role) DO NOTHING;

-- Registro no Log de Auditoria
INSERT INTO public.audit_logs (actor_profile_id, action, target_type, target_id, metadata)
SELECT id, 'bootstrap_super_admin', 'user_roles', id::text, jsonb_build_object('reason', 'Initial production bootstrap')
FROM public.profiles
WHERE email = 'admin-titular@portalnacional.com.br';
```

### Etapa 3: Ativação Imediata do MFA (TOTP)
1. No primeiro login em `/account/security`, o novo `super_admin` é imediatamente bloqueado com a exigência de configuração de MFA (TOTP).
2. O aplicativo autenticador (Google Authenticator, 1Password, Authy) é escaneado e ativado.
3. Os 8 recovery codes são salvos em cofre de senhas institucional.
