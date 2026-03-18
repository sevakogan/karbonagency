-- ============================================================
-- Migration: Meta Ads Write API support
-- Version: 2025-03-18
-- Description: Tables for storing Meta campaign drafts,
--              ad creative specs, and write operation logs.
-- ============================================================

-- Meta campaign drafts (local DB record of pushed campaigns)
CREATE TABLE IF NOT EXISTS meta_campaign_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  draft_template_id TEXT NOT NULL, -- maps to SHIFT_ARCADE_DRAFT_CAMPAIGNS[].id
  meta_campaign_id TEXT,           -- set after pushed to Meta
  meta_adset_id TEXT,              -- set after pushed to Meta
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUSHED', 'PAUSED', 'ACTIVE', 'DELETED')),
  daily_budget_cents INTEGER,
  notes TEXT,
  pushed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_campaign_drafts_client_id ON meta_campaign_drafts (client_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_drafts_meta_campaign_id ON meta_campaign_drafts (meta_campaign_id);

-- Meta write operation audit log
-- Tracks every create/update/delete operation sent to Meta API
CREATE TABLE IF NOT EXISTS meta_write_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN (
    'create_campaign', 'update_campaign', 'delete_campaign',
    'create_adset', 'update_adset', 'delete_adset',
    'create_ad', 'update_ad', 'delete_ad',
    'create_creative', 'delete_creative',
    'upload_image',
    'create_audience', 'delete_audience',
    'push_draft'
  )),
  meta_object_id TEXT,             -- ID returned by Meta
  meta_object_type TEXT,           -- 'campaign' | 'adset' | 'ad' | 'creative' | 'audience'
  request_body JSONB,
  response_body JSONB,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_write_log_client_id ON meta_write_log (client_id);
CREATE INDEX IF NOT EXISTS idx_meta_write_log_created_at ON meta_write_log (created_at DESC);

-- Meta audience registry (local copy of created audiences)
-- Keeps track of custom audience IDs for use in ad set targeting
CREATE TABLE IF NOT EXISTS meta_custom_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meta_audience_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtype TEXT NOT NULL,         -- 'WEBSITE' | 'ENGAGEMENT' | 'LOOKALIKE' etc.
  description TEXT,
  retention_days INTEGER,
  approximate_count INTEGER,
  is_lookalike_seed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_custom_audiences_client_id ON meta_custom_audiences (client_id);

-- Meta creative specs (local storage of creative briefs)
-- Stores the AI-generated creative specs so they can be displayed in the UI
CREATE TABLE IF NOT EXISTS meta_creative_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meta_campaign_draft_id UUID REFERENCES meta_campaign_drafts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  call_to_action TEXT,
  link_url TEXT,
  url_tags TEXT,
  concept_title TEXT,
  concept_script TEXT,
  meta_creative_id TEXT,         -- set after uploaded to Meta
  image_hash TEXT,
  video_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_creative_specs_client_id ON meta_creative_specs (client_id);

-- RLS policies

ALTER TABLE meta_campaign_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_write_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_custom_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_creative_specs ENABLE ROW LEVEL SECURITY;

-- Admins see everything
CREATE POLICY "Admins can manage meta_campaign_drafts"
  ON meta_campaign_drafts FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Admins can manage meta_write_log"
  ON meta_write_log FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Admins can manage meta_custom_audiences"
  ON meta_custom_audiences FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Admins can manage meta_creative_specs"
  ON meta_creative_specs FOR ALL
  USING (auth_role() = 'admin');

-- Clients see their own data
CREATE POLICY "Clients can view their meta_campaign_drafts"
  ON meta_campaign_drafts FOR SELECT
  USING (client_id = auth_client_id());

CREATE POLICY "Clients can view their meta_custom_audiences"
  ON meta_custom_audiences FOR SELECT
  USING (client_id = auth_client_id());

CREATE POLICY "Clients can view their meta_creative_specs"
  ON meta_creative_specs FOR SELECT
  USING (client_id = auth_client_id());

-- Updated_at trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_meta_campaign_drafts_updated_at
  BEFORE UPDATE ON meta_campaign_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meta_custom_audiences_updated_at
  BEFORE UPDATE ON meta_custom_audiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meta_creative_specs_updated_at
  BEFORE UPDATE ON meta_creative_specs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Pre-populate Shift Arcade Miami creative specs (for reference)
-- These match the SHIFT_ARCADE_DRAFT_CAMPAIGNS in meta-api-write.ts
-- ============================================================
-- Note: client_id must be updated with the actual Shift Arcade client UUID
-- INSERT INTO meta_creative_specs (client_id, name, headline, primary_text, ...) VALUES (...)
-- Run after deploying and confirming the Shift Arcade client UUID.
