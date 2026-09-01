export type RiskSubjectType =
  | 'user'
  | 'advertiser'
  | 'profile'
  | 'referral'
  | 'review'
  | 'report'
  | 'payment'
  | 'session'
  | 'device';

export type RiskSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type RiskConfidence = 'low' | 'medium' | 'high';
export type RiskSignalSource =
  | 'system_rule'
  | 'moderation'
  | 'user_report'
  | 'support'
  | 'auth'
  | 'referral'
  | 'review'
  | 'payment'
  | 'provider'
  | 'staff'
  | 'automated_detection';

export type RiskSignalStatus =
  | 'active'
  | 'investigating'
  | 'resolved'
  | 'false_positive'
  | 'expired'
  | 'archived';

export interface RiskSignal {
  id: string;
  subject_type: RiskSubjectType;
  subject_id: string;
  signal_type: string;
  severity: RiskSeverity;
  confidence: RiskConfidence;
  source: RiskSignalSource;
  status: RiskSignalStatus;
  policy_version: string;
  first_seen_at: string;
  last_seen_at: string;
  expires_at?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type TSCasePriority = 'critical' | 'high' | 'normal' | 'low';
export type TSCaseStatus =
  | 'open'
  | 'triage'
  | 'investigating'
  | 'waiting_user'
  | 'waiting_external'
  | 'action_required'
  | 'resolved'
  | 'closed'
  | 'appealed'
  | 'reopened';

export interface TrustSafetyCase {
  id: string;
  case_number: string;
  subject_type: RiskSubjectType;
  subject_id: string;
  title: string;
  description?: string;
  priority: TSCasePriority;
  status: TSCaseStatus;
  assigned_to?: string | null;
  sla_due_at?: string | null;
  resolution?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  signals?: RiskSignal[];
  notes?: CaseInternalNote[];
}

export interface CaseInternalNote {
  id: string;
  case_id: string;
  author_id: string;
  author_name?: string;
  note: string;
  created_at: string;
}

export type SanctionType =
  | 'warning'
  | 'feature_restriction'
  | 'upload_restriction'
  | 'review_restriction'
  | 'referral_restriction'
  | 'contact_change_hold'
  | 'temporary_account_hold'
  | 'profile_unpublished'
  | 'account_suspended'
  | 'account_terminated';

export type SanctionScope = 'account' | 'advertiser_profile' | 'reviews' | 'referrals' | 'uploads';
export type SanctionDuration = 'temporary' | 'indefinite' | 'permanent';
export type SanctionStatus = 'active' | 'lifted' | 'expired' | 'overturned_on_appeal';

export interface Sanction {
  id: string;
  subject_type: RiskSubjectType;
  subject_id: string;
  case_id?: string | null;
  sanction_type: SanctionType;
  scope: SanctionScope;
  duration: SanctionDuration;
  status: SanctionStatus;
  reason_internal: string;
  reason_public: string;
  starts_at: string;
  ends_at?: string | null;
  applied_by?: string | null;
  lifted_by?: string | null;
  lifted_reason?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type AppealStatus =
  | 'submitted'
  | 'under_review'
  | 'additional_information_requested'
  | 'upheld'
  | 'modified'
  | 'overturned'
  | 'closed';

export interface Appeal {
  id: string;
  sanction_id?: string | null;
  case_id?: string | null;
  profile_id: string;
  subject_type: RiskSubjectType;
  subject_id: string;
  reason: string;
  evidence_urls: string[];
  status: AppealStatus;
  assigned_to?: string | null;
  decision_notes?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at: string;
}

export interface BlockedMediaFingerprint {
  id: string;
  media_hash: string;
  hash_type: 'sha256' | 'phash' | 'md5';
  block_reason: string;
  severity: 'critical' | 'high' | 'medium';
  created_by?: string | null;
  created_at: string;
}

export interface RateLimitPolicy {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}
