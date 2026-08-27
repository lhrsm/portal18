import { Payment } from '@/types/app.types';

export interface ProviderPaymentRecord {
  providerReference: string;
  status: string;
  amount: number; // in integer cents
  currency: string;
  timestamp?: string;
}

export interface ReconciliationResult {
  paymentId?: string;
  providerReference: string;
  status: 'matched' | 'mismatch' | 'missing_local' | 'missing_provider' | 'manual_review';
  discrepancies: string[];
}

export const paymentReconciliationService = {
  /**
   * Compares a single local payment record with the provider's statement.
   */
  reconcilePaymentRecord(
    localPayment: Payment | null,
    providerRecord: ProviderPaymentRecord | null
  ): ReconciliationResult {
    const discrepancies: string[] = [];

    if (!localPayment && providerRecord) {
      return {
        providerReference: providerRecord.providerReference,
        status: 'missing_local',
        discrepancies: ['Transação encontrada no provedor, mas inexistente no banco de dados local.'],
      };
    }

    if (localPayment && !providerRecord) {
      return {
        paymentId: localPayment.id,
        providerReference: localPayment.provider_payment_reference || 'unknown_ref',
        status: 'missing_provider',
        discrepancies: ['Transação registrada localmente, mas não localizada no extrato do provedor.'],
      };
    }

    if (!localPayment || !providerRecord) {
      return {
        providerReference: 'none',
        status: 'manual_review',
        discrepancies: ['Dados insuficientes para conciliação.'],
      };
    }

    // 1. Amount validation
    if (localPayment.amount !== providerRecord.amount) {
      discrepancies.push(
        `Divergência de valor: local R$ ${(localPayment.amount / 100).toFixed(2)} vs provedor R$ ${(providerRecord.amount / 100).toFixed(2)}.`
      );
    }

    // 2. Currency validation
    if ((localPayment.currency || 'BRL').toUpperCase() !== (providerRecord.currency || 'BRL').toUpperCase()) {
      discrepancies.push(`Divergência de moeda: local ${localPayment.currency} vs provedor ${providerRecord.currency}.`);
    }

    // 3. Status mapping validation
    const normalizedLocalStatus = localPayment.status.toLowerCase();
    const normalizedProviderStatus = providerRecord.status.toLowerCase();

    if (normalizedLocalStatus === 'paid' && normalizedProviderStatus !== 'paid' && normalizedProviderStatus !== 'approved' && normalizedProviderStatus !== 'succeeded') {
      discrepancies.push(`Divergência de status: local está "paid", mas provedor reporta "${providerRecord.status}".`);
    }

    const status = discrepancies.length === 0 ? 'matched' : 'mismatch';

    return {
      paymentId: localPayment.id,
      providerReference: providerRecord.providerReference,
      status,
      discrepancies,
    };
  },

  /**
   * Batch reconciles a list of local payments against provider records.
   */
  batchReconcile(
    localPayments: Payment[],
    providerRecords: ProviderPaymentRecord[]
  ): {
    totalEvaluated: number;
    matchedCount: number;
    mismatchCount: number;
    results: ReconciliationResult[];
  } {
    const providerMap = new Map<string, ProviderPaymentRecord>();
    providerRecords.forEach((pr) => providerMap.set(pr.providerReference, pr));

    const results: ReconciliationResult[] = [];
    let matchedCount = 0;
    let mismatchCount = 0;

    localPayments.forEach((local) => {
      const ref = local.provider_payment_reference || '';
      const providerRec = providerMap.get(ref) || null;
      const recResult = this.reconcilePaymentRecord(local, providerRec);

      results.push(recResult);
      if (recResult.status === 'matched') {
        matchedCount++;
      } else {
        mismatchCount++;
      }
    });

    return {
      totalEvaluated: localPayments.length,
      matchedCount,
      mismatchCount,
      results,
    };
  },
};
