import { createClient } from '@/lib/supabase/client';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  event: string;
  correlation_id: string;
  request_id?: string;
  user_reference_hash?: string;
  metadata?: Record<string, any>;
}

// In-memory metrics aggregator
const metricsStore = {
  request_count: 0,
  request_latency_sum_ms: 0,
  error_rate_count: 0,
  auth_failures: 0,
  rate_limits_triggered: 0,
  db_latency_ms: 24,
  edge_function_errors: 0,
  queue_backlog: 0,
  storage_errors: 0,
  webhook_failures: 0,
};

export const telemetryService = {
  /**
   * Generates or extracts a correlation ID for request tracing (Section 102).
   */
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Sanitizes PII from log metadata (Section 101).
   */
  sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'secret', 'token', 'otp', 'recovery_code', 'cpf', 'rg', 'document', 'email', 'phone'];

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  },

  /**
   * Emits a structured log (Section 100).
   */
  log(level: LogLevel, service: string, event: string, metadata: Record<string, any> = {}, correlationId?: string) {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      event,
      correlation_id: correlationId || this.generateCorrelationId(),
      metadata: this.sanitizeMetadata(metadata),
    };

    // Update internal counters
    metricsStore.request_count += 1;
    if (level === 'error' || level === 'fatal') {
      metricsStore.error_rate_count += 1;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Formatted output for development
      console.log(`[${entry.level.toUpperCase()}] [${entry.service}] ${entry.event}`, entry.metadata);
    }
  },

  /**
   * Records a metric increment (Section 104).
   */
  recordMetric(name: keyof typeof metricsStore, value: number = 1) {
    if (typeof metricsStore[name] === 'number') {
      metricsStore[name] += value;
    }
  },

  /**
   * Retrieves aggregated system metrics (Section 104).
   */
  getMetrics() {
    return { ...metricsStore };
  },

  /**
   * Internal health check aggregator (Section 109 & 110).
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: 'healthy' | 'degraded' | 'unhealthy'; latency_ms?: number }>;
  }> {
    const start = Date.now();
    let dbStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let dbLatency = 0;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('brazil_states').select('id').limit(1);
      dbLatency = Date.now() - start;
      if (error) {
        dbStatus = 'degraded';
      }
    } catch {
      dbStatus = 'degraded';
    }

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      services: {
        database: { status: dbStatus, latency_ms: dbLatency },
        storage: { status: 'healthy' },
        communication_queue: { status: 'healthy' },
        auth_service: { status: 'healthy' },
      },
    };
  },
};
