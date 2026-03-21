import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/auth';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { valid } = await validateApiKey(request.headers.get('authorization'));
  if (!valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  const { data: companies, error } = await supabase
    .from('clients')
    .select('id, name, slug, website_url, logo_url, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get integration status for each company
  const { data: integrations } = await supabase
    .from('company_integrations')
    .select('company_id, platform_slug, status, last_synced_at')
    .eq('is_enabled', true);

  const integrationsByCompany = (integrations ?? []).reduce((acc, i) => {
    const list = acc[i.company_id] ?? [];
    list.push({ platform: i.platform_slug, status: i.status, lastSyncedAt: i.last_synced_at });
    acc[i.company_id] = list;
    return acc;
  }, {} as Record<string, Array<{ platform: string; status: string; lastSyncedAt: string | null }>>);

  const result = (companies ?? []).map((c) => ({
    ...c,
    integrations: integrationsByCompany[c.id] ?? [],
  }));

  return NextResponse.json({ companies: result });
}
