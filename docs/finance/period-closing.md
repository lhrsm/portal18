# Portal18 — Financial Period Closing & Reconciliation

> [!WARNING]
> **ACCOUNTING REVIEW REQUIRED | P0 CLOSING BLOCKERS**

---

## 1. Procedimento de Fechamento de Período

1. **Validação Prévia de Bloqueios (P0 Guards)**:
   - A função `close_financial_period` verifica se existem discrepâncias ativas com severidade `critical` ou `high` na tabela `payment_reconciliation_logs`.
   - Se houver divergências de valor (`AMOUNT_MISMATCH`), moeda (`CURRENCY_MISMATCH`) ou duplicidade (`POTENTIAL_DOUBLE_CHARGE`), o fechamento é **estritamente bloqueado**.
2. **Consolidação e Snapshot Imutável**:
   - Uma vez superadas as validações, a RPC calcula o somatório de pedidos concluídos, estornos confirmados e chargebacks perdidos dentro da janela temporal.
   - Um snapshot em JSON é gravado na tabela `financial_periods` com status `closed`.
3. **Reabertura Auditada**:
   - Períodos fechados só podem ser reabertos mediante justificativa detalhada gravada na trilha imutável de auditoria (`audit_logs`).
