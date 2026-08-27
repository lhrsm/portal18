# DECISÃO ARQUITETURAL & POLÍTICA DE SELEÇÃO DE PROCESSAMENTO FINANCEIRO

**Status Comercial:** PROVIDER NOT YET COMMERCIALLY APPROVED  
**Status Técnico:** READY (Camada desacoplada, RPCs de checkout, conciliação e webhooks)  
**Kill Switch Ativo:** `payments_enabled = false`  
**Cobrança Real:** DESATIVADA  

---

## 1. POSICIONAMENTO E POLÍTICA DE SEGURANÇA COMERCIAL

1. **Desacoplamento Rigoroso:**
   - O `billingService` e as tabelas `public.payments`, `public.subscriptions`, `public.plans` e `public.advertiser_campaigns` operam exclusivamente através de contratos de interface (`PaymentProvider`).
   - Não há acoplamento de schema com nenhum provedor específico.

2. **Kill Switch de Pagamentos:**
   - Enquanto um contrato formal com uma adquirente compatível com plataformas 18+ não for firmado, a variável `PAYMENTS_ENABLED=false` permanece ativa em produção.
   - Qualquer tentativa de criar sessões de checkout em produção é interceptada pelo guard de segurança, retornando mensagem orientativa amigável sem expor detalhes internos de infraestrutura.

3. **Valores Financeiros em Unidade Mínima (Inteiros):**
   - Todas as transações são armazenadas em centavos inteiros (`amount` em BRL) para evitar imprecisões de arredondamento de ponto flutuante.
   - O servidor é a autoridade absoluta sobre os preços dos planos e produtos, ignorando qualquer valor monetário manipulado enviado pelo cliente.

4. **Isolamento de Funções de Trust & Safety:**
   - A contratação de planos ou destaques pagos **NUNCA** interfere nas regras de moderação, no status de verificação KYC ou em suspensões de segurança.
   - Um anunciante suspenso por violação de termos tem sua exposição pública imediatamente revogada, independentemente de possuir assinatura ativa.
