'use server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import type { Company, WizardSetupData, PlatformSlug } from '@/types';

/**
 * Get all companies with their integration counts.
 * Used by the God-view dashboard.
 */
export async function getCompanies(): Promise<Company[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Failed to fetch companies:', error.message);
    return [];
  }
  return (data ?? []) as Company[];
}

/**
 * Get a single company by ID with full details.
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch company:', error.message);
    return null;
  }
  return data as Company;
}

/**
 * Create a new company (Step 1 of wizard).
 * Returns the company ID for subsequent wizard steps.
 */
export async function createCompany(data: {
  name: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: row, error } = await supabase
    .from('clients')
    .insert({
      name: data.name,
      slug,
      website_url: data.website_url || null,
      description: data.description || null,
      logo_url: data.logo_url || null,
      setup_step: 2,
      setup_data: {},
    })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: row!.id, error: null };
}

/**
 * Update wizard progress for a company.
 */
export async function updateWizardStep(
  companyId: string,
  step: number,
  setupData: Partial<WizardSetupData>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  // Merge with existing setup_data
  const { data: existing } = await supabase
    .from('clients')
    .select('setup_data')
    .eq('id', companyId)
    .single();

  const mergedData = {
    ...((existing?.setup_data as WizardSetupData) ?? {}),
    ...setupData,
  };

  const { error } = await supabase
    .from('clients')
    .update({
      setup_step: step,
      setup_data: mergedData,
    })
    .eq('id', companyId);

  return { error: error?.message ?? null };
}

/**
 * Complete wizard setup — clears the setup_step marker.
 */
export async function completeWizardSetup(
  companyId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from('clients')
    .update({
      setup_step: null,
      setup_data: {},
    })
    .eq('id', companyId);

  return { error: error?.message ?? null };
}

/**
 * Delete a draft company (incomplete wizard).
 */
export async function deleteDraftCompany(
  companyId: string
): Promise<{ error: string | null }> {
  const adminSupabase = getAdminSupabase();

  // Only allow deleting companies that are still in setup
  const { data } = await adminSupabase
    .from('clients')
    .select('setup_step')
    .eq('id', companyId)
    .single();

  if (!data || data.setup_step === null) {
    return { error: 'Cannot delete a completed company setup' };
  }

  const { error } = await adminSupabase
    .from('clients')
    .delete()
    .eq('id', companyId);

  return { error: error?.message ?? null };
}

/**
 * Get all platforms from the catalog.
 */
export async function getPlatformCatalog(): Promise<{
  data: Array<{
    slug: PlatformSlug;
    display_name: string;
    category: string;
    credential_fields: unknown;
    can_run_ads: boolean;
    sync_enabled: boolean;
    is_active: boolean;
    sort_order: number;
  }>;
  error: string | null;
}> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('platform_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

/**
 * Update company details.
 */
export async function updateCompany(
  id: string,
  data: {
    name?: string;
    website_url?: string;
    description?: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', id);

  return { error: error?.message ?? null };
}
