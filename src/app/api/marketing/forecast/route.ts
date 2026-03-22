import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { forecastRevenue } from '@/lib/revenue-forecast';

// ──────────────────────────────────────────────────────
// GET /api/marketing/forecast
// Returns 30-day revenue projection based on historical
// trends, seasonality, and current momentum.
// Auth: Supabase session OR CRON_SECRET OR INGEST_API_KEY header.
// ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await forecastRevenue();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[marketing/forecast] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) return true;
  if (apiKey && apiKey === process.env.CRON_SECRET) return true;

  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
