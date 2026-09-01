import { createClient } from '@/lib/supabase/client';
import {
  PaymentSettlement,
  PaymentSettlementItem,
  FinancialPeriod,
  FiscalDocument
} from '@/services/payments/types';

export const financeOpsService = {
  /**
   * Retrieves high-level financial overview metrics for homologation operations.
   * All figures in integer cents (BRL minor units).
   */
  async getFinancialOverview(): Promise<{
    grossMinor: number;
    refundsMinor: number;
    chargebacksMinor: number;
    feesMinor: number;
    netSettlementMinor: number;
    unresolvedDiscrepancies: number;
    activePeriodKey: string;
    environment: 'homologation' | 'production';
  }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [ordersRes, refundsRes, chargebacksRes, discrepanciesRes] = await Promise.all([
        (supabase.from('orders') as any).select('total_minor, total_amount, status, payment_status'),
        (supabase.from('payment_refunds') as any).select('amount_cents, status').eq('status', 'completed'),
        (supabase.from('payment_chargebacks') as any).select('amount_cents, dispute_status').eq('dispute_status', 'lost'),
        (supabase.from('payment_reconciliation_logs') as any).select('id').eq('resolved', false),
      ]);

      const grossMinor = (ordersRes.data || [])
        .filter((o: any) => o.status === 'fulfilled' || o.payment_status === 'paid' || o.status === 'refunded' || o.payment_status === 'refunded')
        .reduce((sum: number, o: any) => sum + (o.total_minor || o.total_amount || 0), 0);

      const refundsMinor = (refundsRes.data || []).reduce((sum: number, r: any) => sum + (r.amount_cents || 0), 0);
      const chargebacksMinor = (chargebacksRes.data || []).reduce((sum: number, c: any) => sum + (c.amount_cents || 0), 0);
      const feesMinor = 0;
      const netSettlementMinor = grossMinor - refundsMinor - chargebacksMinor - feesMinor;
      const unresolvedDiscrepancies = (discrepanciesRes.data || []).length;

      const currentMonthKey = new Date().toISOString().substring(0, 7);

      return {
        grossMinor,
        refundsMinor,
        chargebacksMinor,
        feesMinor,
        netSettlementMinor,
        unresolvedDiscrepancies,
        activePeriodKey: currentMonthKey,
        environment: 'homologation',
      };
    } catch {
      return {
        grossMinor: 0,
        refundsMinor: 0,
        chargebacksMinor: 0,
        feesMinor: 0,
        netSettlementMinor: 0,
        unresolvedDiscrepancies: 0,
        activePeriodKey: new Date().toISOString().substring(0, 7),
        environment: 'homologation',
      };
    }
  },

  /**
   * Retrieves all registered PSP settlement batches.
   */
  async getSettlements(): Promise<PaymentSettlement[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('payment_settlements') as any)
        .select('*')
        .order('settlement_date', { ascending: false });

      if (error || !data) return [];
      return data as PaymentSettlement[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves all financial closing periods.
   */
  async getFinancialPeriods(): Promise<FinancialPeriod[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('financial_periods') as any)
        .select('*')
        .order('period_key', { ascending: false });

      if (error || !data) return [];
      return data as FinancialPeriod[];
    } catch {
      return [];
    }
  },

  /**
   * Closes a financial period after verifying zero P0 blockers.
   */
  async closePeriod(periodKey: string, closedBy: string): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('close_financial_period', {
        p_period_key: periodKey,
        p_closed_by: closedBy,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Erro ao encerrar período contábil.' };
      }

      return { success: true, snapshot: data.snapshot };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao executar fechamento de período.' };
    }
  },

  /**
   * Reopens a closed financial period with mandatory justification and audit trail.
   */
  async reopenPeriod(periodKey: string, reopenedBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('reopen_financial_period', {
        p_period_key: periodKey,
        p_reopened_by: reopenedBy,
        p_reason: reason,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Erro ao reabrir período contábil.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao reabrir período.' };
    }
  },

  /**
   * Retrieves fiscal document readiness records (zero real invoices).
   */
  async getFiscalDocuments(): Promise<FiscalDocument[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('fiscal_documents') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];
      return data as FiscalDocument[];
    } catch {
      return [];
    }
  },
};
