# DECISÃO ARQUITETURAL & SELEÇÃO DE PROVEDOR KYC

**Fornecedor Selecionado:** SUMSUB
**Status Técnico:** READY (Adapter & Webhook implementados)
**Status Comercial:** PENDING (Aguardando contratação e credenciais de produção)
**Ambiente Ativo:** SANDBOX (`KYC_ENVIRONMENT=sandbox`)
**Production Gate:** `production_verification_enabled = false`

---

## 1. JUSTIFICATIVA DA SELEÇÃO

A escolha da **Sumsub** como provedor de verificação de identidade inicial baseia-se nos seguintes pilares técnicos e operacionais:

1. **Validação Rigorosa de Maioridade (18+):**
   - Extração por OCR de alta precisão da data de nascimento em documentos brasileiros (RG, CNH, CIN, Passaporte).
   - Cálculo determinístico de idade no backend da plataforma com rejeição automática para indivíduos menores de 18 anos.

2. **Prova de Vida (Liveness) & Facematch:**
   - Detecção de vivacidade 3D ativa e passiva certificada contra ataques de apresentação (fotos estáticas, deepfakes, máscaras 3D e vídeos reproduzidos em telas).
   - Comparação biométrica 1:1 entre a selfie do anunciante e a foto do documento oficial.

3. **Arquitetura Desacoplada (Provider-Agnostic):**
   - O núcleo do sistema opera através da interface `IdentityVerificationProvider` e da fábrica `IdentityProviderFactory`.
   - Nenhuma dependência direta acopla a base de dados ou os fluxos de autenticação à API da Sumsub, permitindo a substituição transparente por outro provedor caso necessário.

4. **Minimização de Dados (LGPD):**
   - A plataforma armazena apenas os metadados estritamente necessários (`provider_reference`, `status`, `age_verified`, `identity_verified`, `completed_at`).
   - Não há armazenamento redundante de imagens biométricas ou números de documentos no banco de dados local.

---

## 2. PORTÃO DE ATIVAÇÃO EM PRODUÇÃO (COMMERCIAL GATE)

Para habilitar a verificação de anunciantes em ambiente de produção com a Sumsub, os seguintes requisitos devem ser cumpridos:

- [ ] Contrato comercial assinado com a Sumsub com aditivo de processamento de dados (DPA) em conformidade com a LGPD.
- [ ] Obtenção das credenciais de produção (`SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, `SUMSUB_LEVEL_NAME`, `SUMSUB_WEBHOOK_SECRET`).
- [ ] Configuração do endpoint de webhook no painel Sumsub apontando para o domínio oficial da plataforma.
- [ ] Validação do fluxo de ponta a ponta com documentos reais em ambiente restrito.
- [ ] Atualização da variável de ambiente `KYC_ENVIRONMENT=production` e ativação da flag `production_verification_enabled = true`.
