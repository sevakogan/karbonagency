import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { predictChurn } from '@/lib/churn-prediction';

// ──────────────────────────────────────────────────────
// GET /api/marketing/churn
// Returns churn prediction scores for all customers.
// Query params: risk (critical|at_risk|watch|safe) — optional filter
// Auth: Supabase session OR CRON_SECRET OR INGEST_API_KEY header.
// ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await predictChurn();

    // Optional risk level filter
    const riskFilter = request.nextUrl.searchParams.get('risk');
    if (riskFilter && ['critical', 'at_risk', 'watch', 'safe'].includes(riskFilter)) {
      const filtered = result.customers.filter((c) => c.risk_level === riskFilter);
      return NextResponse.json({
        customers: filtered,
        summary: result.summary,
        filter: riskFilter,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[marketing/churn] Error:', message);
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
