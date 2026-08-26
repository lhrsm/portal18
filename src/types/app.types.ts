import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type BrazilState = Database['public']['Tables']['brazil_states']['Row'];
export type BrazilCity = Database['public']['Tables']['brazil_cities']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type AdvertiserProfile = Database['public']['Tables']['advertiser_profiles']['Row'];
export type AdvertiserMedia = Database['public']['Tables']['advertiser_media']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type VerificationRequest = Database['public']['Tables']['verification_requests']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type LegalDocument = Database['public']['Tables']['legal_documents']['Row'];
export type ConsentRecord = Database['public']['Tables']['consent_records']['Row'];
export type AdvertiserContact = Database['public']['Tables']['advertiser_contacts']['Row'];
export type ProfileContactEvent = Database['public']['Tables']['profile_contact_events']['Row'];
export type AdvertiserDailyStats = Database['public']['Tables']['advertiser_daily_stats']['Row'];
export type AdvertiserProfileHistory = Database['public']['Tables']['advertiser_profile_history']['Row'];

// View Type
export type PublicAdvertiser = Database['public']['Views']['public_advertiser_profiles']['Row'];

export interface UserSession {
  id: string;
  email: string;
  profile: Profile | null;
  roles: string[];
  isAdvertiser: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExploreFilters {
  state?: string;
  city?: string;
  category?: string;
  ageRange?: string; // '18-24', '25-34', '35-44', '45+'
  verified?: boolean;
  withPhoto?: boolean;
  sort?: 'recommended' | 'recent' | 'active';
  page?: number;
  limit?: number;
}

export interface CompletenessItem {
  key: string;
  label: string;
  points: number;
  completed: boolean;
  actionUrl: string;
}

export interface CompletenessResult {
  score: number;
  isReadyForSubmission: boolean;
  items: CompletenessItem[];
  missingSuggestions: string[];
}
