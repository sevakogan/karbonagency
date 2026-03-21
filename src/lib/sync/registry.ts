import type { SyncResult, PlatformSlug } from '@/types';
import { syncMetaAds } from './meta-ads';
import { syncGoogleAnalytics } from './google-analytics';

export type SyncFunction = (
  companyId: string,
  credentials: Record<string, string>,
  since?: string,
  until?: string
) => Promise<SyncResult>;

const syncRegistry: Partial<Record<PlatformSlug, SyncFunction>> = {
  meta_ads: syncMetaAds,
  google_analytics: syncGoogleAnalytics,
};

export function getSyncFunction(platformSlug: PlatformSlug): SyncFunction | undefined {
  return syncRegistry[platformSlug];
}

export function isSyncSupported(platformSlug: PlatformSlug): boolean {
  return platformSlug in syncRegistry;
}

export function getSupportedPlatforms(): PlatformSlug[] {
  return Object.keys(syncRegistry) as PlatformSlug[];
}
