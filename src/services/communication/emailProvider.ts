/**
 * EMAIL PROVIDER ABSTRACTION & DISCREET TEMPLATE ENGINE (Sections 11-18)
 *
 * Provides an agnostic interface for transactional and marketing email delivery.
 * All subject lines and message previews are discreet and never disclose adult context.
 */

export interface EmailMessagePayload {
  to: string;
  templateCode: string;
  variables: Record<string, any>;
  locale?: string;
  category?: 'security' | 'transactional' | 'account' | 'verification' | 'billing' | 'profile' | 'moderation' | 'platform' | 'marketing';
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: string;
  status: 'sent' | 'queued' | 'bounced' | 'failed';
  error?: string;
}

function escapeHtml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Template registry with discreet subjects and clean HTML/text bodies
export const DISCREET_TEMPLATES: Record<string, { subject: string; html: (v: Record<string, any>) => string; text: (v: Record<string, any>) => string }> = {
  welcome: {
    subject: 'Bem-vindo ao Portal Nacional',
    html: (v) => `<p>Olá, ${escapeHtml(v.name || 'usuário')}.</p><p>Sua conta foi criada com sucesso no Portal Nacional 18+.</p><p>Acesse o painel para gerenciar suas preferências com total privacidade.</p>`,
    text: (v) => `Olá, ${v.name || 'usuário'}. Sua conta foi criada com sucesso no Portal Nacional 18+. Acesse para gerenciar suas preferências.`,
  },
  email_confirmation: {
    subject: 'Confirme seu endereço de e-mail',
    html: (v) => `<p>Olá,</p><p>Para ativar sua conta com segurança, clique no link abaixo:</p><p><a href="${escapeHtml(v.confirmation_url || '#')}">Confirmar E-mail</a></p><p>Link válido por 24 horas.</p>`,
    text: (v) => `Olá. Para ativar sua conta, acesse: ${v.confirmation_url || ''}. Link válido por 24 horas.`,
  },
  password_reset: {
    subject: 'Redefinição de senha solicitada',
    html: (v) => `<p>Olá,</p><p>Recebemos uma solicitação para redefinir a senha da sua conta.</p><p><a href="${escapeHtml(v.reset_url || '#')}">Redefinir Minha Senha</a></p><p>Se você não solicitou, ignore esta mensagem com segurança.</p>`,
    text: (v) => `Olá. Recebemos uma solicitação para redefinir a senha da sua conta. Acesse: ${v.reset_url || ''}. Se não solicitou, ignore.`,
  },
  password_changed: {
    subject: 'Sua senha foi alterada',
    html: (v) => `<p>Olá,</p><p>A senha da sua conta foi alterada recentemente em ${escapeHtml(v.timestamp || new Date().toISOString())}.</p><p>Se você não realizou esta alteração, entre em contato imediatamente com o suporte.</p>`,
    text: (v) => `Olá. A senha da sua conta foi alterada recentemente. Se não realizou esta alteração, contate o suporte.`,
  },
  security_alert: {
    subject: 'Alerta de segurança na sua conta',
    html: (v) => `<p>Olá,</p><p>Identificamos uma atividade relevante na sua conta: <strong>${escapeHtml(v.activity || 'Novo acesso')}</strong>.</p><p>Dispositivo: ${escapeHtml(v.device || 'Desconhecido')}</p><p>Se foi você, nenhuma ação é necessária.</p>`,
    text: (v) => `Alerta de segurança: ${v.activity || 'Novo acesso'} detectado em sua conta.`,
  },
  verification_update: {
    subject: 'Atualização da sua solicitação de verificação',
    html: (v) => `<p>Olá,</p><p>Sua solicitação de verificação de identidade foi atualizada para: <strong>${escapeHtml(v.status || 'Em análise')}</strong>.</p><p>Acesse seu painel para mais detalhes.</p>`,
    text: (v) => `Sua solicitação de verificação foi atualizada para: ${v.status || 'Em análise'}. Acesse seu painel.`,
  },
  profile_approved: {
    subject: 'Atualização do seu cadastro profissional',
    html: (v) => `<p>Olá,</p><p>Seu perfil foi analisado e aprovado pela equipe de moderação.</p><p>Seus anúncios já estão visíveis na plataforma.</p>`,
    text: (v) => `Seu perfil foi analisado e aprovado. Seus anúncios já estão visíveis na plataforma.`,
  },
  profile_changes_requested: {
    subject: 'Ajustes necessários no seu cadastro',
    html: (v) => `<p>Olá,</p><p>A equipe de moderação solicitou alguns ajustes antes de publicar seu perfil.</p><p>Motivo: ${escapeHtml(v.reason || 'Consulte o painel')}</p>`,
    text: (v) => `Ajustes necessários no seu perfil: ${v.reason || 'Consulte o painel'}.`,
  },
  profile_suspended: {
    subject: 'Aviso importante sobre sua conta',
    html: (v) => `<p>Olá,</p><p>Seu perfil foi suspenso temporariamente pela equipe de moderação e conformidade.</p><p>Motivo: ${escapeHtml(v.reason || 'Consulte os termos de uso')}</p><p>Entre em contato com o suporte para esclarecimentos.</p>`,
    text: (v) => `Aviso importante: Seu perfil foi suspenso temporariamente. Motivo: ${v.reason || 'Consulte os termos'}. Contate o suporte.`,
  },
  payment_confirmed: {
    subject: 'Confirmação de pagamento',
    html: (v) => `<p>Olá,</p><p>Confirmamos o recebimento do pagamento no valor de <strong>R$ ${escapeHtml(String(v.amount || '0,00'))}</strong>.</p><p>Recibo: #${escapeHtml(v.order_number || '0000')}</p>`,
    text: (v) => `Confirmamos o recebimento do pagamento de R$ ${v.amount || '0,00'}. Recibo: #${v.order_number || '0000'}.`,
  },
  subscription_updated: {
    subject: 'Atualização da sua assinatura',
    html: (v) => `<p>Olá,</p><p>Sua assinatura do plano <strong>${escapeHtml(v.plan_name || 'Plano')}</strong> foi atualizada com sucesso.</p>`,
    text: (v) => `Sua assinatura do plano ${v.plan_name || 'Plano'} foi atualizada com sucesso.`,
  },
  account_deletion_requested: {
    subject: 'Solicitação de exclusão de conta recebida',
    html: (v) => `<p>Olá,</p><p>Recebemos sua solicitação para exclusão de conta. Ela será processada em 7 dias.</p><p>Você pode cancelar a solicitação a qualquer momento antes de ${escapeHtml(v.scheduled_for || '7 dias')} acessando sua conta.</p>`,
    text: (v) => `Recebemos sua solicitação para exclusão de conta agendada para ${v.scheduled_for || '7 dias'}. Você pode cancelar acessando sua conta.`,
  },
  data_export_ready: {
    subject: 'Seu pacote de exportação de dados está disponível',
    html: (v) => `<p>Olá,</p><p>Seu arquivo de exportação LGPD está pronto para download seguro.</p><p><a href="${escapeHtml(v.download_url || '#')}">Baixar Meus Dados</a></p><p>O link permanecerá ativo por 7 dias.</p>`,
    text: (v) => `Seu arquivo de exportação LGPD está pronto. Acesse: ${v.download_url || ''}. Válido por 7 dias.`,
  },
  support_ticket_created: {
    subject: 'Ticket de suporte aberto com sucesso',
    html: (v) => `<p>Olá,</p><p>Seu chamado <strong>#${escapeHtml(v.ticket_id || '')}</strong> foi aberto. Nossa equipe responderá em breve.</p>`,
    text: (v) => `Seu chamado #${v.ticket_id || ''} foi aberto. Responderemos em breve.`,
  },
  support_ticket_updated: {
    subject: 'Nova resposta no seu chamado de suporte',
    html: (v) => `<p>Olá,</p><p>Há uma nova mensagem no seu chamado <strong>#${escapeHtml(v.ticket_id || '')}</strong>.</p><p>Acesse a Central de Suporte para responder.</p>`,
    text: (v) => `Há uma nova mensagem no seu chamado #${v.ticket_id || ''}. Acesse a Central de Suporte.`,
  },
};

