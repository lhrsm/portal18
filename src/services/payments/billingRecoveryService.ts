import { createClient } from '@/lib/supabase/client';
import { PaymentProviderResolver } from './resolver';
import {
  BillingCycle,
  BillingRecoveryEvent,
  RetryPolicyConfig,
  ManualRetryResult,
  PaymentFailureCategory,
  BillingCycleStatus
} from './types';

export const DEFAULT_RETRY_POLICY: RetryPolicyConfig = {
  maxRetries: 3,
  retryDelaysHours: [24, 48, 72],
  graceDurationDays: 3,
  eligibleFailureCategories: ['insufficient_funds', 'card_declined', 'expired_card', 'provider_error'],
};

export const billingRecoveryService = {
  /**
   * Generates next deterministic billing cycle for an active subscription.
   */
  async generateNextCycle(
    subscriptionType: 'advertiser' | 'consumer',
    subscriptionId: string
  ): Promise<{ success: boolean; cycleId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('generate_subscription_billing_cycle', {
        p_subscription_type: subscriptionType,
        p_subscription_id: subscriptionId,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Erro ao gerar ciclo de faturamento.' };
      }

      return { success: true, cycleId: data.billing_cycle_id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao executar geração de ciclo.' };
    }
  },

  /**
   * Retrieves all billing cycles associated with a subscription.
   */
  async getSubscriptionCycles(subscriptionId: string): Promise<BillingCycle[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('billing_cycles') as any)
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('cycle_number', { ascending: false });

      if (error || !data) return [];
      return data as BillingCycle[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves single billing cycle by ID.
   */
  async getBillingCycle(cycleId: string): Promise<BillingCycle | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('billing_cycles') as any)
        .select('*')
        .eq('id', cycleId)
        .single();

      if (error || !data) return null;
      return data as BillingCycle;
    } catch {
      return null;
    }
  },

  /**
   * Triggers a renewal charge attempt for a due billing cycle with retry policy enforcement.
   */
  async triggerRenewalAttempt(
    cycleId: string,
    simulateFailure?: PaymentFailureCategory
  ): Promise<{ success: boolean; status: BillingCycleStatus; failureCategory?: string; error?: string }> {
    const supabase = createClient();
    const cycle = await this.getBillingCycle(cycleId);
    if (!cycle) {
      return { success: false, status: 'failed', error: 'Ciclo de faturamento não encontrado.' };
    }

    // Safety guard: if already paid, do not re-process (idempotency)
    if (cycle.status === 'paid') {
      return { success: true, status: 'paid' };
    }

    // Safety guard: if requires reconciliation, do not auto-retry (P0)
    if (cycle.status === 'requires_reconciliation' && !simulateFailure) {
      return {
        success: false,
        status: 'requires_reconciliation',
        error: 'Ciclo aguardando reconciliação manual ou retorno de webhook.',
      };
    }

    const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';

    // 1. Handle Simulated Failure under Homologation Mode
    if (simulateFailure) {
      const isEligibleForRetry = DEFAULT_RETRY_POLICY.eligibleFailureCategories.includes(simulateFailure);
      const isTimeout = simulateFailure === 'timeout' || simulateFailure === 'unknown';

      if (isTimeout) {
        // Mark as requires_reconciliation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('billing_cycles') as any)
          .update({
            status: 'requires_reconciliation',
            failure_category: simulateFailure,
            failure_message: 'Timeout após envio da requisição ao PSP. Aguardando reconciliação.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('billing_recovery_events') as any).insert({
          billing_cycle_id: cycle.id,
          subscription_id: cycle.subscription_id,
          subscription_type: cycle.subscription_type,
          profile_id: cycle.user_profile_id,
          event_type: 'reconciliation_required',
          failure_category: simulateFailure,
          metadata: { cycle_number: cycle.cycle_number },
        });

        return { success: false, status: 'requires_reconciliation', failureCategory: simulateFailure };
      }

      const nextRetryCount = cycle.retry_count + 1;
      const graceEnd = cycle.grace_ends_at || new Date(Date.now() + DEFAULT_RETRY_POLICY.graceDurationDays * 86400000).toISOString();
      const delayHours = DEFAULT_RETRY_POLICY.retryDelaysHours[Math.min(nextRetryCount - 1, 2)] || 24;
      const nextRetryDate = new Date(Date.now() + delayHours * 3600000).toISOString();

      const newCycleStatus: BillingCycleStatus = isEligibleForRetry && nextRetryCount <= DEFAULT_RETRY_POLICY.maxRetries ? 'grace_period' : 'failed';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('billing_cycles') as any)
        .update({
          status: newCycleStatus,
          grace_ends_at: graceEnd,
          retry_count: nextRetryCount,
          next_retry_at: nextRetryDate,
          failed_at: new Date().toISOString(),
          failure_category: simulateFailure,
          failure_message: `Falha simulada no processamento: ${simulateFailure}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cycle.id);

      // Update subscription status to grace_period if eligible
      if (newCycleStatus === 'grace_period') {
        const subTable = cycle.subscription_type === 'advertiser' ? 'subscriptions' : 'consumer_subscriptions';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from(subTable) as any)
          .update({
            status: 'grace_period',
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.subscription_id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('billing_recovery_events') as any).insert({
          billing_cycle_id: cycle.id,
          subscription_id: cycle.subscription_id,
          subscription_type: cycle.subscription_type,
          profile_id: cycle.user_profile_id,
          event_type: 'grace_started',
          failure_category: simulateFailure,
          metadata: { grace_ends_at: graceEnd, retry_count: nextRetryCount },
        });
      }

      return { success: false, status: newCycleStatus, failureCategory: simulateFailure };
    }

    // 2. Handle Successful Payment (Simulated or Real Homologation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('billing_cycles') as any)
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        failure_category: null,
        failure_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycle.id);

    // Extend subscription current_period_end
    const subTable = cycle.subscription_type === 'advertiser' ? 'subscriptions' : 'consumer_subscriptions';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(subTable) as any)
      .update({
        status: 'active',
        current_period_end: cycle.period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycle.subscription_id);

    // If advertiser, also ensure commercial_status is active
    if (cycle.subscription_type === 'advertiser' && cycle.advertiser_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('advertiser_profiles') as any)
        .update({ commercial_status: 'active', updated_at: new Date().toISOString() })
        .eq('id', cycle.advertiser_id);
    }

    // Log recovery / paid event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('billing_recovery_events') as any).insert({
      billing_cycle_id: cycle.id,
      subscription_id: cycle.subscription_id,
      subscription_type: cycle.subscription_type,
      profile_id: cycle.user_profile_id,
      event_type: cycle.status === 'grace_period' ? 'renewal_recovered' : 'renewal_paid',
      metadata: { cycle_number: cycle.cycle_number, period_end: cycle.period_end },
    });

    return { success: true, status: 'paid' };
  },

  /**
   * User or Admin manual retry for a payable billing cycle under grace period.
   */
  async triggerManualRetry(cycleId: string, profileId: string): Promise<ManualRetryResult> {
    const cycle = await this.getBillingCycle(cycleId);
    if (!cycle) {
      return { success: false, cycleId, status: 'failed', error: 'Ciclo não encontrado.' };
    }

    // Ownership check (unless admin)
    const isOwner = cycle.user_profile_id === profileId;
    if (!isOwner) {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adv } = await (supabase.from('advertiser_profiles') as any)
        .select('id')
        .eq('user_id', profileId)
        .single();

      if (!adv || adv.id !== cycle.advertiser_id) {
        return { success: false, cycleId, status: cycle.status, error: 'Acesso não autorizado.' };
      }
    }

    const res = await this.triggerRenewalAttempt(cycleId);
    return {
      success: res.success,
      cycleId,
      status: res.status,
      error: res.error,
    };
  },

  /**
   * Undoes pending cancellation ("Manter Assinatura") before period end.
   */
  async undoSubscriptionCancellation(
    subscriptionType: 'advertiser' | 'consumer',
    subscriptionId: string,
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const table = subscriptionType === 'advertiser' ? 'subscriptions' : 'consumer_subscriptions';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any)
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) return { success: false, error: error.message };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('billing_recovery_events') as any).insert({
        subscription_id: subscriptionId,
        subscription_type: subscriptionType,
        profile_id: profileId,
        event_type: 'cancel_at_period_end_removed',
        metadata: { restored_at: new Date().toISOString() },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao reativar renovação.' };
    }
  },

  /**
   * Updates payment method reference for upcoming retries.
   */
  async updatePaymentMethod(
    subscriptionType: 'advertiser' | 'consumer',
    subscriptionId: string,
    paymentMethod: 'credit_card' | 'pix',
    profileId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('billing_recovery_events') as any).insert({
        subscription_id: subscriptionId,
        subscription_type: subscriptionType,
        profile_id: profileId,
        event_type: 'payment_method_updated',
        metadata: { payment_method: paymentMethod, updated_at: new Date().toISOString() },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar forma de pagamento.' };
    }
  },

  /**
   * Admin Recovery Center queue retrieval.
   */
  async getAdminRecoveryQueue(statusFilter?: string): Promise<BillingCycle[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('billing_cycles') as any).select('*').order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      } else {
        query = query.in('status', ['grace_period', 'due', 'requires_reconciliation', 'failed']);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as BillingCycle[];
    } catch {
      return [];
    }
  },

  /**
   * Admin scheduler tick execution (processes due cycles and expires grace periods).
   */
  async runSchedulerTick(): Promise<{ cyclesDue: number; graceExpired: number }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dueRes } = await (supabase.rpc as any)('process_due_billing_cycles');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: graceRes } = await (supabase.rpc as any)('process_grace_expirations');

      return {
        cyclesDue: dueRes?.cycles_due_count || 0,
        graceExpired: graceRes?.grace_expired_count || 0,
      };
    } catch {
      return { cyclesDue: 0, graceExpired: 0 };
    }
  },
};
