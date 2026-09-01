# Portal18 — Financial Operations Architecture

> [!WARNING]
> **NOT TAX ADVICE | ACCOUNTING REVIEW REQUIRED | LEGAL REVIEW REQUIRED**
> Este documento descreve a arquitetura financeira e os fluxos de liquidação do Portal18. Não constitui aconselhamento contábil, tributário ou jurídico.

---

## 1. Princípios Operacionais

1. **Unidades Inteiras Menores (Minor Units)**: Todos os valores monetários no sistema são representados e calculados em centavos inteiros de BRL (`integer minor units`), eliminando problemas de arredondamento inerentes a números de ponto flutuante.
2. **Separação de Camadas**:
   - **Preço Comercial**: Snapshot do catálogo e tabela de preços.
   - **Cobrança Bruta (Gross Amount)**: Valor efetivamente pago pelo usuário no pedido.
   - **Taxas do Provedor (Provider Fees)**: Descontos retidos pelo adquirente/PSP.
   - **Estornos (Refunds)**: Devoluções totais ou parciais auditadas.
   - **Contestações (Chargebacks)**: Perdas por disputas bancárias.
   - **Liquidação Líquida (Net Settlement)**: Saldo financeiro transferido para a conta bancária da plataforma.
3. **Ausência de Split/Payout**: O Portal18 comercializa exclusivamente assinaturas de publicidade para anunciantes e assinaturas de conteúdo Premium para membros. A plataforma **NÃO** intermedia pagamentos diretos entre clientes e acompanhantes e **NÃO** realiza repasses/payouts a terceiros.
4. **Isolamento de Ambiente**: Dados de simulação do Internal Test Driver são permanentemente rotulados como Homologação e segregados de métricas de produção.
