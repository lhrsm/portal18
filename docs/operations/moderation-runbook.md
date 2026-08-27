# Manual Operacional de Moderação (Moderation Runbook)

## 1. Visão Geral e Princípios
O Portal Nacional atua no segmento de entretenimento adulto (18+), exigindo **tolerância zero** para qualquer conteúdo que envolva menores de idade, não-consensualidade, documentos falsificados ou violações de direitos humanos.
A moderação humana é **obrigatória** antes da publicação de qualquer anúncio ou mídia visual.

---

## 2. Matriz de Papéis e Acesso Mínimo (Least Privilege)
| Papel | Escopo de Acesso | Restrições Estritas |
| :--- | :--- | :--- |
| **Moderator** | Fila de perfis, aprovação de fotos/vídeos públicos, denúncias comuns | SEM acesso a documentos KYC, sem acesso a dados financeiros ou exports |
| **Compliance** | Validação de documentos 18+ (KYC), auditoria legal, denúncias críticas | Acesso a documentos de verificação; sem gestão de papéis de super admin |
| **Admin** | Gestão de categorias, suporte, visualização de métricas e filas | Ações auditadas via `security_events` |
| **Super Admin** | Configurações globais, kill switches, gestão de papéis, overrides | MFA obrigatório, reautenticação recente para ações sensíveis |

---

## 3. Fluxo Operacional de Moderação Pré-Publicação

### 3.1 Revisão de Perfis de Anunciantes (`/admin/moderation/profiles`)
1. **Nome Artístico**: Verificar ausência de termos que sugiram menoridade, termos ofensivos ilegais ou marcas registradas de terceiros.
2. **Biografia e Serviços**: Garantir conformidade com as Políticas da Comunidade (proibição explícita de menção a menores ou coerção).
3. **Localização**: Verificar se cidade e estado correspondem a regiões válidas.

### 3.2 Revisão de Mídia Visual (`/admin/moderation/media`)
1. **Maioridade Visual Aparente**: Anunciante deve ser visivelmente maior de idade. Qualquer dúvida requer escalonamento imediato para Compliance.
2. **Consensualidade**: Proibição de conteúdo que sugira violência, coação ou captação clandestina.
3. **Sem Dados Sensíveis Visíveis**: Rejeitar fotos contendo documentos de identidade físicos, cartões bancários ou placas de veículos.
4. **Ações Disponíveis**:
   - **Aprovar**: Mídia se torna elegível para exibição pública na galeria.
   - **Rejeitar**: Fornecer motivo descritivo claro para orientação do anunciante.
   - **Bloquear (Block Hash)**: Para mídias reincidentes ou abusivas.

---

## 4. Procedimento Emergencial de Conteúdo Crítico (24/7 SLA)
Qualquer sinalização de:
- Suspeita de menor de idade (`underage_suspected`)
- Conteúdo não consensual / vazamento (`non_consensual`)
- Ameaça à integridade física (`immediate_threat`)

### Ações Imediatas:
1. **Ocultação Instantânea**: Executar suspensão cautelar do perfil em 1 clique via `/admin/moderation`.
2. **Invalidação de Cache**: O perfil e suas mídias são imediatamente expurgados do catálogo, buscas e sitemaps.
3. **Aplicação de Legal Hold**: Registrar trava de custódia na tabela `legal_holds` para impedir exclusão de logs e dados necessários para autoridades competentes.
4. **Notificação ao Encarregado de Compliance**: Escalonamento imediato via canal prioritário.

---

## 5. Cobertura e Escala Operacional
- **Fila Técnica de Prioridade**: Operacional e automatizada via backend (PASS).
- **Escala de Atendimento Humano**: Deve ser formalmente atribuída à equipe física antes da abertura do portal a novos anunciantes externos.
- **Contato de Escalonamento Crítico**: `compliance@portalnacional.com.br`
