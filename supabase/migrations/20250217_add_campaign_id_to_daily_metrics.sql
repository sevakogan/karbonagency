-- Add campaign_id to daily_metrics for per-campaign filtering
-- This allows clients to toggle specific campaigns on/off in charts

-- 1. Add nullable campaign_id column
ALTER TABLE daily_metrics
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- 2. Drop old unique constraint and create new one that includes campaign_id
-- Use COALESCE to handle NULL campaign_id (for legacy client-level rows)
ALTER TABLE daily_metrics
  DROP CONSTRAINT IF EXISTS daily_metrics_client_id_date_platform_key;

CREATE UNIQUE INDEX IF NOT EXISTS daily_metrics_client_campaign_date_platform_key
  ON daily_metrics (client_id, COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'), date, platform);

-- 3. Add index for campaign_id lookups
CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign_id ON daily_metrics (campaign_id);

-- 4. Delete existing rows so they can be re-synced with campaign_id populated
-- This is safe because all data can be re-pulled from Meta
DELETE FROM daily_metrics;
