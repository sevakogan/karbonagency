-- Migration 006: Expand daily_metrics platform CHECK constraint
-- The existing constraint only allows 'meta', 'google', 'tiktok'.
-- We need to support all platform slugs from platform_catalog.

ALTER TABLE daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_platform_check;
ALTER TABLE daily_metrics ADD CONSTRAINT daily_metrics_platform_check
  CHECK (platform IN (
    'meta', 'meta_ads', 'google', 'google_ads', 'google_analytics',
    'google_business', 'google_search_console', 'tiktok', 'tiktok_ads',
    'x_ads', 'pinterest_ads', 'linkedin_ads', 'yelp',
    'bing_ads', 'snapchat_ads'
  ));
