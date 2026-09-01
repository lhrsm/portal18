# RELATÓRIO COMPARATIVO DE PROVEDORES DE VERIFICAÇÃO DE IDENTIDADE (KYC 18+)

**Projeto:** Portal Nacional de Entretenimento Adulto 18+
**Data:** 27 de Agosto de 2026
**Classificação:** Documento Técnico de Arquitetura & Conformidade

---

## 1. INTRODUÇÃO & ESCOPO

A conformidade regulatória e a política de **Tolerância Zero para Menores de 18 Anos** exigem uma infraestrutura robusta de verificação de identidade (*KYC - Know Your Customer*), validação de maioridade e prova de vida (*liveness detection*).

Este documento compara os quatro principais fornecedores globais e nacionais de verificação de identidade com suporte ao mercado brasileiro.

---

## 2. MATRIZ COMPARATIVA DE FORNECEDORES

| Critério de Avaliação | Sumsub | Veriff | Persona | idwall |
| :--- | :--- | :--- | :--- | :--- |
| **Suporte ao Brasil** | Nativo (Alta maturidade) | Suportado | Suportado | Nativo (Brasil) |
| **Validação de CPF** | Receita Federal / Bureaus | Validação de documento | Validação via API | Direto na Receita / Dataprev |
| **Documentos Brasileiros** | RG (Antigo e Novo CIN), CNH, Passaporte | CNH, RG, Passaporte | CNH, RG, Passaporte | RG, CNH, CIN, CTPS |
| **Prova de Vida (Liveness)** | 3D Liveness Ativo/Passivo (iBeta Nível 2) | Liveness 3D / Vídeo | Liveness Passivo | Liveness Facial com Facematch |
| **Face Match 1:1** | Sim (Selfie vs Documento) | Sim | Sim | Sim |
| **Validação de Idade (18+)** | Extração de data de nascimento + OCR | Extração OCR | Extração OCR | Extração OCR + Bureaus |
| **Web SDK / Mobile SDK** | Web SDK, React, iOS, Android, Flutter | Web SDK, React, Mobile | Web SDK, Mobile SDK | SDK Web e Mobile |
| **Webhooks Assinados** | HMAC-SHA256 com timestamp | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 |
| **Ambiente Sandbox** | Sandbox completo com mocks configuráveis | Sandbox disponível | Sandbox disponível | Sandbox disponível |
| **Revisão Manual Humana** | Equipe 24/7 Sumsub ou interna | Equipe Veriff ou interna | Equipe interna ou BPO | Mesa de análise idwall |
| **Data Residency** | UE / EUA / Opções locais | UE / EUA | EUA / UE | Brasil (Nativo) |
| **Conformidade LGPD / DPA** | DPA formal com cláusulas LGPD/GDPR | DPA disponível | DPA disponível | Total conformidade LGPD |
| **Mínimo Mensal / Contrato** | COMMERCIAL CONFIRMATION REQUIRED | COMMERCIAL CONFIRMATION REQUIRED | COMMERCIAL CONFIRMATION REQUIRED | COMMERCIAL CONFIRMATION REQUIRED |
| **Elegibilidade Conteúdo Adulto** | Suporta plataformas com compliance 18+ | Políticas restritivas por segmento | Requer aprovação específica | Requer aprovação jurídica específica |
| **SLA de Resposta API** | < 30 segundos (Automático) | < 60 segundos | < 30 segundos | < 30 segundos |

---

## 3. CONCLUSÕES TÉCNICAS

1. **Sumsub**: Apresenta a melhor combinação de documentação de API, facilidade de integração via Web SDK, suporte aprimorado a documentos brasileiros (CNH e nova Carteira de Identidade Nacional - CIN) e motor avançado de detecção de idade e liveness com certificação iBeta Nível 2.
2. **idwall**: Excelente cobertura para bureaus brasileiros de crédito e dados públicos, mas com maior foco corporativo financeiro e exigência de processos comerciais mais longos.
3. **Veriff & Persona**: Excelentes soluções globais, porém com custos atrelados a moeda estrangeira (USD/EUR) e políticas comerciais mais sensíveis a plataformas 18+.

---

## 4. RECOMENDAÇÃO

Adotar **Sumsub** como o provedor primário de verificação de identidade em modo Sandbox, mantendo a arquitetura provider-agnostic através do padrão *Adapter / Factory* da plataforma.
