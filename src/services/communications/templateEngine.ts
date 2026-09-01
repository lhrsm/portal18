import { createClient } from '@/lib/supabase/client';
import { NotificationTemplate } from './types';

export const templateEngine = {
  /**
   * Interpolates placeholder variables in a template and sanitizes malicious tags.
   */
  render(templateText: string, variables: Record<string, string | number> = {}): string {
    let rendered = templateText;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Basic sanitization: strip script and iframe tags
    rendered = rendered.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    rendered = rendered.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    return rendered;
  },

  /**
   * Retrieves notification templates.
   */
  async getTemplates(filters?: { channel?: string; status?: string }): Promise<NotificationTemplate[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('notification_templates') as any)
        .select('*')
        .order('template_key', { ascending: true });

      if (filters?.channel && filters.channel !== 'all') {
        query = query.eq('channel', filters.channel);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as NotificationTemplate[];
    } catch {
      return [];
    }
  },

  /**
   * Creates or updates a versioned template.
   */
  async saveTemplate(params: {
    templateKey: string;
    channel: 'in_app' | 'email' | 'push';
    locale?: string;
    subject: string;
    bodyTemplate: string;
  }): Promise<{ success: boolean; templateId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // Find latest version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from('notification_templates') as any)
        .select('version')
        .eq('template_key', params.templateKey)
        .eq('channel', params.channel)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = (existing && existing[0]?.version) ? existing[0].version + 1 : 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('notification_templates') as any)
        .insert({
          template_key: params.templateKey,
          channel: params.channel,
          locale: params.locale || 'pt-BR',
          subject: params.subject,
          body_template: params.bodyTemplate,
          version: nextVersion,
          status: 'active',
        })
        .select('id')
        .single();

      if (error || !data) return { success: false, error: error?.message };
      return { success: true, templateId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao salvar template.' };
    }
  },
};
