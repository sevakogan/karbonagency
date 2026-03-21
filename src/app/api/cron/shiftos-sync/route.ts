import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { syncShiftOS } from '@/lib/sync/shiftos';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminSupabase();

  // Look up Shift Arcade company by name
  const { data: company, error: lookupError } = await supabase
    .from('clients')
    .select('id')
    .ilike('name', '%Shift Arcade%')
    .limit(1)
    .single();

  if (lookupError || !company) {
    return NextResponse.json(
      { error: `Shift Arcade company not found: ${lookupError?.message ?? 'no match'}` },
      { status: 404 },
    );
  }

  try {
    const result = await syncShiftOS(company.id, {});

    return NextResponse.json({
      companyId: company.id,
      platform: 'shiftos',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
