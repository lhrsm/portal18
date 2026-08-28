/**
 * Onboarding Analytics & Observability Service
 * Tracks funnel progression, step completions, resumes, and submissions safely without PII.
 */

export type OnboardingEventName =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_resumed'
  | 'onboarding_abandoned'
  | 'profile_submitted';

export interface OnboardingEventPayload {
  step?: number;
  stepName?: string;
  totalSteps?: number;
  timeSpentSeconds?: number;
  hasMainPhoto?: boolean;
  hasContacts?: boolean;
  categoriesCount?: number;
  error?: string;
}

class OnboardingAnalytics {
  private startTime: number = Date.now();

  trackEvent(event: OnboardingEventName, payload: OnboardingEventPayload = {}) {
    const enrichedPayload = {
      event,
      timestamp: new Date().toISOString(),
      sessionDurationSeconds: Math.round((Date.now() - this.startTime) / 1000),
      ...payload,
    };

    // Safe anonymous logging in development and production telemetry sink
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Telemetry:Onboarding] ${event}:`, enrichedPayload);
    }

    // Extensible to external telemetry/monitoring sinks without exposing PII
    try {
      if (typeof window !== 'undefined' && (window as any).__PORTAL18_TELEMETRY__) {
        (window as any).__PORTAL18_TELEMETRY__.push(enrichedPayload);
      }
    } catch {
      // Non-blocking telemetry
    }
  }
}

export const onboardingAnalytics = new OnboardingAnalytics();
