# Arquitetura de Segurança em Camadas — Portal Nacional 18+

## 1. Princípio Fundamental de Defesa em Profundidade
O sistema adota uma postura de segurança multicamadas onde nenhum mecanismo isolado é considerado suficiente:

```text
Supabase Auth + RLS + Server-Side Authorization + Rate Limiting + Risk Engine + Audit Logging + Telemetry
```

## 2. Componentes de Proteção

### 2.1 Autenticação & MFA
- Tokens JWT de curta duração gerenciados via cookies HttpOnly com flags `Secure` e `SameSite=Lax`.
- Suporte a segundo fator de autenticação (MFA / 2FA via TOTP RFC 6238).
- MFA obrigatório para funções administrativas (`super_admin`, `admin`, `moderator`).
- Códigos de recuperação (recovery codes) criptografados com uso único.

### 2.2 Controle de Acesso & RLS
- 100% das tabelas do banco de dados protegidas com Row Level Security (RLS).
- Políticas explícitas para leitura, inserção, atualização e exclusão baseadas em `auth.uid()` e funções de apoio `is_staff()` e `is_admin()`.
- Funções com privilégio `SECURITY DEFINER` possuem explicitamente `SET search_path = public` e validações estritas de identidade.

### 2.3 Rate Limiting & Proteção contra Brute Force
- Limitação de taxa deslizante em todos os endpoints sensíveis (Login, Registro, Recuperação de Senha, MFA, Upload, Suporte e Denúncias).
- Cabeçalhos padronizados de resposta (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`).

### 2.4 Motor de Risco (Risk Engine)
- Detecção contínua de anomalias (tentativa de takeover, stuffing de credenciais, abuso de upload, reenvio de mídias bloqueadas).
- Pontuação dinâmica com decaimento temporal de 0 a 100 pontos.
- Desafios adaptativos (exigência de CAPTCHA ou reautenticação com MFA).

### 2.5 Travas de Emergência (Kill Switches)
- Chaves globais no banco (`platform_kill_switches`) que permitem desabilitar imediatamente cadastros, uploads, vídeos ou compras em caso de incidente ou sobrecarga.
