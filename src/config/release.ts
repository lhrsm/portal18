export const RELEASE_METADATA = {
  releaseCandidate: 'RC-20260827-054500-HARDENED',
  previousReleaseCandidate: 'RC-20260827-052800',
  buildDate: '2026-08-27T05:45:00-03:00',
  gitHead: '331f98d',
  branch: 'master',
  nodeVersion: process.version || 'v24.19.0',
  framework: 'Next.js 16.3.3 (Active LTS, Turbopack, App Router)',
  reactVersion: '19.0.0',
  supabaseMigrationHead: '20260826000014_phase11_advanced_security_mfa_antifraud_observability.sql',
  databaseSchemaVersion: 14,
  environment: 'production-ready / hardened',
  pwaCacheName: 'portal-shell-RC-20260827-054500-HARDENED',
  featureFlags: {
    payments_enabled: false, // Merchant approval required before enabling live processing in production
    subscriptions_enabled: false,
    promotions_enabled: false,
    video_uploads_enabled: true,
    automated_moderation_enabled: false, // Manual human moderation mandatory
    nearby_search_enabled: true,
    personalized_recommendations_enabled: true,
    push_enabled: true,
  },
} as const;
