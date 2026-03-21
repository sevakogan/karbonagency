import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = getAdminSupabase();

  const { data: lastSync } = await supabase
    .from('company_integrations')
    .select('last_synced_at')
    .not('last_synced_at', 'is', null)
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .single();

  const { count: totalIntegrations } = await supabase
    .from('company_integrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'connected');

  return NextResponse.json({
    status: 'healthy',
    lastSyncAt: lastSync?.last_synced_at ?? null,
    connectedIntegrations: totalIntegrations ?? 0,
    timestamp: new Date().toISOString(),
  });
}
