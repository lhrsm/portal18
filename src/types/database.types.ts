export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = 'user' | 'advertiser' | 'moderator' | 'admin' | 'super_admin';
export type ProfileStatus = 'draft' | 'pending_review' | 'approved' | 'active' | 'rejected' | 'suspended' | 'archived';
export type VerificationStatus = 'not_started' | 'pending' | 'processing' | 'verified' | 'rejected' | 'requires_review' | 'expired';
export type Visibility = 'public' | 'unlisted' | 'hidden' | 'private';
export type MediaType = 'image' | 'video';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'blocked';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
export type LegalDocumentType = 'terms' | 'privacy' | 'cookies' | 'community_guidelines' | 'advertiser_terms';
export type ConsentType = 'age_declaration' | 'terms' | 'privacy' | 'marketing_email' | 'analytics' | 'advertiser_terms' | 'subscription_terms' | 'recurring_billing' | 'promotion_purchase_terms';
export type ContactType = 'whatsapp' | 'telegram' | 'phone' | 'website';

export type BillingInterval = 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type SubscriptionStatus = 'incomplete' | 'pending' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'suspended';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded' | 'chargeback' | 'disputed';
export type PaymentType = 'subscription' | 'boost' | 'featured_placement' | 'campaign' | 'other_platform_product';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
export type CampaignStatus = 'pending_payment' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'suspended';
export type PromotionPlacement = 'homepage_featured' | 'city_top' | 'category_top' | 'search_sponsored' | 'profile_recommendation';
export type DiscountType = 'percentage' | 'fixed';

export type ProcessingStatus = 'uploaded' | 'queued' | 'processing' | 'processed' | 'failed';
export type ModerationRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type ModerationCategory = 'suspected_minor' | 'non_consensual' | 'violence' | 'illegal_content' | 'impersonation' | 'privacy_exposure' | 'policy_violation' | 'uncertain';

