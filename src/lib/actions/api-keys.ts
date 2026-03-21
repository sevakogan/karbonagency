'use server';

import { getAdminSupabase } from '@/lib/supabase-admin';
import { generateApiKey, hashApiKey } from '@/lib/api/auth';
import type { ApiKey } from '@/types';

export async function listApiKeys(): Promise<{ data: ApiKey[]; error: string | null }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, permissions, is_active, last_used_at, created_at, expires_at')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ApiKey[], error: null };
}

export async function createApiKey(
  name: string
): Promise<{ key: string | null; data: ApiKey | null; error: string | null }> {
  const { key, prefix, hash } = generateApiKey();
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name,
      key_hash: hash,
      key_prefix: prefix,
      permissions: ['read'],
    })
    .select('id, name, key_prefix, permissions, is_active, last_used_at, created_at, expires_at')
    .single();

  if (error) return { key: null, data: null, error: error.message };

  // Return the full key ONCE — it won't be stored or shown again
  return { key, data: data as ApiKey, error: null };
}

export async function revokeApiKey(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
