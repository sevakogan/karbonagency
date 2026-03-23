import { createSupabaseServer } from '@/lib/supabase-server';
import { LifelinePageClient } from '@/components/lifeline/lifeline-page-client';

export const dynamic = 'force-dynamic';

export default async function LifelinePage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="py-16 text-center">
        <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
          You do not have access to this page.
        </p>
      </div>
    );
  }

  // Get Shift Arcade Miami company for the shared header
  const { data: company } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', '%shift%arcade%')
    .limit(1)
    .single();

  return <LifelinePageClient company={company} />;
}