export type LocationPrecision = 'city' | 'district' | 'approximate';
export type ActivityBucket = 'active_now' | 'recently_active' | 'active_today' | 'active_this_week' | 'inactive';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          account_type: AccountType;
          display_name: string | null;
          username: string | null;
          avatar_path: string | null;
          status: 'active' | 'suspended' | 'deactivated' | 'banned';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          account_type?: AccountType;
          display_name?: string | null;
          username?: string | null;
          avatar_path?: string | null;
          status?: 'active' | 'suspended' | 'deactivated' | 'banned';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          account_type?: AccountType;
          display_name?: string | null;
          username?: string | null;
          avatar_path?: string | null;
          status?: 'active' | 'suspended' | 'deactivated' | 'banned';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          profile_id: string;
          role: AccountType;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          role: AccountType;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          role?: AccountType;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      brazil_states: {
        Row: {
          id: string;
          code: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      brazil_cities: {
        Row: {
          id: string;
          state_id: string;
          ibge_code: string | null;
          name: string;
          slug: string;
          latitude: number | null;
          longitude: number | null;
          population: number | null;
          capital: boolean;
          region: string | null;
        };
        Insert: {
          id?: string;
          state_id: string;
          ibge_code?: string | null;
          name: string;
          slug: string;
          latitude?: number | null;
          longitude?: number | null;
          population?: number | null;
          capital?: boolean;
          region?: string | null;
        };
        Update: {
          id?: string;
          state_id?: string;
          ibge_code?: string | null;
          name?: string;
          slug?: string;
          latitude?: number | null;
          longitude?: number | null;
          population?: number | null;
          capital?: boolean;
          region?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          status: 'active' | 'inactive' | 'hidden';
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: 'active' | 'inactive' | 'hidden';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          status?: 'active' | 'inactive' | 'hidden';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      advertiser_profiles: {
        Row: {
          id: string;
          profile_id: string;
          slug: string;
          stage_name: string;
          headline: string | null;
          bio: string | null;
          birth_date: string;
          gender: string | null;
          presentation: string | null;
          state_id: string | null;
          city_id: string | null;
          neighborhood: string | null;
          verification_status: VerificationStatus;
          profile_status: ProfileStatus;
          visibility: Visibility;
          onboarding_step: number;
          onboarding_completed: boolean;
          submitted_at: string | null;
          rejection_reason: string | null;
          moderation_notes: string | null;
          review_feedback: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          published_at: string | null;
          last_active_at: string | null;
          location_precision: LocationPrecision;
          approx_latitude: number | null;
          approx_longitude: number | null;
          location_updated_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          slug: string;
          stage_name: string;
          headline?: string | null;
          bio?: string | null;
          birth_date: string;
          gender?: string | null;
          presentation?: string | null;
          state_id?: string | null;
          city_id?: string | null;
          neighborhood?: string | null;
          verification_status?: VerificationStatus;
          profile_status?: ProfileStatus;
          visibility?: Visibility;
          onboarding_step?: number;
          onboarding_completed?: boolean;
          submitted_at?: string | null;
          rejection_reason?: string | null;
          moderation_notes?: string | null;
          review_feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          published_at?: string | null;
          last_active_at?: string | null;
          location_precision?: LocationPrecision;
          approx_latitude?: number | null;
          approx_longitude?: number | null;
          location_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          slug?: string;
          stage_name?: string;
          headline?: string | null;
          bio?: string | null;
          birth_date?: string;
          gender?: string | null;
          presentation?: string | null;
          state_id?: string | null;
          city_id?: string | null;
          neighborhood?: string | null;
          verification_status?: VerificationStatus;
          profile_status?: ProfileStatus;
          visibility?: Visibility;
          onboarding_step?: number;
          onboarding_completed?: boolean;
          submitted_at?: string | null;
          rejection_reason?: string | null;
          moderation_notes?: string | null;
          review_feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          published_at?: string | null;
          last_active_at?: string | null;
          location_precision?: LocationPrecision;
          approx_latitude?: number | null;
          approx_longitude?: number | null;
          location_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      advertiser_categories: {
        Row: {
          advertiser_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          advertiser_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          advertiser_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      advertiser_media: {
        Row: {
          id: string;
          advertiser_id: string;
          media_type: MediaType;
          storage_path: string;
          storage_path_original: string | null;
          thumbnail_path: string | null;
          card_path: string | null;
          profile_path: string | null;
          full_path: string | null;
          video_thumbnail_path: string | null;
          position: number;
          is_primary: boolean;
          visibility: Visibility;
          processing_status: ProcessingStatus;
          processing_error: string | null;
          moderation_status: ModerationStatus;
          moderation_reason: string | null;
          content_hash: string | null;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          file_size: number | null;
          mime_type: string | null;
          watermark_applied: boolean;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          media_type: MediaType;
          storage_path: string;
          storage_path_original?: string | null;
          thumbnail_path?: string | null;
          card_path?: string | null;
          profile_path?: string | null;
          full_path?: string | null;
          video_thumbnail_path?: string | null;
          position?: number;
          is_primary?: boolean;
          visibility?: Visibility;
          processing_status?: ProcessingStatus;
          processing_error?: string | null;
          moderation_status?: ModerationStatus;
          moderation_reason?: string | null;
          content_hash?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          mime_type?: string | null;
          watermark_applied?: boolean;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          media_type?: MediaType;
          storage_path?: string;
          storage_path_original?: string | null;
          thumbnail_path?: string | null;
          card_path?: string | null;
          profile_path?: string | null;
          full_path?: string | null;
          video_thumbnail_path?: string | null;
          position?: number;
          is_primary?: boolean;
          visibility?: Visibility;
          processing_status?: ProcessingStatus;
          processing_error?: string | null;
          moderation_status?: ModerationStatus;
          moderation_reason?: string | null;
          content_hash?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          mime_type?: string | null;
          watermark_applied?: boolean;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_profile_id: string;
          advertiser_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_profile_id: string;
          advertiser_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_profile_id?: string;
          advertiser_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_profile_id: string | null;
          target_type: 'advertiser' | 'media' | 'review' | 'user';
          target_id: string;
          reason: string;
          description: string | null;
          severity: ReportSeverity;
          status: ReportStatus;
          assigned_to: string | null;
          resolution_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          reporter_profile_id?: string | null;
          target_type: 'advertiser' | 'media' | 'review' | 'user';
          target_id: string;
          reason: string;
          description?: string | null;
          severity?: ReportSeverity;
          status?: ReportStatus;
          assigned_to?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          reporter_profile_id?: string | null;
          target_type?: 'advertiser' | 'media' | 'review' | 'user';
          target_id?: string;
          reason?: string;
          description?: string | null;
          severity?: ReportSeverity;
          status?: ReportStatus;
          assigned_to?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          advertiser_id: string;
          provider: string;
          provider_reference: string | null;
          status: VerificationStatus;
          verification_type: string;
          age_verified: boolean;
          identity_verified: boolean;
          result_code: string | null;
          idempotency_key: string | null;
          retry_count: number;
          retry_available_at: string | null;
          started_at: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          completed_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          provider?: string;
          provider_reference?: string | null;
          status?: VerificationStatus;
          verification_type?: string;
          age_verified?: boolean;
          identity_verified?: boolean;
          result_code?: string | null;
          idempotency_key?: string | null;
          retry_count?: number;
          retry_available_at?: string | null;
          started_at?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          provider?: string;
          provider_reference?: string | null;
          status?: VerificationStatus;
          verification_type?: string;
          age_verified?: boolean;
          identity_verified?: boolean;
          result_code?: string | null;
          idempotency_key?: string | null;
          retry_count?: number;
          retry_available_at?: string | null;
          started_at?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          event_id: string;
          event_type: string;
          payload_hash: string;
          status: string;
          received_at: string;
          processed_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          event_id: string;
          event_type: string;
          payload_hash: string;
          status?: string;
          received_at?: string;
          processed_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          event_id?: string;
          event_type?: string;
          payload_hash?: string;
          status?: string;
          received_at?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_profile_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_profile_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_hash?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      legal_documents: {
        Row: {
          id: string;
          document_type: LegalDocumentType;
          version: string;
          title: string;
          content_url: string | null;
          active: boolean;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_type: LegalDocumentType;
          version: string;
          title: string;
          content_url?: string | null;
          active?: boolean;
          published_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_type?: LegalDocumentType;
          version?: string;
          title?: string;
          content_url?: string | null;
          active?: boolean;
          published_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          id: string;
          profile_id: string;
          consent_type: ConsentType;
          document_id: string | null;
          granted: boolean;
          source: string;
          created_at: string;
          revoked_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          profile_id: string;
          consent_type: ConsentType;
          document_id?: string | null;
          granted?: boolean;
          source?: string;
          created_at?: string;
          revoked_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          profile_id?: string;
          consent_type?: ConsentType;
          document_id?: string | null;
          granted?: boolean;
          source?: string;
          created_at?: string;
          revoked_at?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      advertiser_contacts: {
        Row: {
          id: string;
          advertiser_id: string;
          contact_type: ContactType;
          contact_value: string;
          is_primary: boolean;
          is_visible: boolean;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          contact_type: ContactType;
          contact_value: string;
          is_primary?: boolean;
          is_visible?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          contact_type?: ContactType;
          contact_value?: string;
          is_primary?: boolean;
          is_visible?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_contact_events: {
        Row: {
          id: string;
          advertiser_id: string;
          contact_type: ContactType;
          viewer_profile_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          contact_type: ContactType;
          viewer_profile_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          contact_type?: ContactType;
          viewer_profile_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      advertiser_daily_stats: {
        Row: {
          id: string;
          advertiser_id: string;
          date: string;
          views: number;
          contact_clicks: number;
          favorites_added: number;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          date?: string;
          views?: number;
          contact_clicks?: number;
          favorites_added?: number;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          date?: string;
          views?: number;
          contact_clicks?: number;
          favorites_added?: number;
        };
        Relationships: [];
      };
      advertiser_profile_history: {
        Row: {
          id: string;
          advertiser_id: string;
          changed_by: string;
          change_type: string;
          changed_fields: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          changed_by: string;
          change_type: string;
          changed_fields?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          changed_by?: string;
          change_type?: string;
          changed_fields?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          message: string;
          read_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          title: string;
          message: string;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: string;
          title?: string;
          message?: string;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      moderation_notes: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          author_profile_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          author_profile_id: string;
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          author_profile_id?: string;
          note?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      moderation_feedback: {
        Row: {
          id: string;
          advertiser_id: string;
          entity_type: string;
          entity_id: string;
          message: string;
          created_by: string;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          entity_type: string;
          entity_id: string;
          message: string;
          created_by: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          entity_type?: string;
          entity_id?: string;
          message?: string;
          created_by?: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_amount: number;
          currency: string;
          billing_interval: BillingInterval;
          status: string;
          sort_order: number;
          features: Json;
          media_limit: number;
          video_limit: number;
          boost_allowance: number;
          analytics_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price_amount: number;
          currency?: string;
          billing_interval?: BillingInterval;
          status?: string;
          sort_order?: number;
          features?: Json;
          media_limit?: number;
          video_limit?: number;
          boost_allowance?: number;
          analytics_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_amount?: number;
          currency?: string;
          billing_interval?: BillingInterval;
          status?: string;
          sort_order?: number;
          features?: Json;
          media_limit?: number;
          video_limit?: number;
          boost_allowance?: number;
          analytics_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          advertiser_id: string;
          plan_id: string;
          provider: string;
          provider_customer_reference: string | null;
          provider_subscription_reference: string | null;
          status: SubscriptionStatus;
          billing_interval: BillingInterval;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          plan_id: string;
          provider?: string;
          provider_customer_reference?: string | null;
          provider_subscription_reference?: string | null;
          status?: SubscriptionStatus;
          billing_interval?: BillingInterval;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          plan_id?: string;
          provider?: string;
          provider_customer_reference?: string | null;
          provider_subscription_reference?: string | null;
          status?: SubscriptionStatus;
          billing_interval?: BillingInterval;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          advertiser_id: string;
          order_number: string;
          status: OrderStatus;
          subtotal: number;
          discount_amount: number;
          total_amount: number;
          currency: string;
          coupon_id: string | null;
          idempotency_key: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          order_number: string;
          status?: OrderStatus;
          subtotal: number;
          discount_amount?: number;
          total_amount: number;
          currency?: string;
          coupon_id?: string | null;
          idempotency_key?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          order_number?: string;
          status?: OrderStatus;
          subtotal?: number;
          discount_amount?: number;
          total_amount?: number;
          currency?: string;
          coupon_id?: string | null;
          idempotency_key?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_type: PaymentType;
          product_id: string;
          description_snapshot: string;
          quantity: number;
          unit_amount: number;
          total_amount: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_type: PaymentType;
          product_id: string;
          description_snapshot: string;
          quantity?: number;
          unit_amount: number;
          total_amount: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_type?: PaymentType;
          product_id?: string;
          description_snapshot?: string;
          quantity?: number;
          unit_amount?: number;
          total_amount?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          advertiser_id: string;
          subscription_id: string | null;
          order_id: string | null;
          provider: string;
          provider_payment_reference: string | null;
          payment_type: PaymentType;
          amount: number;
          currency: string;
          status: PaymentStatus;
          paid_at: string | null;
          failed_at: string | null;
          refunded_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          subscription_id?: string | null;
          order_id?: string | null;
          provider?: string;
          provider_payment_reference?: string | null;
          payment_type: PaymentType;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          paid_at?: string | null;
          failed_at?: string | null;
          refunded_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          subscription_id?: string | null;
          order_id?: string | null;
          provider?: string;
          provider_payment_reference?: string | null;
          payment_type?: PaymentType;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          paid_at?: string | null;
          failed_at?: string | null;
          refunded_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      promotion_products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: PaymentType;
          description: string | null;
          duration_hours: number;
          price_amount: number;
          currency: string;
          status: string;
          placement: PromotionPlacement;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type?: PaymentType;
          description?: string | null;
          duration_hours?: number;
          price_amount: number;
          currency?: string;
          status?: string;
          placement?: PromotionPlacement;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          type?: PaymentType;
          description?: string | null;
          duration_hours?: number;
          price_amount?: number;
          currency?: string;
          status?: string;
          placement?: PromotionPlacement;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      advertiser_campaigns: {
        Row: {
          id: string;
          advertiser_id: string;
          product_id: string;
          order_id: string | null;
          status: CampaignStatus;
          starts_at: string | null;
          ends_at: string | null;
          placement: PromotionPlacement;
          impressions: number;
          clicks: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          product_id: string;
          order_id?: string | null;
          status?: CampaignStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          placement: PromotionPlacement;
          impressions?: number;
          clicks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          product_id?: string;
          order_id?: string | null;
          status?: CampaignStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          placement?: PromotionPlacement;
          impressions?: number;
          clicks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_daily_stats: {
        Row: {
          id: string;
          campaign_id: string;
          date: string;
          impressions: number;
          clicks: number;
          profile_views: number;
          contact_clicks: number;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          date?: string;
          impressions?: number;
          clicks?: number;
          profile_views?: number;
          contact_clicks?: number;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          date?: string;
          impressions?: number;
          clicks?: number;
          profile_views?: number;
          contact_clicks?: number;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: DiscountType;
          discount_value: number;
          starts_at: string | null;
          expires_at: string | null;
          usage_limit: number | null;
          usage_count: number;
          status: string;
          applicable_product_type: PaymentType | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type?: DiscountType;
          discount_value: number;
          starts_at?: string | null;
          expires_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          status?: string;
          applicable_product_type?: PaymentType | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          starts_at?: string | null;
          expires_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          status?: string;
          applicable_product_type?: PaymentType | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          advertiser_id: string;
          order_id: string;
          discount_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          advertiser_id: string;
          order_id: string;
          discount_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          advertiser_id?: string;
          order_id?: string;
          discount_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      media_processing_jobs: {
        Row: {
          id: string;
          media_id: string;
          job_type: string;
          status: 'queued' | 'processing' | 'completed' | 'failed' | 'failed_permanent';
          attempts: number;
          max_attempts: number;
          started_at: string | null;
          finished_at: string | null;
          error_code: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          job_type: string;
          status?: 'queued' | 'processing' | 'completed' | 'failed' | 'failed_permanent';
          attempts?: number;
          max_attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
          error_code?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          media_id?: string;
          job_type?: string;
          status?: 'queued' | 'processing' | 'completed' | 'failed' | 'failed_permanent';
          attempts?: number;
          max_attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
          error_code?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_media_hashes: {
        Row: {
          id: string;
          hash_type: string;
          hash_value: string;
          reason: string;
          source_media_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hash_type?: string;
          hash_value: string;
          reason: string;
          source_media_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          hash_type?: string;
          hash_value?: string;
          reason?: string;
          source_media_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      automated_moderation_results: {
        Row: {
          id: string;
          media_id: string;
          provider: string;
          provider_reference: string | null;
          status: string;
          risk_level: ModerationRiskLevel;
          categories: Json;
          result_summary: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          provider?: string;
          provider_reference?: string | null;
          status?: string;
          risk_level?: ModerationRiskLevel;
          categories?: Json;
          result_summary?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          media_id?: string;
          provider?: string;
          provider_reference?: string | null;
          status?: string;
          risk_level?: ModerationRiskLevel;
          categories?: Json;
          result_summary?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      media_upload_reservations: {
        Row: {
          id: string;
          advertiser_id: string;
          media_type: MediaType;
          reserved_bytes: number;
          status: 'active' | 'consumed' | 'cancelled' | 'expired';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          media_type: MediaType;
          reserved_bytes?: number;
          status?: 'active' | 'consumed' | 'cancelled' | 'expired';
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          media_type?: MediaType;
          reserved_bytes?: number;
          status?: 'active' | 'consumed' | 'cancelled' | 'expired';
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      advertiser_ranking_scores: {
        Row: {
          advertiser_id: string;
          organic_score: number;
          completeness_score: number;
          verification_score: number;
          activity_score: number;
          freshness_score: number;
          quality_score: number;
          engagement_score: number;
          trust_score: number;
          calculated_at: string;
        };
        Insert: {
          advertiser_id: string;
          organic_score?: number;
          completeness_score?: number;
          verification_score?: number;
          activity_score?: number;
          freshness_score?: number;
          quality_score?: number;
          engagement_score?: number;
          trust_score?: number;
          calculated_at?: string;
        };
        Update: {
          advertiser_id?: string;
          organic_score?: number;
          completeness_score?: number;
          verification_score?: number;
          activity_score?: number;
          freshness_score?: number;
          quality_score?: number;
          engagement_score?: number;
          trust_score?: number;
          calculated_at?: string;
        };
        Relationships: [];
      };
      ranking_weights: {
        Row: {
          id: string;
          completeness_weight: number;
          verification_weight: number;
          activity_weight: number;
          freshness_weight: number;
          quality_weight: number;
          engagement_weight: number;
          trust_weight: number;
          exploration_factor: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          completeness_weight?: number;
          verification_weight?: number;
          activity_weight?: number;
          freshness_weight?: number;
          quality_weight?: number;
          engagement_weight?: number;
          trust_weight?: number;
          exploration_factor?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          completeness_weight?: number;
          verification_weight?: number;
          activity_weight?: number;
          freshness_weight?: number;
          quality_weight?: number;
          engagement_weight?: number;
          trust_weight?: number;
          exploration_factor?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      profile_follows: {
        Row: {
          id: string;
          follower_profile_id: string;
          advertiser_id: string;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          follower_profile_id: string;
          advertiser_id: string;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          follower_profile_id?: string;
          advertiser_id?: string;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_view_history: {
        Row: {
          id: string;
          viewer_profile_id: string;
          advertiser_id: string;
          first_viewed_at: string;
          last_viewed_at: string;
          view_count: number;
        };
        Insert: {
          id?: string;
          viewer_profile_id: string;
          advertiser_id: string;
          first_viewed_at?: string;
          last_viewed_at?: string;
          view_count?: number;
        };
        Update: {
          id?: string;
          viewer_profile_id?: string;
          advertiser_id?: string;
          first_viewed_at?: string;
          last_viewed_at?: string;
          view_count?: number;
        };
        Relationships: [];
      };
      user_lists: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_list_items: {
        Row: {
          id: string;
          list_id: string;
          advertiser_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          advertiser_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          advertiser_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_profile_id: string;
          blocked_advertiser_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_profile_id: string;
          blocked_advertiser_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_profile_id?: string;
          blocked_advertiser_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          profile_id: string;
          preferred_city_id: string | null;
          age_min: number;
          age_max: number;
          verified_only: boolean;
          recently_active_only: boolean;
          personalization_enabled: boolean;
          history_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          preferred_city_id?: string | null;
          age_min?: number;
          age_max?: number;
          verified_only?: boolean;
          recently_active_only?: boolean;
          personalization_enabled?: boolean;
          history_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          preferred_city_id?: string | null;
          age_min?: number;
          age_max?: number;
          verified_only?: boolean;
          recently_active_only?: boolean;
          personalization_enabled?: boolean;
          history_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferred_categories: {
        Row: {
          profile_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          profile_id: string;
          channel: 'in_app' | 'email' | 'push';
          category: 'transactional' | 'security' | 'profile_updates' | 'platform_news' | 'marketing';
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          channel: 'in_app' | 'email' | 'push';
          category: 'transactional' | 'security' | 'profile_updates' | 'platform_news' | 'marketing';
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          channel?: 'in_app' | 'email' | 'push';
          category?: 'transactional' | 'security' | 'profile_updates' | 'platform_news' | 'marketing';
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_hidden_recommendations: {
        Row: {
          id: string;
          profile_id: string;
          advertiser_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          advertiser_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          advertiser_id?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_jobs: {
        Row: {
          id: string;
          event_type: string;
          entity_id: string;
          status: 'queued' | 'processing' | 'completed' | 'failed';
          cursor: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          entity_id: string;
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          cursor?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          entity_id?: string;
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          cursor?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      communication_jobs: {
        Row: {
          id: string;
          profile_id: string | null;
          channel: 'in_app' | 'email' | 'push';
          category: 'security' | 'transactional' | 'account' | 'verification' | 'billing' | 'profile' | 'moderation' | 'platform' | 'marketing';
          template_code: string;
          payload: Json;
          status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'dead_letter';
          priority: 'low' | 'normal' | 'high' | 'critical';
          attempts: number;
          max_attempts: number;
          scheduled_at: string;
          started_at: string | null;
          completed_at: string | null;
          failed_at: string | null;
          error_message: string | null;
          dedupe_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          channel: 'in_app' | 'email' | 'push';
          category: 'security' | 'transactional' | 'account' | 'verification' | 'billing' | 'profile' | 'moderation' | 'platform' | 'marketing';
          template_code: string;
          payload?: Json;
          status?: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'dead_letter';
          priority?: 'low' | 'normal' | 'high' | 'critical';
          attempts?: number;
          max_attempts?: number;
          scheduled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          channel?: 'in_app' | 'email' | 'push';
          category?: 'security' | 'transactional' | 'account' | 'verification' | 'billing' | 'profile' | 'moderation' | 'platform' | 'marketing';
          template_code?: string;
          payload?: Json;
          status?: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'dead_letter';
          priority?: 'low' | 'normal' | 'high' | 'critical';
          attempts?: number;
          max_attempts?: number;
          scheduled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      communication_templates: {
        Row: {
          id: string;
          code: string;
          channel: 'in_app' | 'email' | 'push';
          locale: string;
          subject: string;
          content_html: string;
          content_text: string;
          version: number;
          status: 'active' | 'draft' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          channel: 'in_app' | 'email' | 'push';
          locale?: string;
          subject: string;
          content_html: string;
          content_text: string;
          version?: number;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          channel?: 'in_app' | 'email' | 'push';
          locale?: string;
          subject?: string;
          content_html?: string;
          content_text?: string;
          version?: number;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      communication_delivery_events: {
        Row: {
          id: string;
          job_id: string;
          provider: string;
          provider_reference: string | null;
          event_type: 'delivered' | 'bounced' | 'complained' | 'deferred' | 'opened' | 'clicked';
          occurred_at: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          provider: string;
          provider_reference?: string | null;
          event_type: 'delivered' | 'bounced' | 'complained' | 'deferred' | 'opened' | 'clicked';
          occurred_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          provider?: string;
          provider_reference?: string | null;
          event_type?: 'delivered' | 'bounced' | 'complained' | 'deferred' | 'opened' | 'clicked';
          occurred_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent_hash: string | null;
          created_at: string;
          updated_at: string;
          last_used_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent_hash?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent_hash?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      help_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          status: 'active' | 'draft' | 'archived';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
        };
        Relationships: [];
      };
      help_articles: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          slug: string;
          summary: string | null;
          content: string;
          status: 'published' | 'draft' | 'archived';
          sort_order: number;
          helpful_count: number;
          unhelpful_count: number;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          title: string;
          slug: string;
          summary?: string | null;
          content: string;
          status?: 'published' | 'draft' | 'archived';
          sort_order?: number;
          helpful_count?: number;
          unhelpful_count?: number;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          title?: string;
          slug?: string;
          summary?: string | null;
          content?: string;
          status?: 'published' | 'draft' | 'archived';
          sort_order?: number;
          helpful_count?: number;
          unhelpful_count?: number;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          profile_id: string;
          category: 'account' | 'security' | 'verification' | 'profile' | 'media' | 'billing' | 'technical' | 'privacy' | 'report' | 'other';
          subject: string;
          description: string;
          priority: 'low' | 'normal' | 'high' | 'critical';
          status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          category: 'account' | 'security' | 'verification' | 'profile' | 'media' | 'billing' | 'technical' | 'privacy' | 'report' | 'other';
          subject: string;
          description: string;
          priority?: 'low' | 'normal' | 'high' | 'critical';
          status?: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          category?: 'account' | 'security' | 'verification' | 'profile' | 'media' | 'billing' | 'technical' | 'privacy' | 'report' | 'other';
          subject?: string;
          description?: string;
          priority?: 'low' | 'normal' | 'high' | 'critical';
          status?: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_profile_id: string;
          author_type: 'user' | 'staff' | 'system';
          message: string;
          attachments: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_profile_id: string;
          author_type: 'user' | 'staff' | 'system';
          message: string;
          attachments?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_profile_id?: string;
          author_type?: 'user' | 'staff' | 'system';
          message?: string;
          attachments?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      data_export_requests: {
        Row: {
          id: string;
          profile_id: string;
          status: 'requested' | 'processing' | 'ready' | 'failed' | 'expired';
          requested_at: string;
          processing_started_at: string | null;
          completed_at: string | null;
          expires_at: string | null;
          storage_path: string | null;
          file_size_bytes: number | null;
          download_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          status?: 'requested' | 'processing' | 'ready' | 'failed' | 'expired';
          requested_at?: string;
          processing_started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          storage_path?: string | null;
          file_size_bytes?: number | null;
          download_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          status?: 'requested' | 'processing' | 'ready' | 'failed' | 'expired';
          requested_at?: string;
          processing_started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          storage_path?: string | null;
          file_size_bytes?: number | null;
          download_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          id: string;
          profile_id: string;
          status: 'requested' | 'scheduled' | 'cancelled' | 'processing' | 'completed' | 'failed' | 'blocked';
          requested_at: string;
          scheduled_for: string;
          cancelled_at: string | null;
          executed_at: string | null;
          reason_optional: string | null;
          blocked_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          status?: 'requested' | 'scheduled' | 'cancelled' | 'processing' | 'completed' | 'failed' | 'blocked';
          requested_at?: string;
          scheduled_for: string;
          cancelled_at?: string | null;
          executed_at?: string | null;
          reason_optional?: string | null;
          blocked_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          status?: 'requested' | 'scheduled' | 'cancelled' | 'processing' | 'completed' | 'failed' | 'blocked';
          requested_at?: string;
          scheduled_for?: string;
          cancelled_at?: string | null;
          executed_at?: string | null;
          reason_optional?: string | null;
          blocked_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_holds: {
        Row: {
          id: string;
          entity_type: 'profile' | 'advertiser' | 'payment' | 'media' | 'ticket';
          entity_id: string;
          reason: string;
          created_by: string;
          created_at: string;
          released_at: string | null;
          released_by: string | null;
        };
        Insert: {
          id?: string;
          entity_type: 'profile' | 'advertiser' | 'payment' | 'media' | 'ticket';
          entity_id: string;
          reason: string;
          created_by: string;
          created_at?: string;
          released_at?: string | null;
          released_by?: string | null;
        };
        Update: {
          id?: string;
          entity_type?: 'profile' | 'advertiser' | 'payment' | 'media' | 'ticket';
          entity_id?: string;
          reason?: string;
          created_by?: string;
          created_at?: string;
          released_at?: string | null;
          released_by?: string | null;
        };
        Relationships: [];
      };
      data_retention_policies: {
        Row: {
          id: string;
          policy_key: string;
          retention_days: number;
          description: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          policy_key: string;
          retention_days: number;
          description: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          policy_key?: string;
          retention_days?: number;
          description?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_mfa_factors: {
        Row: {
          id: string;
          profile_id: string;
          factor_type: 'totp' | 'phone' | 'recovery_code';
          status: 'unverified' | 'verified' | 'disabled';
          secret_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          factor_type: 'totp' | 'phone' | 'recovery_code';
          status?: 'unverified' | 'verified' | 'disabled';
          secret_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          factor_type?: 'totp' | 'phone' | 'recovery_code';
          status?: 'unverified' | 'verified' | 'disabled';
          secret_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_recovery_codes: {
        Row: {
          id: string;
          profile_id: string;
          code_hash: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          code_hash: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          code_hash?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          profile_id: string;
          session_reference_hash: string;
          device_id: string;
          user_agent_summary: string;
          ip_hash: string;
          country: string | null;
          region: string | null;
          created_at: string;
          last_seen_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          session_reference_hash: string;
          device_id: string;
          user_agent_summary: string;
          ip_hash: string;
          country?: string | null;
          region?: string | null;
          created_at?: string;
          last_seen_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          session_reference_hash?: string;
          device_id?: string;
          user_agent_summary?: string;
          ip_hash?: string;
          country?: string | null;
          region?: string | null;
          created_at?: string;
          last_seen_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      trusted_devices: {
        Row: {
          id: string;
          profile_id: string;
          device_token_hash: string;
          device_name: string;
          first_seen_at: string;
          last_seen_at: string;
          trusted_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          device_token_hash: string;
          device_name: string;
          first_seen_at?: string;
          last_seen_at?: string;
          trusted_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          device_token_hash?: string;
          device_name?: string;
          first_seen_at?: string;
          last_seen_at?: string;
          trusted_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      security_events: {
        Row: {
          id: string;
          profile_id: string | null;
          event_type: string;
          severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
          risk_score: number;
          ip_hash: string;
          device_id: string | null;
          metadata: Json;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          event_type: string;
          severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
          risk_score?: number;
          ip_hash: string;
          device_id?: string | null;
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          event_type?: string;
          severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
          risk_score?: number;
          ip_hash?: string;
          device_id?: string | null;
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      risk_events: {
        Row: {
          id: string;
          profile_id: string | null;
          advertiser_id: string | null;
          risk_type: string;
          severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
          score_delta: number;
          source: string;
          status: 'open' | 'resolved' | 'false_positive' | 'confirmed';
          metadata: Json;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          advertiser_id?: string | null;
          risk_type: string;
          severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
          score_delta?: number;
          source?: string;
          status?: 'open' | 'resolved' | 'false_positive' | 'confirmed';
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          advertiser_id?: string | null;
          risk_type?: string;
          severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
          score_delta?: number;
          source?: string;
          status?: 'open' | 'resolved' | 'false_positive' | 'confirmed';
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [];
      };
      account_risk_scores: {
        Row: {
          profile_id: string;
          score: number;
          risk_level: 'low' | 'medium' | 'high' | 'critical';
          last_calculated_at: string;
        };
        Insert: {
          profile_id: string;
          score?: number;
          risk_level?: 'low' | 'medium' | 'high' | 'critical';
          last_calculated_at?: string;
        };
        Update: {
          profile_id?: string;
          score?: number;
          risk_level?: 'low' | 'medium' | 'high' | 'critical';
          last_calculated_at?: string;
        };
        Relationships: [];
      };
      risk_rules: {
        Row: {
          id: string;
          code: string;
          event_type: string;
          score_delta: number;
          threshold: number;
          action: 'log' | 'notify' | 'challenge' | 'rate_limit' | 'manual_review' | 'temporary_block' | 'suspend';
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          event_type: string;
          score_delta: number;
          threshold?: number;
          action: 'log' | 'notify' | 'challenge' | 'rate_limit' | 'manual_review' | 'temporary_block' | 'suspend';
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          event_type?: string;
          score_delta?: number;
          threshold?: number;
          action?: 'log' | 'notify' | 'challenge' | 'rate_limit' | 'manual_review' | 'temporary_block' | 'suspend';
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          severity: 'minor' | 'major' | 'critical';
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          started_at: string;
          resolved_at: string | null;
          public_message: string;
          internal_summary: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          severity: 'minor' | 'major' | 'critical';
          status?: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          started_at?: string;
          resolved_at?: string | null;
          public_message: string;
          internal_summary: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          severity?: 'minor' | 'major' | 'critical';
          status?: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          started_at?: string;
          resolved_at?: string | null;
          public_message?: string;
          internal_summary?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_kill_switches: {
        Row: {
          id: string;
          switch_key: string;
          enabled: boolean;
          reason: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          switch_key: string;
          enabled?: boolean;
          reason?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          switch_key?: string;
          enabled?: boolean;
          reason?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_advertiser_profiles: {
        Row: {
          advertiser_id: string;
          profile_id: string;
          slug: string;
          stage_name: string;
          headline: string | null;
          bio: string | null;
          age: number;
          gender: string | null;
          presentation: string | null;
          state_id: string | null;
          state_code: string | null;
          state_name: string | null;
          state_slug: string | null;
          city_id: string | null;
          city_name: string | null;
          city_slug: string | null;
          neighborhood: string | null;
          verification_status: VerificationStatus;
          profile_status: ProfileStatus;
          visibility: Visibility;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
          primary_photo_url: string | null;
          approved_media_count: number;
          category_ids: string[];
        };
        Relationships: [];
      };
    };
    Functions: {
      current_profile_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      has_role: {
        Args: { role_name: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_moderator: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      owns_advertiser: {
        Args: { target_advertiser_id: string };
        Returns: boolean;
      };
      generate_available_advertiser_slug: {
        Args: { p_base_name: string };
        Returns: string;
      };
      become_advertiser: {
        Args: { p_terms_accepted: boolean; p_is_adult: boolean };
        Returns: { success: boolean; advertiser_id: string; already_existed: boolean };
      };
      increment_profile_view: {
        Args: { p_advertiser_id: string };
        Returns: void;
      };
      increment_contact_click: {
        Args: { p_advertiser_id: string; p_contact_type: string };
        Returns: void;
      };
      reorder_advertiser_media: {
        Args: { p_advertiser_id: string; p_media_ids: string[] };
        Returns: boolean;
      };
      submit_advertiser_profile: {
        Args: { p_advertiser_id: string };
        Returns: { success: boolean; status: string; message: string; missing_requirements?: string[]; error?: string };
      };
      approve_advertiser_profile: {
        Args: { p_advertiser_id: string };
        Returns: { success: boolean; status: string; message: string };
      };
      request_changes_advertiser_profile: {
        Args: { p_advertiser_id: string; p_feedback: string };
        Returns: { success: boolean; status: string; message: string };
      };
      reject_advertiser_profile: {
        Args: { p_advertiser_id: string; p_reason: string };
        Returns: { success: boolean; status: string };
      };
      suspend_advertiser_profile: {
        Args: { p_advertiser_id: string; p_reason: string };
        Returns: { success: boolean; status: string };
      };
      reactivate_advertiser_profile: {
        Args: { p_advertiser_id: string };
        Returns: { success: boolean; status: string };
      };
      approve_advertiser_media: {
        Args: { p_media_id: string };
        Returns: { success: boolean; status: string };
      };
      reject_advertiser_media: {
        Args: { p_media_id: string; p_reason: string };
        Returns: { success: boolean; status: string };
      };
      block_advertiser_media: {
        Args: { p_media_id: string; p_reason: string };
        Returns: { success: boolean; status: string };
      };
      assign_report: {
        Args: { p_report_id: string };
        Returns: { success: boolean; assigned_to: string };
      };
      update_report_status: {
        Args: { p_report_id: string; p_status: string; p_notes?: string };
        Returns: { success: boolean; status: string };
      };
      grant_role: {
        Args: { p_target_profile_id: string; p_role: string };
        Returns: { success: boolean; granted_role: string; message?: string };
      };
      revoke_role: {
        Args: { p_target_profile_id: string; p_role: string };
        Returns: { success: boolean; revoked_role: string };
      };
      create_identity_verification_session: {
        Args: { p_verification_type?: string };
        Returns: { success: boolean; verification_id?: string; status?: string; session_token?: string; redirect_url?: string; message?: string };
      };
      process_verification_webhook: {
        Args: {
          p_provider: string;
          p_event_id: string;
          p_event_type: string;
          p_provider_reference: string;
          p_status: string;
          p_age_verified: boolean;
          p_identity_verified: boolean;
          p_result_code: string;
          p_payload_hash: string;
        };
        Returns: { success: boolean; status?: string; message?: string; error?: string };
      };
      override_verification_status: {
        Args: { p_verification_id: string; p_new_status: string; p_reason: string };
        Returns: { success: boolean; status: string };
      };
      expire_stale_verifications: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      create_advertiser_checkout: {
        Args: {
          p_product_type: string;
          p_product_id: string;
          p_coupon_code?: string | null;
        };
        Returns: {
          success: boolean;
          order_id?: string;
          order_number?: string;
          subtotal?: number;
          discount?: number;
          total_amount?: number;
          session_token?: string;
          redirect_url?: string;
          error?: string;
        };
      };
      process_payment_webhook: {
        Args: {
          p_provider: string;
          p_event_id: string;
          p_event_type: string;
          p_provider_reference: string;
          p_status: string;
          p_amount: number;
          p_metadata?: Json;
        };
        Returns: { success: boolean; status?: string; message?: string; error?: string };
      };
      cancel_advertiser_subscription: {
        Args: { p_subscription_id: string; p_cancel_at_period_end?: boolean };
        Returns: { success: boolean; cancel_at_period_end: boolean };
      };
      refund_payment: {
        Args: { p_payment_id: string; p_reason: string };
        Returns: { success: boolean; status: string };
      };
      get_advertiser_entitlements: {
        Args: { p_advertiser_id: string };
        Returns: {
          has_active_subscription: boolean;
          plan_name: string;
          plan_slug: string;
          media_limit: number;
          video_limit: number;
          boost_allowance: number;
          analytics_level: string;
        };
      };
      reserve_media_upload: {
        Args: { p_media_type: string; p_file_size?: number };
        Returns: {
          success: boolean;
          reservation_id?: string;
          target_path?: string;
          bucket?: string;
          expires_at?: string;
          error?: string;
        };
      };
      finalize_media_upload: {
        Args: {
          p_reservation_id: string;
          p_storage_path: string;
          p_mime_type: string;
          p_file_size: number;
          p_content_hash: string;
          p_width?: number | null;
          p_height?: number | null;
          p_duration?: number | null;
        };
        Returns: {
          success: boolean;
          media_id?: string;
          processing_status?: ProcessingStatus;
          moderation_status?: ModerationStatus;
          is_blocked?: boolean;
          job_id?: string;
          error?: string;
        };
      };
      publish_approved_media: {
        Args: { p_media_id: string };
        Returns: { success: boolean; status: string; error?: string };
      };
      reprocess_failed_media: {
        Args: { p_media_id: string };
        Returns: { success: boolean; job_id?: string; error?: string };
      };
      calculate_distance_km: {
        Args: { p_lat1: number; p_lon1: number; p_lat2: number; p_lon2: number };
        Returns: number | null;
      };
      recalculate_advertiser_rankings: {
        Args: { p_advertiser_id?: string | null };
        Returns: Json;
      };
      get_nearby_cities: {
        Args: { p_city_id: string; p_radius_km?: number };
        Returns: {
          city_id: string;
          city_name: string;
          city_slug: string;
          state_code: string;
          distance_km: number;
          distance_label: string;
          active_advertisers_count: number;
        }[];
      };
      get_similar_profiles: {
        Args: { p_advertiser_id: string; p_limit?: number };
        Returns: {
          advertiser_id: string;
          slug: string;
          stage_name: string;
          age: number;
          city_name: string;
          state_code: string;
          headline: string | null;
          thumbnail_url: string | null;
          verification_status: string;
          activity_label: string;
          is_sponsored: boolean;
        }[];
      };
      search_profiles_discovery: {
        Args: {
          p_query?: string | null;
          p_state_code?: string | null;
          p_city_slug?: string | null;
          p_origin_city_id?: string | null;
          p_radius_km?: number;
          p_category_slug?: string | null;
          p_verified_only?: boolean;
          p_with_video?: boolean;
          p_activity_filter?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          advertiser_id: string;
          slug: string;
          stage_name: string;
          age: number;
          city_name: string;
          city_slug: string;
          state_code: string;
          headline: string | null;
          thumbnail_url: string | null;
          verification_status: string;
          activity_label: string;
          distance_label: string;
          is_sponsored: boolean;
          organic_score: number;
        }[];
      };
      toggle_favorite: {
        Args: { p_advertiser_id: string };
        Returns: { success: boolean; is_favorite: boolean };
      };
      toggle_follow: {
        Args: { p_advertiser_id: string; p_notifications_enabled?: boolean };
        Returns: { success: boolean; is_following: boolean };
      };
      record_profile_history: {
        Args: { p_advertiser_id: string };
        Returns: boolean;
      };
      get_user_relationship_map: {
        Args: { p_advertiser_ids: string[] };
        Returns: {
          advertiser_id: string;
          is_favorite: boolean;
          is_following: boolean;
          is_blocked: boolean;
        }[];
      };
      toggle_block_advertiser: {
        Args: { p_advertiser_id: string };
        Returns: { success: boolean; is_blocked: boolean };
      };
      clear_user_history: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      reset_personalization: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      request_data_export: {
        Args: Record<string, never>;
        Returns: { success: boolean; export_id: string; status: string };
      };
      request_account_deletion: {
        Args: { p_reason?: string };
        Returns: { success: boolean; deletion_id?: string; status: string; scheduled_for?: string; error?: string };
      };
      cancel_account_deletion: {
        Args: Record<string, never>;
        Returns: { success: boolean; message: string };
      };
      revoke_user_session: {
        Args: { p_session_id: string };
        Returns: { success: boolean; message: string };
      };
      revoke_all_other_sessions: {
        Args: { p_current_session_id?: string };
        Returns: { success: boolean; message: string };
      };
      record_security_event: {
        Args: {
          p_event_type: string;
          p_severity: string;
          p_risk_score?: number;
          p_ip_hash?: string;
          p_metadata?: Json;
        };
        Returns: { success: boolean; event_id: string };
      };
      update_kill_switch: {
        Args: {
          p_switch_key: string;
          p_enabled: boolean;
          p_reason?: string;
        };
        Returns: { success: boolean; switch_key: string; enabled: boolean };
      };
    };
    Enums: {
      account_type: AccountType;
      profile_status: ProfileStatus;
      verification_status: VerificationStatus;
      visibility: Visibility;
      media_type: MediaType;
      moderation_status: ModerationStatus;
      report_severity: ReportSeverity;
      report_status: ReportStatus;
      legal_document_type: LegalDocumentType;
      consent_type: ConsentType;
      contact_type: ContactType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
