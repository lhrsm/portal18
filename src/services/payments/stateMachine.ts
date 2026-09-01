import { NormalizedPaymentStatus } from './types';

const STATUS_PRECEDENCE: Record<NormalizedPaymentStatus, number> = {
  created: 1,
  pending: 2,
  processing: 3,
  authorized: 5,
  paid: 10,
  failed: 8,
  cancelled: 8,
  expired: 8,
  partially_refunded: 15,
  refunded: 20,
  chargeback: 20,
  disputed: 20,
};

export class PaymentStateMachine {
  /**
   * Evaluates if a transition from currentStatus to nextStatus is valid according to monotonic rules.
   */
  public static canTransition(
    currentStatus: NormalizedPaymentStatus,
    nextStatus: NormalizedPaymentStatus
  ): { allowed: boolean; isOutOfOrder: boolean; reason?: string } {
    // 1. Same status is a valid idempotent no-op
    if (currentStatus === nextStatus) {
      return { allowed: true, isOutOfOrder: false };
    }

    // 2. Paid is a final success state that cannot be regressed to pending or failed
    if (currentStatus === 'paid') {
      if (nextStatus === 'pending' || nextStatus === 'processing' || nextStatus === 'failed' || nextStatus === 'created') {
        return {
          allowed: false,
          isOutOfOrder: true,
          reason: `Out-of-order event rejected: Cannot regress 'paid' transaction to '${nextStatus}'.`,
        };
      }
    }

    // 3. Terminal refund/chargeback states cannot be regressed to paid or pending
    if (currentStatus === 'refunded' || currentStatus === 'chargeback') {
      if (nextStatus === 'paid' || nextStatus === 'pending' || nextStatus === 'authorized') {
        return {
          allowed: false,
          isOutOfOrder: true,
          reason: `Out-of-order event rejected: '${currentStatus}' is terminal and cannot regress to '${nextStatus}'.`,
        };
      }
    }

    // 4. Precedence check
    const currentRank = STATUS_PRECEDENCE[currentStatus] || 0;
    const nextRank = STATUS_PRECEDENCE[nextStatus] || 0;

    if (nextRank < currentRank) {
      return {
        allowed: false,
        isOutOfOrder: true,
        reason: `Monotonic regression rejected: status '${nextStatus}' (rank ${nextRank}) is lower than '${currentStatus}' (rank ${currentRank}).`,
      };
    }

    return { allowed: true, isOutOfOrder: false };
  }
}
