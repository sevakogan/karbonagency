import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { syncRecentReservations } from '@/lib/shiftos/analytics-sync';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminSupabase();
    const { data: company } = await supabase
      .from('clients')
      .select('id')
      .ilike('company_name', '%Shift Arcade%')
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Shift Arcade company not found' }, { status: 404 });
    }

    const result = await syncRecentReservations(company.id);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('ShiftOS analytics sync error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
