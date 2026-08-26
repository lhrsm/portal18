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
export type ConsentType = 'age_declaration' | 'terms' | 'privacy' | 'marketing_email' | 'analytics' | 'advertiser_terms';
export type ContactType = 'whatsapp' | 'telegram' | 'phone' | 'website';

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
        };
        Insert: {
          id?: string;
          state_id: string;
          ibge_code?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          state_id?: string;
          ibge_code?: string | null;
          name?: string;
          slug?: string;
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
          thumbnail_path: string | null;
          position: number;
          visibility: Visibility;
          moderation_status: ModerationStatus;
          moderation_reason: string | null;
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
          thumbnail_path?: string | null;
          position?: number;
          visibility?: Visibility;
          moderation_status?: ModerationStatus;
          moderation_reason?: string | null;
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
          thumbnail_path?: string | null;
          position?: number;
          visibility?: Visibility;
          moderation_status?: ModerationStatus;
          moderation_reason?: string | null;
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
          submitted_at: string | null;
          reviewed_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          provider?: string;
          provider_reference?: string | null;
          status?: VerificationStatus;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          provider?: string;
          provider_reference?: string | null;
          status?: VerificationStatus;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
