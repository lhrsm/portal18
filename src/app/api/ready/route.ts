import { NextResponse } from 'next/server';
import { telemetryService } from '@/services/observability/telemetryService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await telemetryService.getSystemHealth();
  const paymentKillSwitch = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  const emailKillSwitch = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';

  const isReady = health.status !== 'unhealthy';

  return NextResponse.json(
    {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: health.services.database.status,
        storage: health.services.storage.status,
        payment_service: paymentKillSwitch ? 'disabled_by_policy' : 'active',
        email_service: emailKillSwitch ? 'disabled_by_policy' : 'active',
      },
    },
    {
      status: isReady ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
