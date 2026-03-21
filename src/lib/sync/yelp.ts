import type { SyncResult } from '@/types';

export async function syncYelp(
  _companyId: string,
  _credentials: Record<string, string>,
  _since?: string,
  _until?: string
): Promise<SyncResult> {
  return {
    success: false,
    rowsUpserted: 0,
    error: 'Yelp sync is not yet implemented',
    durationMs: 0,
  };
}
