export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = 'user' | 'advertiser' | 'moderator' | 'admin' | 'super_admin';
export type ProfileStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type VerificationStatus = 'not_started' | 'pending' | 'processing' | 'verified' | 'rejected' | 'requires_review' | 'expired';
export type Visibility = 'public' | 'unlisted' | 'hidden' | 'private';
export type MediaType = 'image' | 'video';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'blocked';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';

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
    };
    Views: {
      [_ in never]: never;
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
      is_moderator: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      owns_advertiser: {
        Args: { target_advertiser_id: string };
        Returns: boolean;
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
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
