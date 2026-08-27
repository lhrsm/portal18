# POLÍTICA COMERCIAL, ASSINATURAS E GESTÃO FINANCEIRA

**Portal:** Portal Nacional de Entretenimento Adulto 18+  
**Versão:** 1.0  
**Data:** 27 de Agosto de 2026  

---

## 1. MODELO DE PRODUTOS E COBRANÇA

| Produto | Tipo | Descrição | Modelo de Renovação |
| :--- | :--- | :--- | :--- |
| **Plano Mensal (VIP / Top)** | Assinatura Recorrente | Acesso a limites ampliados de fotos/vídeos e selo de destaque | Recorrência a cada 30 dias |
| **Boost de Visibilidade** | Compra Avulsa | Impulsionamento temporário na listagem regional e buscas | Pagamento único (Duração fixa) |
| **Destaque de Cidade/Região** | Compra Avulsa | Banner ou card destacado no topo da cidade/estado | Pagamento único (Período fixado) |
| **Campanha Patrocinada** | Compra Programada | Inserções patrocinadas na página inicial e exploração | Por período contratado |

---

## 2. POLÍTICA DE CANCELAMENTO & RENOVAÇÃO

1. **Cancelamento pelo Anunciante:**
   - O anunciante pode solicitar o cancelamento de sua assinatura a qualquer momento através do painel `/advertiser/subscription`.
   - Por padrão, o cancelamento opera em modalidade `cancel_at_period_end`, mantendo os benefícios ativos até o final do ciclo já pago.

2. **Inadimplência (Past Due):**
   - Em caso de falha na cobrança da renovação, a assinatura entra no estado `past_due` com período de tolerância de 3 dias para retentativas de pagamento.
   - Decorrido o período sem confirmação de pagamento, o status é alterado para `cancelled` e os limites do perfil retornam ao plano gratuito.

---

## 3. POLÍTICA DE REEMBOLSOS E CHARGEBACKS

1. **Reembolsos Administrativos:**
   - Somente administradores com a permissão `admin` ou `super_admin` podem autorizar estornos manuais no painel `/admin/payments`.
   - Moderadores de conteúdo e suporte comum não possuem permissão de estorno.
   - Qualquer estorno executado exige justificativa documentada e é registrado na tabela `public.audit_logs`.

2. **Chargebacks e Disputas:**
   - Em caso de notificação de chargeback ou contestação pelo emissor do cartão, a assinatura associada é imediatamente suspensa e um evento de risco crítico é gerado no `RiskEngine`.
   - O histórico da transação é preservado para fins de prestação de contas fiscais e defesa de disputa.

---

## 4. INDEPENDÊNCIA DE CONFORMIDADE E TRUST & SAFETY

- **Nenhum pagamento concede imunidade:** Anunciantes com planos pagos continuam 100% sujeitos às regras de moderação, exigência de verificação 18+ (KYC) e suspensão imediata em caso de denúncias procedentes (suspeita de menor, conteúdo não consensual, fraudes ou assédio).
- Pagamentos realizados não são automaticamente reembolsados caso o anunciante seja suspenso por infração grave aos Termos de Uso.
