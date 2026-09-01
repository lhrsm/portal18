export type NotificationCategory =
  | 'security'
  | 'account'
  | 'moderation'
  | 'trust_safety'
  | 'billing'
  | 'subscription'
  | 'referral'
  | 'review'
  | 'support'
  | 'system'
  | 'marketing';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms' | 'whatsapp';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type RecipientRole = 'user' | 'advertiser' | 'admin' | 'moderator' | 'support';

export type DeliveryStatus =
  | 'queued'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'retry_scheduled'
  | 'suppressed'
  | 'expired';

export interface CanonicalNotificationEvent {
  id: string;
  event_type: string;
  recipient_profile_id: string;
  recipient_role: RecipientRole;
  subject_type: string;
  subject_id: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  payload: Record<string, any>;
  dedupe_key?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'suppressed';
  created_at: string;
  expires_at?: string | null;
}

export interface NotificationDelivery {
  id: string;
  event_id: string;
  channel: NotificationChannel;
  provider: string;
  status: DeliveryStatus;
  attempt_count: number;
  provider_reference?: string | null;
  failure_reason?: string | null;
  created_at: string;
  delivered_at?: string | null;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  channel: 'in_app' | 'email' | 'push';
  locale: string;
  subject: string;
  body_template: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CommunicationCampaign {
  id: string;
  name: string;
  campaign_type: 'institutional' | 'marketing' | 'advertiser_education' | 'consumer_discovery';
  channel: 'in_app' | 'email' | 'push';
  template_key: string;
  audience_filter: Record<string, any>;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  scheduled_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_by?: string | null;
  created_at: string;
}

export type EmailProviderCode =
  | 'unconfigured'
  | 'internal_mock'
  | 'resend'
  | 'ses'
  | 'sendgrid'
  | 'postmark'
  | 'smtp';

export interface EmailProviderMetadata {
  code: EmailProviderCode;
  name: string;
  is_active: boolean;
  is_production_eligible: boolean;
  status: 'configured' | 'unconfigured' | 'mock_mode';
}

export interface DispatchNotificationParams {
  eventType: string;
  recipientProfileId: string;
  recipientRole?: RecipientRole;
  subjectType: string;
  subjectId: string;
  priority?: NotificationPriority;
  category: NotificationCategory;
  payload: {
    title?: string;
    message?: string;
    action_url?: string;
    variables?: Record<string, string | number>;
    [key: string]: any;
  };
  dedupeKey?: string;
}
