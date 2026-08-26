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
