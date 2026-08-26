# Matriz de Controle de Acesso e Governança de Privilégios

## 1. Funções e Perfis (Roles)
- `user`: Usuário consumidor regular (favoritos, histórico, preferências, suporte, privacidade).
- `advertiser`: Anunciante com gestão de perfil, galeria de mídia, contatos, planos e KYC.
- `moderator`: Equipe de moderação para análise de mídias, aprovação de perfis e denúncias.
- `support`: Atendentes de chamados e solicitações operacionais.
- `compliance`: Auditoria de KYC, retenção de dados, legal holds e requisições judiciais.
- `admin` / `super_admin`: Gestão completa de plataforma, kill switches, papéis e configurações globais.

## 2. Auditoria de Funções SECURITY DEFINER
Todas as RPCs `SECURITY DEFINER` seguem os seguintes critérios de conformidade:
1. `SET search_path = public`: Previne injeção de schema malicioso.
2. `public.current_profile_id()`: Extração segura do `auth.uid()` sem aceitar impersonação.
3. `is_admin()` / `is_staff()`: Checagem explícita de permissão com bloqueio e registro de evento em caso de tentativa de escalonamento.
