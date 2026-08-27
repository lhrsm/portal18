# RELATÓRIO COMPARATIVO DE GATEWAYS DE PAGAMENTO & PROCESSAMENTO FINANCEIRO

**Projeto:** Portal Nacional de Entretenimento Adulto 18+  
**Data:** 27 de Agosto de 2026  
**Classificação:** Documento Técnico & Análise Comercial  

---

## 1. INTRODUÇÃO & ESCOPO

A operação comercial do Portal Nacional 18+ requer processamento seguro de pagamentos recorrentes (assinaturas), cobranças avulsas (destaques, boosts e campanhas patrocinadas) e liquidação em moeda brasileira (BRL), suportando principalmente **PIX** e **Cartão de Crédito**.

Devido à natureza do segmento de entretenimento adulto e classificados 18+, as políticas de uso aceitável (*Restricted Businesses Policies*) da maioria das adquirentes e subadquirentes tradicionais exigem análise prévia e aprovação jurídica formal.

---

## 2. MATRIZ COMPARATIVA DE GATEWAYS

| Critério | Stripe | Mercado Pago | Asaas | Pagar.me (Stone) | Adyen | Gateway Especializado (High-Risk) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Disponibilidade no Brasil** | Sim | Sim (Nativo) | Sim (Nativo) | Sim (Nativo) | Sim | Dependente do provedor |
| **Suporte a PIX** | Sim | Sim (Imediato) | Sim (Imediato) | Sim (Imediato) | Sim | Sim (Via parceiros bancários) |
| **Cartão de Crédito** | Sim | Sim | Sim | Sim | Sim | Sim |
| **Cobrança Recorrente (Assinaturas)**| Sim (Billing) | Sim (Subscriptions) | Sim (Assinaturas) | Sim (Assinaturas) | Sim | Sim |
| **Webhooks Assinados** | HMAC-SHA256 | HMAC-SHA256 | Token / Header | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 |
| **Tokenização / PCI Scope** | Elements (PCI SAQ A) | Bricks / Token (SAQ A) | Token (SAQ A) | Token (SAQ A) | Drop-in (SAQ A) | Hosted Fields (SAQ A) |
| **Sandbox / Testes** | Excelente | Excelente | Excelente | Excelente | Excelente | Disponível |
| **Reembolsos via API** | Sim | Sim | Sim | Sim | Sim | Sim |
| **Gestão de Chargeback** | Dashboard + API | Dashboard | Dashboard | Dashboard | Dashboard + API | Dashboard com disputa |
| **Elegibilidade Segmento Adulto** | RESTRICTED BUSINESS | COMMERCIAL CONFIRMATION REQUIRED | RESTRICTED BUSINESS | COMMERCIAL CONFIRMATION REQUIRED | RESTRICTED BUSINESS | COMMERCIALLY APPROVED FOR 18+ |
| **Contrato Específico** | Termos Padrão | Contrato PJ | Contrato PJ | Contrato Comercial PJ | Contrato Enterprise | Contrato Especializado 18+ |

---

## 3. AVALIAÇÃO DE CONFORMIDADE & ELEGIBILIDADE COMERCIAL

1. **Gateways Convencionais (Stripe, Adyen, Asaas, Mercado Pago, Pagar.me):**
   - Possuem cláusulas explícitas em suas políticas de uso restringindo produtos ou serviços relacionados a entretenimento adulto, serviços para adultos ou plataformas de acompanhantes.
   - Qualquer integração sem anuência comercial e jurídica prévia apresenta alto risco de bloqueio de conta e congelamento de saldo.
   - *Status Comercial:* `COMMERCIAL CONFIRMATION REQUIRED` / `RESTRICTED BUSINESS`.

2. **Processadoras Especializadas (High-Risk Merchant Accounts / Adquirência Customizada):**
   - Empresas e facilitadoras de pagamento devidamente licenciadas para processar transações de plataformas 18+ com suporte a PIX e cartões nacionais.
   - Apresentam taxas diferenciadas de transação e exigência de processos formais de *Underwriting* e compliance KYC dos sócios da plataforma.

---

## 4. DIRETRIZ ARQUITETURAL

A plataforma mantém uma camada de abstração **100% Provider-Agnostic** (`PaymentProvider`, `IdentityProviderFactory`, `billingService`).
Nenhum pagamento real será processado até que um fornecedor comercialmente aprovado e contratado seja configurado pelo administrador.
