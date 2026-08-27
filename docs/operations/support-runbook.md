# Manual Operacional de Atendimento e Suporte (Support Runbook)

## 1. Visão Geral
A Central de Atendimento (`/admin/support` e `/support`) gerencia o ciclo de vida dos chamados abertos por usuários comuns e anunciantes.

---

## 2. Triagem e Níveis de Severidade
| Prioridade | SLA Máximo | Exemplos de Incidentes | Ação do Atendente |
| :--- | :--- | :--- | :--- |
| **Urgente (P0)** | 1 hora | Suspeita de fraude, denúncia de segurança, invasão de conta | Escalonar imediatamente para Equipe de Segurança |
| **Alta (P1)** | 4 horas | Problema no login/MFA, erro em verificação KYC, cobrança duplicada | Atendimento prioritário e verificação de logs |
| **Normal (P2)** | 24 horas | Dúvidas de navegação, alteração cadastral, feedback | Resposta padrão baseada na Central de Ajuda |
| **Baixa (P3)** | 48 horas | Sugestões de melhorias, solicitações comerciais gerais | Registro e encaminhamento interno |

---

## 3. Diretrizes de Segurança no Atendimento
1. **Nunca solicitar senhas ou códigos TOTP/SMS**: Nenhum analista possui autorização para solicitar credenciais do usuário.
2. **Isolamento de Anexos**: Anexos de chamados são validados em bucket privado (`ticket-attachments`) e nunca compartilhados fora do ticket.
3. **Respostas Estruturadas**: Utilizar linguagem neutra, cordial e orientada a soluções.
