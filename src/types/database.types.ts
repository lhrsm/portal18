export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          blocked_reason: string | null
          cancelled_at: string | null
          created_at: string
          executed_at: string | null
          id: string
          profile_id: string
          reason_optional: string | null
          requested_at: string
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          blocked_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          profile_id: string
          reason_optional?: string | null
          requested_at?: string
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          blocked_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          profile_id?: string
          reason_optional?: string | null
          requested_at?: string
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      account_risk_scores: {
        Row: {
          last_calculated_at: string
          profile_id: string
          risk_level: string
          score: number
        }
        Insert: {
          last_calculated_at?: string
          profile_id: string
          risk_level?: string
          score?: number
        }
        Update: {
          last_calculated_at?: string
          profile_id?: string
          risk_level?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_risk_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_campaigns: {
        Row: {
          advertiser_id: string
          clicks: number
          created_at: string
          ends_at: string | null
          id: string
          impressions: number
          order_id: string | null
          placement: Database["public"]["Enums"]["promotion_placement"]
          product_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          clicks?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          impressions?: number
          order_id?: string | null
          placement: Database["public"]["Enums"]["promotion_placement"]
          product_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          clicks?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          impressions?: number
          order_id?: string | null
          placement?: Database["public"]["Enums"]["promotion_placement"]
          product_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "advertiser_campaigns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "promotion_products"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_categories: {
        Row: {
          advertiser_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          advertiser_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          advertiser_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_categories_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_categories_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "advertiser_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_contacts: {
        Row: {
          advertiser_id: string
          contact_type: string
          contact_value: string
          created_at: string
          id: string
          is_primary: boolean
          is_visible: boolean
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          advertiser_id: string
          contact_type: string
          contact_value: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_visible?: boolean
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          advertiser_id?: string
          contact_type?: string
          contact_value?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_visible?: boolean
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_contacts_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_contacts_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
        ]
      }
      advertiser_daily_stats: {
        Row: {
          advertiser_id: string
          contact_clicks: number
          date: string
          favorites_added: number
          id: string
          views: number
        }
        Insert: {
          advertiser_id: string
          contact_clicks?: number
          date?: string
          favorites_added?: number
          id?: string
          views?: number
        }
        Update: {
          advertiser_id?: string
          contact_clicks?: number
          date?: string
          favorites_added?: number
          id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_daily_stats_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_daily_stats_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
        ]
      }
      advertiser_media: {
        Row: {
          advertiser_id: string
          card_path: string | null
          content_hash: string | null
          created_at: string
          deleted_at: string | null
          duration_seconds: number | null
          file_size: number | null
          full_path: string | null
          height: number | null
          id: string
          media_type: string
          mime_type: string | null
          moderation_reason: string | null
          moderation_status: string
          position: number
          processing_error: string | null
          processing_status: Database["public"]["Enums"]["processing_status"]
          profile_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          storage_path_original: string | null
          thumbnail_path: string | null
          updated_at: string
          video_thumbnail_path: string | null
          visibility: string
          watermark_applied: boolean
          width: number | null
        }
        Insert: {
          advertiser_id: string
          card_path?: string | null
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          full_path?: string | null
          height?: number | null
          id?: string
          media_type: string
          mime_type?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          position?: number
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          profile_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          storage_path_original?: string | null
          thumbnail_path?: string | null
          updated_at?: string
          video_thumbnail_path?: string | null
          visibility?: string
          watermark_applied?: boolean
          width?: number | null
        }
        Update: {
          advertiser_id?: string
          card_path?: string | null
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          full_path?: string | null
          height?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          position?: number
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          profile_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          storage_path_original?: string | null
          thumbnail_path?: string | null
          updated_at?: string
          video_thumbnail_path?: string | null
          visibility?: string
          watermark_applied?: boolean
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_media_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_media_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "advertiser_media_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_profile_history: {
        Row: {
          advertiser_id: string
          change_type: string
          changed_by: string
          changed_fields: Json | null
          created_at: string
          id: string
        }
        Insert: {
          advertiser_id: string
          change_type: string
          changed_by: string
          changed_fields?: Json | null
          created_at?: string
          id?: string
        }
        Update: {
          advertiser_id?: string
          change_type?: string
          changed_by?: string
          changed_fields?: Json | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_profile_history_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_profile_history_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "advertiser_profile_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_profiles: {
        Row: {
          approx_latitude: number | null
          approx_longitude: number | null
          bio: string | null
          birth_date: string
          city_id: string | null
          created_at: string
          deleted_at: string | null
          gender: string | null
          headline: string | null
          id: string
          last_active_at: string | null
          location_precision: Database["public"]["Enums"]["location_precision"]
          location_updated_at: string | null
          moderation_notes: string | null
          neighborhood: string | null
          onboarding_completed: boolean
          onboarding_step: number
          presentation: string | null
          profile_id: string
          profile_status: string
          published_at: string | null
          rejection_reason: string | null
          review_feedback: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          stage_name: string
          state_id: string | null
          submitted_at: string | null
          updated_at: string
          verification_status: string
          visibility: string
        }
        Insert: {
          approx_latitude?: number | null
          approx_longitude?: number | null
          bio?: string | null
          birth_date: string
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          gender?: string | null
          headline?: string | null
          id?: string
          last_active_at?: string | null
          location_precision?: Database["public"]["Enums"]["location_precision"]
          location_updated_at?: string | null
          moderation_notes?: string | null
          neighborhood?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          presentation?: string | null
          profile_id: string
          profile_status?: string
          published_at?: string | null
          rejection_reason?: string | null
          review_feedback?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          stage_name: string
          state_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Update: {
          approx_latitude?: number | null
          approx_longitude?: number | null
          bio?: string | null
          birth_date?: string
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          gender?: string | null
          headline?: string | null
          id?: string
          last_active_at?: string | null
          location_precision?: Database["public"]["Enums"]["location_precision"]
          location_updated_at?: string | null
          moderation_notes?: string | null
          neighborhood?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          presentation?: string | null
          profile_id?: string
          profile_status?: string
          published_at?: string | null
          rejection_reason?: string | null
          review_feedback?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          stage_name?: string
          state_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "brazil_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_profiles_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "brazil_states"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_ranking_scores: {
        Row: {
          activity_score: number
          advertiser_id: string
          calculated_at: string
          completeness_score: number
          engagement_score: number
          freshness_score: number
          organic_score: number
          quality_score: number
          trust_score: number
          verification_score: number
        }
        Insert: {
          activity_score?: number
          advertiser_id: string
          calculated_at?: string
          completeness_score?: number
          engagement_score?: number
          freshness_score?: number
          organic_score?: number
          quality_score?: number
          trust_score?: number
          verification_score?: number
        }
        Update: {
          activity_score?: number
          advertiser_id?: string
          calculated_at?: string
          completeness_score?: number
          engagement_score?: number
          freshness_score?: number
          organic_score?: number
          quality_score?: number
          trust_score?: number
          verification_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_ranking_scores_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: true
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_ranking_scores_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: true
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_profile_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_hash: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_moderation_results: {
        Row: {
          categories: Json
          created_at: string
          id: string
          media_id: string
          metadata: Json
          provider: string
          provider_reference: string | null
          result_summary: string | null
          risk_level: string
          status: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          id?: string
          media_id: string
          metadata?: Json
          provider?: string
          provider_reference?: string | null
          result_summary?: string | null
          risk_level?: string
          status?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          media_id?: string
          metadata?: Json
          provider?: string
          provider_reference?: string | null
          result_summary?: string | null
          risk_level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_moderation_results_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "advertiser_media"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_media_hashes: {
        Row: {
          created_at: string
          created_by: string | null
          hash_type: string
          hash_value: string
          id: string
          reason: string
          source_media_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hash_type?: string
          hash_value: string
          id?: string
          reason: string
          source_media_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hash_type?: string
          hash_value?: string
          id?: string
          reason?: string
          source_media_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_media_hashes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_media_hashes_source_media_id_fkey"
            columns: ["source_media_id"]
            isOneToOne: false
            referencedRelation: "advertiser_media"
            referencedColumns: ["id"]
          },
        ]
      }
      brazil_cities: {
        Row: {
          capital: boolean
          ibge_code: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          population: number | null
          region: string | null
          slug: string
          state_id: string
        }
        Insert: {
          capital?: boolean
          ibge_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number | null
          region?: string | null
          slug: string
          state_id: string
        }
        Update: {
          capital?: boolean
          ibge_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number | null
          region?: string | null
          slug?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brazil_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "brazil_states"
            referencedColumns: ["id"]
          },
        ]
      }
      brazil_states: {
        Row: {
          code: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          code: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      campaign_daily_stats: {
        Row: {
          campaign_id: string
          clicks: number
          contact_clicks: number
          date: string
          id: string
          impressions: number
          profile_views: number
        }
        Insert: {
          campaign_id: string
          clicks?: number
          contact_clicks?: number
          date?: string
          id?: string
          impressions?: number
          profile_views?: number
        }
        Update: {
          campaign_id?: string
          clicks?: number
          contact_clicks?: number
          date?: string
          id?: string
          impressions?: number
          profile_views?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_daily_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "advertiser_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_delivery_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          job_id: string | null
          metadata: Json | null
          occurred_at: string
          provider: string
          provider_reference: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          occurred_at?: string
          provider: string
          provider_reference?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          occurred_at?: string
          provider?: string
          provider_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_delivery_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "communication_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_jobs: {
        Row: {
          attempts: number
          category: string
          channel: string
          completed_at: string | null
          created_at: string
          dedupe_key: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          max_attempts: number
          payload: Json
          priority: string
          profile_id: string | null
          scheduled_at: string
          started_at: string | null
          status: string
          template_code: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          category: string
          channel: string
          completed_at?: string | null
          created_at?: string
          dedupe_key?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_attempts?: number
          payload?: Json
          priority?: string
          profile_id?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          template_code: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          category?: string
          channel?: string
          completed_at?: string | null
          created_at?: string
          dedupe_key?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_attempts?: number
          payload?: Json
          priority?: string
          profile_id?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          template_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          channel: string
          code: string
          content_html: string
          content_text: string
          created_at: string
          id: string
          locale: string
          status: string
          subject: string
          updated_at: string
          version: number
        }
        Insert: {
          channel: string
          code: string
          content_html: string
          content_text: string
          created_at?: string
          id?: string
          locale?: string
          status?: string
          subject: string
          updated_at?: string
          version?: number
        }
        Update: {
          channel?: string
          code?: string
          content_html?: string
          content_text?: string
          created_at?: string
          id?: string
          locale?: string
          status?: string
          subject?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          consent_type: string
          created_at: string
          document_id: string | null
          granted: boolean
          id: string
          metadata: Json | null
          profile_id: string
          revoked_at: string | null
          source: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          document_id?: string | null
          granted?: boolean
          id?: string
          metadata?: Json | null
          profile_id: string
          revoked_at?: string | null
          source?: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          document_id?: string | null
          granted?: boolean
          id?: string
          metadata?: Json | null
          profile_id?: string
          revoked_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          advertiser_id: string
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string
        }
        Insert: {
          advertiser_id: string
          coupon_id: string
          created_at?: string
          discount_amount: number
          id?: string
          order_id: string
        }
        Update: {
          advertiser_id?: string
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_product_type:
            | Database["public"]["Enums"]["payment_type"]
            | null
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          starts_at: string | null
          status: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          applicable_product_type?:
            | Database["public"]["Enums"]["payment_type"]
            | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          applicable_product_type?:
            | Database["public"]["Enums"]["payment_type"]
            | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          download_count: number
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          processing_started_at: string | null
          profile_id: string
          requested_at: string
          status: string
          storage_path: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          download_count?: number
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          processing_started_at?: string | null
          profile_id: string
          requested_at?: string
          status?: string
          storage_path?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          download_count?: number
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          processing_started_at?: string | null
          profile_id?: string
          requested_at?: string
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          description: string
          id: string
          policy_key: string
          retention_days: number
          updated_at: string
        }
        Insert: {
          description: string
          id?: string
          policy_key: string
          retention_days: number
          updated_at?: string
        }
        Update: {
          description?: string
          id?: string
          policy_key?: string
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          advertiser_id: string
          created_at: string
          id: string
          user_profile_id: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          id?: string
          user_profile_id: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "favorites_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category_id: string
          content: string
          created_at: string
          helpful_count: number
          id: string
          published_at: string
          slug: string
          sort_order: number
          status: string
          summary: string | null
          title: string
          unhelpful_count: number
          updated_at: string
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          helpful_count?: number
          id?: string
          published_at?: string
          slug: string
          sort_order?: number
          status?: string
          summary?: string | null
          title: string
          unhelpful_count?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          helpful_count?: number
          id?: string
          published_at?: string
          slug?: string
          sort_order?: number
          status?: string
          summary?: string | null
          title?: string
          unhelpful_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string
          created_by: string
          id: string
          internal_summary: string
          public_message: string
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          internal_summary: string
          public_message: string
          resolved_at?: string | null
          severity: string
          started_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          internal_summary?: string
          public_message?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          active: boolean
          content_url: string | null
          created_at: string
          document_type: string
          id: string
          published_at: string
          title: string
          version: string
        }
        Insert: {
          active?: boolean
          content_url?: string | null
          created_at?: string
          document_type: string
          id?: string
          published_at?: string
          title: string
          version: string
        }
        Update: {
          active?: boolean
          content_url?: string | null
          created_at?: string
          document_type?: string
          id?: string
          published_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      legal_holds: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
          released_at: string | null
          released_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          released_at?: string | null
          released_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          released_at?: string | null
          released_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_holds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_holds_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_processing_jobs: {
        Row: {
          attempts: number
          created_at: string
          error_code: string | null
          finished_at: string | null
          id: string
          job_type: string
          max_attempts: number
          media_id: string
          metadata: Json
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          media_id: string
          metadata?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          media_id?: string
          metadata?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_processing_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "advertiser_media"
            referencedColumns: ["id"]
          },
        ]
      }
      media_upload_reservations: {
        Row: {
          advertiser_id: string
          created_at: string
          expires_at: string
          id: string
          media_type: string
          reserved_bytes: number
          status: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          expires_at?: string
          id?: string
          media_type: string
          reserved_bytes?: number
          status?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          reserved_bytes?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_upload_reservations_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_upload_reservations_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
        ]
      }
      moderation_feedback: {
        Row: {
          advertiser_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          resolved_at: string | null
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          resolved_at?: string | null
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_feedback_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_feedback_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "moderation_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_notes: {
        Row: {
          author_profile_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note: string
        }
        Insert: {
          author_profile_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note: string
        }
        Update: {
          author_profile_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_notes_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_jobs: {
        Row: {
          created_at: string
          cursor: number
          entity_id: string
          event_type: string
          id: string
          metadata: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cursor?: number
          entity_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cursor?: number
          entity_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          category: string
          channel: string
          created_at: string
          enabled: boolean
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          category: string
          channel: string
          created_at?: string
          enabled?: boolean
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          dedupe_key: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          profile_id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          dedupe_key?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          profile_id: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          profile_id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description_snapshot: string
          id: string
          metadata: Json
          order_id: string
          product_id: string
          product_type: Database["public"]["Enums"]["payment_type"]
          quantity: number
          total_amount: number
          unit_amount: number
        }
        Insert: {
          created_at?: string
          description_snapshot: string
          id?: string
          metadata?: Json
          order_id: string
          product_id: string
          product_type: Database["public"]["Enums"]["payment_type"]
          quantity?: number
          total_amount: number
          unit_amount: number
        }
        Update: {
          created_at?: string
          description_snapshot?: string
          id?: string
          metadata?: Json
          order_id?: string
          product_id?: string
          product_type?: Database["public"]["Enums"]["payment_type"]
          quantity?: number
          total_amount?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advertiser_id: string
          coupon_id: string | null
          created_at: string
          currency: string
          discount_amount: number
          id: string
          idempotency_key: string | null
          metadata: Json
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          order_number: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          advertiser_id: string
          amount: number
          created_at: string
          currency: string
          failed_at: string | null
          id: string
          metadata: Json
          order_id: string | null
          paid_at: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          provider: string
          provider_payment_reference: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          amount: number
          created_at?: string
          currency?: string
          failed_at?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          provider?: string
          provider_payment_reference?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          amount?: number
          created_at?: string
          currency?: string
          failed_at?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          provider?: string
          provider_payment_reference?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_kill_switches: {
        Row: {
          enabled: boolean
          id: string
          reason: string | null
          switch_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          id?: string
          reason?: string | null
          switch_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          id?: string
          reason?: string | null
          switch_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_kill_switches_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contact_events: {
        Row: {
          advertiser_id: string
          contact_type: string
          created_at: string
          id: string
          viewer_profile_id: string | null
        }
        Insert: {
          advertiser_id: string
          contact_type: string
          created_at?: string
          id?: string
          viewer_profile_id?: string | null
        }
        Update: {
          advertiser_id?: string
          contact_type?: string
          created_at?: string
          id?: string
          viewer_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_contact_events_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_contact_events_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "profile_contact_events_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_follows: {
        Row: {
          advertiser_id: string
          created_at: string
          follower_profile_id: string
          id: string
          notifications_enabled: boolean
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          follower_profile_id: string
          id?: string
          notifications_enabled?: boolean
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          follower_profile_id?: string
          id?: string
          notifications_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_follows_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_follows_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "profile_follows_follower_profile_id_fkey"
            columns: ["follower_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_view_history: {
        Row: {
          advertiser_id: string
          first_viewed_at: string
          id: string
          last_viewed_at: string
          view_count: number
          viewer_profile_id: string
        }
        Insert: {
          advertiser_id: string
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          view_count?: number
          viewer_profile_id: string
        }
        Update: {
          advertiser_id?: string
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          view_count?: number
          viewer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_view_history_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_view_history_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "profile_view_history_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          auth_user_id: string
          avatar_path: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          account_type?: string
          auth_user_id: string
          avatar_path?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_type?: string
          auth_user_id?: string
          avatar_path?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_hours: number
          id: string
          name: string
          placement: Database["public"]["Enums"]["promotion_placement"]
          price_amount: number
          priority: number
          slug: string
          status: string
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_hours?: number
          id?: string
          name: string
          placement?: Database["public"]["Enums"]["promotion_placement"]
          price_amount: number
          priority?: number
          slug: string
          status?: string
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_hours?: number
          id?: string
          name?: string
          placement?: Database["public"]["Enums"]["promotion_placement"]
          price_amount?: number
          priority?: number
          slug?: string
          status?: string
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          profile_id: string
          revoked_at: string | null
          updated_at: string
          user_agent_hash: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          profile_id: string
          revoked_at?: string | null
          updated_at?: string
          user_agent_hash?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          profile_id?: string
          revoked_at?: string | null
          updated_at?: string
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_weights: {
        Row: {
          activity_weight: number
          completeness_weight: number
          engagement_weight: number
          exploration_factor: number
          freshness_weight: number
          id: string
          quality_weight: number
          trust_weight: number
          updated_at: string
          updated_by: string | null
          verification_weight: number
        }
        Insert: {
          activity_weight?: number
          completeness_weight?: number
          engagement_weight?: number
          exploration_factor?: number
          freshness_weight?: number
          id?: string
          quality_weight?: number
          trust_weight?: number
          updated_at?: string
          updated_by?: string | null
          verification_weight?: number
        }
        Update: {
          activity_weight?: number
          completeness_weight?: number
          engagement_weight?: number
          exploration_factor?: number
          freshness_weight?: number
          id?: string
          quality_weight?: number
          trust_weight?: number
          updated_at?: string
          updated_by?: string | null
          verification_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "ranking_weights_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_profile_id: string | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_profile_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_profile_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_events: {
        Row: {
          advertiser_id: string | null
          created_at: string
          id: string
          metadata: Json
          profile_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_type: string
          score_delta: number
          severity: string
          source: string
          status: string
        }
        Insert: {
          advertiser_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          profile_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_type: string
          score_delta?: number
          severity: string
          source?: string
          status?: string
        }
        Update: {
          advertiser_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          profile_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_type?: string
          score_delta?: number
          severity?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "risk_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_rules: {
        Row: {
          action: string
          code: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          score_delta: number
          threshold: number
          updated_at: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          score_delta: number
          threshold?: number
          updated_at?: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          score_delta?: number
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          device_id: string | null
          event_type: string
          id: string
          ip_hash: string
          metadata: Json
          profile_id: string | null
          resolved_at: string | null
          risk_score: number
          severity: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          event_type: string
          id?: string
          ip_hash: string
          metadata?: Json
          profile_id?: string | null
          resolved_at?: string | null
          risk_score?: number
          severity: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          event_type?: string
          id?: string
          ip_hash?: string
          metadata?: Json
          profile_id?: string | null
          resolved_at?: string | null
          risk_score?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          analytics_level: string
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          boost_allowance: number
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          media_limit: number
          name: string
          price_amount: number
          slug: string
          sort_order: number
          status: string
          updated_at: string
          video_limit: number
        }
        Insert: {
          analytics_level?: string
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          boost_allowance?: number
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          media_limit?: number
          name: string
          price_amount: number
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
          video_limit?: number
        }
        Update: {
          analytics_level?: string
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          boost_allowance?: number
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          media_limit?: number
          name?: string
          price_amount?: number
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
          video_limit?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          advertiser_id: string
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          provider: string
          provider_customer_reference: string | null
          provider_subscription_reference: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          provider?: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          provider?: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: Json | null
          author_profile_id: string
          author_type: string
          created_at: string
          id: string
          message: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          author_profile_id: string
          author_type: string
          created_at?: string
          id?: string
          message: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          author_profile_id?: string
          author_type?: string
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          profile_id: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          profile_id: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          profile_id?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          device_name: string
          device_token_hash: string
          first_seen_at: string
          id: string
          last_seen_at: string
          profile_id: string
          revoked_at: string | null
          trusted_at: string
        }
        Insert: {
          device_name: string
          device_token_hash: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          profile_id: string
          revoked_at?: string | null
          trusted_at?: string
        }
        Update: {
          device_name?: string
          device_token_hash?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          profile_id?: string
          revoked_at?: string | null
          trusted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_advertiser_id: string
          blocker_profile_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_advertiser_id: string
          blocker_profile_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_advertiser_id?: string
          blocker_profile_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_advertiser_id_fkey"
            columns: ["blocked_advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_advertiser_id_fkey"
            columns: ["blocked_advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_profile_id_fkey"
            columns: ["blocker_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hidden_recommendations: {
        Row: {
          advertiser_id: string
          created_at: string
          id: string
          profile_id: string
          reason: string | null
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          id?: string
          profile_id: string
          reason?: string | null
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_hidden_recommendations_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_recommendations_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "user_hidden_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_list_items: {
        Row: {
          advertiser_id: string
          created_at: string
          id: string
          list_id: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          id?: string
          list_id: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_list_items_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_list_items_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
          {
            foreignKeyName: "user_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "user_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_factors: {
        Row: {
          created_at: string
          factor_type: string
          id: string
          profile_id: string
          secret_hash: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          factor_type: string
          id?: string
          profile_id: string
          secret_hash: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          factor_type?: string
          id?: string
          profile_id?: string
          secret_hash?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_factors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          age_max: number | null
          age_min: number | null
          created_at: string
          history_enabled: boolean
          personalization_enabled: boolean
          preferred_city_id: string | null
          profile_id: string
          recently_active_only: boolean
          updated_at: string
          verified_only: boolean
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string
          history_enabled?: boolean
          personalization_enabled?: boolean
          preferred_city_id?: string | null
          profile_id: string
          recently_active_only?: boolean
          updated_at?: string
          verified_only?: boolean
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string
          history_enabled?: boolean
          personalization_enabled?: boolean
          preferred_city_id?: string | null
          profile_id?: string
          recently_active_only?: boolean
          updated_at?: string
          verified_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_preferred_city_id_fkey"
            columns: ["preferred_city_id"]
            isOneToOne: false
            referencedRelation: "brazil_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferred_categories: {
        Row: {
          category_id: string
          created_at: string
          profile_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          profile_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferred_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferred_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          profile_id: string
          used_at: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          profile_id: string
          used_at?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          profile_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recovery_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          profile_id: string
          role: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          country: string | null
          created_at: string
          device_id: string
          id: string
          ip_hash: string
          last_seen_at: string
          profile_id: string
          region: string | null
          revoked_at: string | null
          session_reference_hash: string
          user_agent_summary: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_id: string
          id?: string
          ip_hash: string
          last_seen_at?: string
          profile_id: string
          region?: string | null
          revoked_at?: string | null
          session_reference_hash: string
          user_agent_summary: string
        }
        Update: {
          country?: string | null
          created_at?: string
          device_id?: string
          id?: string
          ip_hash?: string
          last_seen_at?: string
          profile_id?: string
          region?: string | null
          revoked_at?: string | null
          session_reference_hash?: string
          user_agent_summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          advertiser_id: string
          age_verified: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          idempotency_key: string | null
          identity_verified: boolean | null
          metadata: Json | null
          provider: string
          provider_reference: string | null
          result_code: string | null
          retry_available_at: string | null
          retry_count: number | null
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          verification_type: string
        }
        Insert: {
          advertiser_id: string
          age_verified?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          identity_verified?: boolean | null
          metadata?: Json | null
          provider?: string
          provider_reference?: string | null
          result_code?: string | null
          retry_available_at?: string | null
          retry_count?: number | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verification_type?: string
        }
        Update: {
          advertiser_id?: string
          age_verified?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          identity_verified?: boolean | null
          metadata?: Json | null
          provider?: string
          provider_reference?: string | null
          result_code?: string | null
          retry_available_at?: string | null
          retry_count?: number | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "public_advertiser_profiles"
            referencedColumns: ["advertiser_id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          payload_hash: string
          processed_at: string
          provider: string
          received_at: string
          status: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          payload_hash: string
          processed_at?: string
          provider: string
          received_at?: string
          status?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          payload_hash?: string
          processed_at?: string
          provider?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      public_advertiser_profiles: {
        Row: {
          advertiser_id: string | null
          age: number | null
          approved_media_count: number | null
          bio: string | null
          category_ids: string[] | null
          city_id: string | null
          city_name: string | null
          city_slug: string | null
          created_at: string | null
          gender: string | null
          headline: string | null
          last_active_at: string | null
          neighborhood: string | null
          presentation: string | null
          primary_photo_url: string | null
          profile_id: string | null
          profile_status: string | null
          slug: string | null
          stage_name: string | null
          state_code: string | null
          state_id: string | null
          state_name: string | null
          state_slug: string | null
          updated_at: string | null
          verification_status: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "brazil_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_profiles_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "brazil_states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      approve_advertiser_media: { Args: { p_media_id: string }; Returns: Json }
      approve_advertiser_profile: {
        Args: { p_advertiser_id: string }
        Returns: Json
      }
      assign_report: { Args: { p_report_id: string }; Returns: Json }
      become_advertiser: {
        Args: { p_is_adult: boolean; p_terms_accepted: boolean }
        Returns: Json
      }
      block_advertiser_media: {
        Args: { p_media_id: string; p_reason: string }
        Returns: Json
      }
      calculate_distance_km: {
        Args: { p_lat1: number; p_lat2: number; p_lon1: number; p_lon2: number }
        Returns: number
      }
      cancel_account_deletion: { Args: never; Returns: Json }
      cancel_advertiser_subscription: {
        Args: { p_cancel_at_period_end?: boolean; p_subscription_id: string }
        Returns: Json
      }
      clear_user_history: { Args: never; Returns: boolean }
      create_advertiser_checkout: {
        Args: {
          p_coupon_code?: string
          p_product_id: string
          p_product_type: string
        }
        Returns: Json
      }
      create_identity_verification_session: {
        Args: { p_verification_type?: string }
        Returns: Json
      }
      current_profile_id: { Args: never; Returns: string }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      expire_stale_verifications: { Args: never; Returns: number }
      finalize_media_upload: {
        Args: {
          p_content_hash: string
          p_duration?: number
          p_file_size: number
          p_height?: number
          p_mime_type: string
          p_reservation_id: string
          p_storage_path: string
          p_width?: number
        }
        Returns: Json
      }
      generate_available_advertiser_slug: {
        Args: { p_base_name: string }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_advertiser_entitlements: {
        Args: { p_advertiser_id: string }
        Returns: Json
      }
      get_nearby_cities: {
        Args: { p_city_id: string; p_radius_km?: number }
        Returns: {
          active_advertisers_count: number
          city_id: string
          city_name: string
          city_slug: string
          distance_km: number
          distance_label: string
          state_code: string
        }[]
      }
      get_similar_profiles: {
        Args: { p_advertiser_id: string; p_limit?: number }
        Returns: {
          activity_label: string
          advertiser_id: string
          age: number
          city_name: string
          headline: string
          is_sponsored: boolean
          slug: string
          stage_name: string
          state_code: string
          thumbnail_url: string
          verification_status: string
        }[]
      }
      get_user_relationship_map: {
        Args: { p_advertiser_ids: string[] }
        Returns: {
          advertiser_id: string
          is_blocked: boolean
          is_favorite: boolean
          is_following: boolean
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      grant_role: {
        Args: { p_role: string; p_target_profile_id: string }
        Returns: Json
      }
      has_role: { Args: { role_name: string }; Returns: boolean }
      increment_contact_click: {
        Args: { p_advertiser_id: string; p_contact_type: string }
        Returns: undefined
      }
      increment_profile_view: {
        Args: { p_advertiser_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      override_verification_status: {
        Args: {
          p_new_status: string
          p_reason: string
          p_verification_id: string
        }
        Returns: Json
      }
      owns_advertiser: {
        Args: { target_advertiser_id: string }
        Returns: boolean
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_payment_webhook: {
        Args: {
          p_amount: number
          p_event_id: string
          p_event_type: string
          p_metadata?: Json
          p_provider: string
          p_provider_reference: string
          p_status: string
        }
        Returns: Json
      }
      process_verification_webhook: {
        Args: {
          p_age_verified: boolean
          p_event_id: string
          p_event_type: string
          p_identity_verified: boolean
          p_metadata?: Json
          p_payload_hash?: string
          p_provider: string
          p_provider_reference: string
          p_result_code: string
          p_status: string
        }
        Returns: Json
      }
      publish_approved_media: { Args: { p_media_id: string }; Returns: Json }
      reactivate_advertiser_profile: {
        Args: { p_advertiser_id: string }
        Returns: Json
      }
      recalculate_advertiser_rankings: {
        Args: { p_advertiser_id?: string }
        Returns: Json
      }
      record_profile_history: {
        Args: { p_advertiser_id: string }
        Returns: boolean
      }
      record_security_event: {
        Args: {
          p_event_type: string
          p_ip_hash?: string
          p_metadata?: Json
          p_risk_score?: number
          p_severity: string
        }
        Returns: Json
      }
      refund_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: Json
      }
      reject_advertiser_media: {
        Args: { p_media_id: string; p_reason: string }
        Returns: Json
      }
      reject_advertiser_profile: {
        Args: { p_advertiser_id: string; p_reason: string }
        Returns: Json
      }
      reorder_advertiser_media: {
        Args: { p_advertiser_id: string; p_media_ids: string[] }
        Returns: boolean
      }
      reprocess_failed_media: { Args: { p_media_id: string }; Returns: Json }
      request_account_deletion: { Args: { p_reason?: string }; Returns: Json }
      request_changes_advertiser_profile: {
        Args: { p_advertiser_id: string; p_feedback: string }
        Returns: Json
      }
      request_data_export: { Args: never; Returns: Json }
      reserve_media_upload: {
        Args: { p_file_size?: number; p_media_type: string }
        Returns: Json
      }
      reset_personalization: { Args: never; Returns: boolean }
      revoke_all_other_sessions: {
        Args: { p_current_session_id?: string }
        Returns: Json
      }
      revoke_role: {
        Args: { p_role: string; p_target_profile_id: string }
        Returns: Json
      }
      revoke_user_session: { Args: { p_session_id: string }; Returns: Json }
      search_profiles_discovery: {
        Args: {
          p_activity_filter?: string
          p_category_slug?: string
          p_city_slug?: string
          p_limit?: number
          p_offset?: number
          p_origin_city_id?: string
          p_query?: string
          p_radius_km?: number
          p_state_code?: string
          p_verified_only?: boolean
          p_with_video?: boolean
        }
        Returns: {
          activity_label: string
          advertiser_id: string
          age: number
          city_name: string
          city_slug: string
          distance_label: string
          headline: string
          is_sponsored: boolean
          organic_score: number
          slug: string
          stage_name: string
          state_code: string
          thumbnail_url: string
          verification_status: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_advertiser_profile: {
        Args: { p_advertiser_id: string }
        Returns: Json
      }
      suspend_advertiser_profile: {
        Args: { p_advertiser_id: string; p_reason: string }
        Returns: Json
      }
      toggle_block_advertiser: {
        Args: { p_advertiser_id: string }
        Returns: Json
      }
      toggle_favorite: { Args: { p_advertiser_id: string }; Returns: Json }
      toggle_follow: {
        Args: { p_advertiser_id: string; p_notifications_enabled?: boolean }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      update_kill_switch: {
        Args: { p_enabled: boolean; p_reason?: string; p_switch_key: string }
        Returns: Json
      }
      update_report_status: {
        Args: { p_notes?: string; p_report_id: string; p_status: string }
        Returns: Json
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      activity_bucket:
        | "active_now"
        | "recently_active"
        | "active_today"
        | "active_this_week"
        | "inactive"
      billing_interval: "monthly" | "quarterly" | "semiannual" | "annual"
      campaign_status:
        | "pending_payment"
        | "scheduled"
        | "active"
        | "completed"
        | "cancelled"
        | "suspended"
      discount_type: "percentage" | "fixed"
      location_precision: "city" | "district" | "approximate"
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "failed"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
        | "chargeback"
        | "disputed"
      payment_type:
        | "subscription"
        | "boost"
        | "featured_placement"
        | "campaign"
        | "other_platform_product"
      processing_status:
        | "uploaded"
        | "queued"
        | "processing"
        | "processed"
        | "failed"
      promotion_placement:
        | "homepage_featured"
        | "city_top"
        | "category_top"
        | "search_sponsored"
        | "profile_recommendation"
      subscription_status:
        | "incomplete"
        | "pending"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
        | "suspended"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_bucket: [
        "active_now",
        "recently_active",
        "active_today",
        "active_this_week",
        "inactive",
      ],
      billing_interval: ["monthly", "quarterly", "semiannual", "annual"],
      campaign_status: [
        "pending_payment",
        "scheduled",
        "active",
        "completed",
        "cancelled",
        "suspended",
      ],
      discount_type: ["percentage", "fixed"],
      location_precision: ["city", "district", "approximate"],
      order_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "failed",
      ],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
        "chargeback",
        "disputed",
      ],
      payment_type: [
        "subscription",
        "boost",
        "featured_placement",
        "campaign",
        "other_platform_product",
      ],
      processing_status: [
        "uploaded",
        "queued",
        "processing",
        "processed",
        "failed",
      ],
      promotion_placement: [
        "homepage_featured",
        "city_top",
        "category_top",
        "search_sponsored",
        "profile_recommendation",
      ],
      subscription_status: [
        "incomplete",
        "pending",
        "active",
        "past_due",
        "cancelled",
        "expired",
        "suspended",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
