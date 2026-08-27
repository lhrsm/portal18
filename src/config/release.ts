export const RELEASE_METADATA = {
  releaseCandidate: 'RC-20260827-052800',
  buildDate: '2026-08-27T05:28:00-03:00',
  gitHead: '13752ac',
  branch: 'master',
  nodeVersion: process.version || 'v20.x',
  framework: 'Next.js 14.2.35 (App Router)',
  supabaseMigrationHead: '20260826000014_phase11_advanced_security_mfa_antifraud_observability.sql',
  databaseSchemaVersion: 14,
  environment: 'production-ready',
  featureFlags: {
    payments_enabled: false, // Merchant approval required before enabling live processing in production
    subscriptions_enabled: false,
    promotions_enabled: false,
    video_uploads_enabled: true,
    automated_moderation_enabled: false, // Manual moderation mandatory by staff
    nearby_search_enabled: true,
    personalized_recommendations_enabled: true,
    push_enabled: true,
  },
} as const;
