import { createClient } from '@/lib/supabase/client';

export const pushNotificationService = {
  /**
   * Generates a privacy-safe, discrete push notification payload for lockscreen security.
   */
  buildDiscretePayload(params: {
    category: string;
    originalTitle?: string;
    actionUrl?: string;
  }): { title: string; body: string; data: { url: string; category: string } } {
    let discreteBody = 'Você tem uma nova atualização no Portal18.';

    if (params.category === 'security') {
      discreteBody = 'Alerta de segurança na sua conta.';
    } else if (params.category === 'moderation') {
      discreteBody = 'Atualização sobre o status do seu anúncio.';
    } else if (params.category === 'billing') {
      discreteBody = 'Informação importante sobre sua assinatura.';
    } else if (params.category === 'support') {
      discreteBody = 'Nova resposta da equipe de suporte.';
    }

    return {
      title: 'Portal18',
      body: discreteBody,
      data: {
        url: params.actionUrl || '/account/notifications',
        category: params.category,
      },
    };
  },

  /**
   * Registers a web push subscription for a user profile.
   */
  async subscribe(params: {
    profileId: string;
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    deviceLabel?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('push_subscriptions') as any).upsert(
        {
          profile_id: params.profileId,
          endpoint: params.endpoint,
          p256dh_key: params.p256dhKey,
          auth_key: params.authKey,
          user_agent: params.deviceLabel || 'Browser',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,endpoint' }
      );

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao registrar push subscription.' };
    }
  },

  /**
   * Unsubscribes / removes a web push subscription.
   */
  async unsubscribe(profileId: string, endpoint: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('push_subscriptions') as any)
        .delete()
        .eq('profile_id', profileId)
        .eq('endpoint', endpoint);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao remover push subscription.' };
    }
  },
};
