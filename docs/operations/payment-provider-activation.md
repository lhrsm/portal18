# RUNBOOK DE ATIVAÇÃO DE PROCESSADOR DE PAGAMENTOS EM PRODUÇÃO

**Objetivo:** Procedimento sequencial e seguro para ativação de gateway de pagamento aprovado comercialmente.  
**Classificação:** Operações & Segurança Financeira  

---

## 1. PRÉ-REQUISITOS OBRIGATÓRIOS (GATES)

Antes de alterar qualquer variável de ambiente em produção:

- [ ] Contrato comercial assinado com a processadora homologada para o segmento 18+.
- [ ] Conta de produção ativada com limites e regras de saque definidas.
- [ ] Chaves de API de produção (`PAYMENT_API_KEY`, `PAYMENT_MERCHANT_ID`, `PAYMENT_WEBHOOK_SECRET`) geradas e armazenadas com segurança.
- [ ] Configuração do Webhook da processadora apontando para:
  `https://portalnacional.com.br/api/webhooks/payments`
- [ ] Validação dos eventos assinados configurados para: `payment.paid`, `payment.failed`, `subscription.renewed`, `chargeback.created`.

---

## 2. PROCEDIMENTO DE ATIVAÇÃO PASSO A PASSO

### PASSO 1: Configuração das Variáveis de Ambiente no Vercel (Production)
```bash
PAYMENT_PROVIDER=<nome_do_provider_homologado>
PAYMENT_ENVIRONMENT=production
PAYMENT_API_KEY=<chave_privada_producao>
PAYMENT_MERCHANT_ID=<identificador_de_comerciante>
PAYMENT_WEBHOOK_SECRET=<segredo_hmac_webhook>
PAYMENTS_ENABLED=true
```

### PASSO 2: Teste de Transação em Baixo Valor (Canary Test)
1. Executar um checkout real de baixo valor (R$ 1,00 a R$ 5,00) via PIX e via Cartão em conta de teste interna.
2. Confirmar recebimento do webhook no endpoint `/api/webhooks/payments`.
3. Inspecionar a tabela `public.payments` e verificar:
   - `status = 'paid'`
   - `amount` correto em centavos
   - Chave de idempotência registrada
   - Zero dados de cartão expostos nos logs.

### PASSO 3: Teste de Reembolso (Refund Test)
1. No painel `/admin/payments`, executar o estorno administrativo do valor de teste.
2. Confirmar a devolução na conta de origem e a atualização para `status = 'refunded'`.

### PASSO 4: Liberação Geral de Checkout
1. Remover restrição de acesso Canary.
2. Monitorar a taxa de conversão e eventos de erro nos primeiros 60 minutos através dos logs estruturados.

---

## 3. PROCEDIMENTO DE EMERGÊNCIA (KILL SWITCH ROLLBACK)

Em caso de anomalia grave na adquirente, invasão de chaves ou divergência generalizada de conciliação:
1. Definir imediatamente na Vercel:
   `PAYMENTS_ENABLED=false`
2. Efetuar o redeploy instantâneo.
3. O portal manterá a navegação, login e cadastros funcionando normalmente, exibindo mensagem amigável de manutenção na área de pagamentos.
