import { createHash } from 'crypto';
import { getAdminSupabase } from '@/lib/supabase-admin';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'karb_';
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return {
    key,
    prefix: key.substring(0, 12),
    hash: hashApiKey(key)
  };
}

export async function validateApiKey(
  authHeader: string | null
): Promise<{ valid: boolean; permissions: string[] }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, permissions: [] };
  }

  const token = authHeader.slice(7);
  const hash = hashApiKey(token);

  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from('api_keys')
    .select('id, permissions, is_active, expires_at')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (!data) return { valid: false, permissions: [] };

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, permissions: [] };
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    valid: true,
    permissions: (data.permissions as string[]) ?? ['read']
  };
}
