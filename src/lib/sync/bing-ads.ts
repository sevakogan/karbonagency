import type { SyncResult } from '@/types';

export async function syncBingAds(
  _companyId: string,
  _credentials: Record<string, string>,
  _since?: string,
  _until?: string
): Promise<SyncResult> {
  return {
    success: false,
    rowsUpserted: 0,
    error: 'Bing Ads sync is not yet implemented',
    durationMs: 0,
  };
}