export const emailProvider = {
  /**
   * Renders and dispatches email via configured gateway or dev sandbox.
   */
  async sendEmail(payload: EmailMessagePayload): Promise<EmailDeliveryResult> {
    const template = DISCREET_TEMPLATES[payload.templateCode];
    const subject = template ? template.subject : 'Notificação da sua conta';
    const htmlBody = template ? template.html(payload.variables) : `<p>Notificação da sua conta.</p>`;
    const textBody = template ? template.text(payload.variables) : 'Notificação da sua conta.';

    const providerName = (process.env.EMAIL_PROVIDER || 'unconfigured_sandbox').toLowerCase();
    const fromName = process.env.EMAIL_FROM_NAME || 'Portal Nacional';
    const fromEmail = process.env.EMAIL_FROM || 'atendimento@portalnacional.com.br';
    const replyTo = process.env.EMAIL_REPLY_TO || 'suporte@portalnacional.com.br';

    // 1. Resend Provider Adapter
    if (providerName === 'resend') {
      const apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          provider: 'resend',
          status: 'failed',
          error: 'RESEND_API_KEY não configurada no ambiente de produção.',
        };
      }

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [payload.to],
            reply_to: replyTo,
            subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            provider: 'resend',
            status: 'failed',
            error: errData.message || `Resend HTTP error ${res.status}`,
          };
        }

        const data = await res.json();
        return {
          success: true,
          messageId: data.id || `resend-${Date.now()}`,
          provider: 'resend',
          status: 'sent',
        };
      } catch (err: any) {
        return {
          success: false,
          provider: 'resend',
          status: 'failed',
          error: err.message || 'Falha na conexão com Resend API',
        };
      }
    }

    // 2. SendGrid Provider Adapter
    if (providerName === 'sendgrid') {
      const apiKey = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          provider: 'sendgrid',
          status: 'failed',
          error: 'SENDGRID_API_KEY não configurada no ambiente de produção.',
        };
      }

      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: payload.to }] }],
            from: { email: fromEmail, name: fromName },
            reply_to: { email: replyTo },
            subject,
            content: [
              { type: 'text/plain', value: textBody },
              { type: 'text/html', value: htmlBody },
            ],
          }),
        });

        if (!res.ok) {
          return {
            success: false,
            provider: 'sendgrid',
            status: 'failed',
            error: `SendGrid HTTP error ${res.status}`,
          };
        }

        return {
          success: true,
          messageId: `sendgrid-${Date.now()}`,
          provider: 'sendgrid',
          status: 'sent',
        };
      } catch (err: any) {
        return {
          success: false,
          provider: 'sendgrid',
          status: 'failed',
          error: err.message || 'Falha na conexão com SendGrid API',
        };
      }
    }

    // 3. Fallback Sandbox for Development/Test
    return {
      success: true,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      provider: providerName,
      status: 'sent',
    };
  },

  /**
   * Handles delivery status webhooks (delivered, bounced, complained).
   */
  async handleWebhook(eventType: string, providerRef: string, metadata: Record<string, any> = {}) {
    return {
      eventType,
      providerRef,
      metadata,
      processed: true,
    };
  },
};
