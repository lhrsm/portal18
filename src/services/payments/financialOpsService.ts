import { createClient } from '@/lib/supabase/client';
import {
  PaymentRefund,
  PaymentDispute,
  ProcessRefundParams,
  ProcessRefundResult,
  DisputeReasonCategory,
  DisputeLifecycleStatus,
  RefundPolicy
} from './types';

export const financialOpsService = {
  /**
   * Processes a canonical full or partial refund with strict balance validation and entitlement policy.
   */
  async processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('process_canonical_refund', {
        p_order_id: params.orderId,
        p_amount_cents: params.amountCents,
        p_reason: params.reason,
        p_entitlement_policy: params.entitlementPolicy,
        p_requested_by: params.requestedBy || null,
        p_idempotency_key: params.idempotencyKey || null,
      });

      if (error || !data || !data.success) {
        return {
          success: false,
          error: error?.message || data?.error || 'Erro ao processar estorno.',
        };
      }

      return {
        success: true,
        refundId: data.refund_id,
        refundType: data.refund_type,
        amountCents: data.amount_cents,
        remainingRefundableCents: data.remaining_refundable_cents,
        orderStatus: data.order_status,
        alreadyProcessed: data.already_processed || false,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao executar estorno.' };
    }
  },

  /**
   * Retrieves all refund transactions for an order.
   */
  async getRefundsByOrder(orderId: string): Promise<PaymentRefund[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('payment_refunds') as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as PaymentRefund[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves all platform refunds for admin finance queue.
   */
  async getAllRefunds(): Promise<PaymentRefund[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('payment_refunds') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) return [];
      return data as PaymentRefund[];
    } catch {
      return [];
    }
  },

  /**
   * Records or updates a dispute / chargeback lifecycle event.
   */
  async recordDispute(params: {
    orderId: string;
    providerCode: string;
    providerDisputeId: string;
    amountCents: number;
    reasonCategory: DisputeReasonCategory;
    disputeStatus: DisputeLifecycleStatus;
    evidence?: Record<string, any>;
  }): Promise<{ success: boolean; chargebackId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('record_dispute_event', {
        p_order_id: params.orderId,
        p_provider_code: params.providerCode,
        p_provider_dispute_id: params.providerDisputeId,
        p_amount_cents: params.amountCents,
        p_reason_category: params.reasonCategory,
        p_dispute_status: params.disputeStatus,
        p_evidence: params.evidence || {},
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || 'Erro ao registrar disputa.' };
      }

      return { success: true, chargebackId: data.chargeback_id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao registrar disputa.' };
    }
  },

  /**
   * Retrieves disputes & chargebacks queue for admin center.
   */
  async getDisputesQueue(): Promise<PaymentDispute[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('payment_chargebacks') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) return [];
      return data as PaymentDispute[];
    } catch {
      return [];
    }
  },

  /**
   * Resolves a reconciliation discrepancy record.
   */
  async resolveDiscrepancy(
    discrepancyId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('resolve_reconciliation_discrepancy', {
        p_discrepancy_id: discrepancyId,
        p_resolution_notes: resolutionNotes,
        p_resolved_by: resolvedBy,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || 'Erro ao resolver discrepância.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao resolver discrepância.' };
    }
  },

  /**
   * Generates a sanitized CSV string of all financial transactions for accounting.
   * Strictly excludes card tokens, CVV, raw biometrics, and passwords.
   */
  async exportFinancialLedgerCSV(): Promise<string> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orders } = await (supabase.from('orders') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!orders || orders.length === 0) {
        return 'ID,Numero_Pedido,Produto,Valor_Bruto_BRL,Status_Pagamento,Metodo,Provedor,Criado_Em\n';
      }

      const headers = ['ID', 'Numero_Pedido', 'Produto', 'Valor_Bruto_BRL', 'Status_Pagamento', 'Metodo', 'Provedor', 'Criado_Em'];
      const rows = orders.map((o: any) => [
        o.id,
        o.order_number,
        `"${(o.commercial_snapshot?.product_name || o.product_type).replace(/"/g, '""')}"`,
        ((o.total_minor || o.total_amount || 0) / 100).toFixed(2),
        o.payment_status || o.status,
        o.selected_payment_method || 'PIX',
        o.provider_code || 'internal_driver',
        o.created_at,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      return csvContent;
    } catch {
      return 'ID,Numero_Pedido,Produto,Valor_Bruto_BRL,Status_Pagamento,Metodo,Provedor,Criado_Em\n';
    }
  },
};
