-- KarbonAgency Supabase Schema
-- Multi-tenant backend for sim racing venue clients
--
-- NOTE: This database is shared with other projects (TheLevelTeam, RevenuFlow).
-- The 'profiles' and 'leads' tables already exist with different schemas.
-- This migration adds columns to 'profiles' and creates new KarbonAgency tables.
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================================
-- Existing table: Contact form submissions (unchanged)
-- ============================================================
CREATE TABLE IF NOT EXISTS karbon_contact_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Profiles — add KarbonAgency columns to existing table
-- (existing columns: id, email, full_name, avatar_url, role, status, created_at, updated_at)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================================
-- Clients (tenants) — each sim racing venue
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  contact_phone TEXT,
  ghl_location_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients (slug);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients (is_active);

-- Add client branding & social columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Add FK after clients table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_client_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles (client_id);

-- ============================================================
-- Agency Leads — client-scoped contact leads
-- (named 'agency_leads' to avoid conflict with existing 'leads' table)
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT DEFAULT '',
  source TEXT DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  ghl_contact_id TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_leads_client_id ON agency_leads (client_id);
CREATE INDEX IF NOT EXISTS idx_agency_leads_status ON agency_leads (status);
CREATE INDEX IF NOT EXISTS idx_agency_leads_created_at ON agency_leads (created_at DESC);

-- ============================================================
-- Campaigns — ad campaigns per client
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  services JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  monthly_cost NUMERIC(12, 2),
  ad_budgets JSONB,
  start_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add new columns to existing campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS monthly_cost NUMERIC(12, 2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ad_budgets JSONB;
-- Migrate existing platform data into services array
UPDATE campaigns SET services = jsonb_build_array(platform) WHERE services = '[]' AND platform IS NOT NULL;
-- Drop old columns (optional, run after verifying migration)
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS platform;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS budget;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS end_date;

CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns (client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);

-- ============================================================
-- Campaign metrics — performance snapshots per period
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  cost_per_booking NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE WHEN bookings > 0 THEN spend / bookings ELSE NULL END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_client_id ON campaign_metrics (client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_period ON campaign_metrics (period_start, period_end);

-- ============================================================
-- Helper functions for RLS
-- ============================================================

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_agency_leads_updated_at ON agency_leads;
CREATE TRIGGER set_agency_leads_updated_at
  BEFORE UPDATE ON agency_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_campaigns_updated_at ON campaigns;
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all clients"
  ON clients FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Client users can view their own client"
  ON clients FOR SELECT
  USING (id = auth_client_id());

-- Agency Leads table
ALTER TABLE agency_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all agency leads"
  ON agency_leads FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Client users can view their own leads"
  ON agency_leads FOR SELECT
  USING (client_id = auth_client_id());

CREATE POLICY "Client users can update their own leads"
  ON agency_leads FOR UPDATE
  USING (client_id = auth_client_id())
  WITH CHECK (client_id = auth_client_id());

-- Campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all campaigns"
  ON campaigns FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Client users can view their own campaigns"
  ON campaigns FOR SELECT
  USING (client_id = auth_client_id());

-- Campaign metrics table
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all campaign metrics"
  ON campaign_metrics FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Client users can view their own campaign metrics"
  ON campaign_metrics FOR SELECT
  USING (client_id = auth_client_id());

-- ============================================================
-- Meta integration columns on clients
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_page_id TEXT;

-- ============================================================
-- Daily Metrics — aggregated ad performance per client per day
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'google', 'tiktok')),
  spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(8, 4) NOT NULL DEFAULT 0,
  cpc NUMERIC(10, 4) NOT NULL DEFAULT 0,
  cpm NUMERIC(10, 4) NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC(10, 2),
  roas NUMERIC(10, 4),
  video_views INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, campaign_id, date, platform)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_client_id ON daily_metrics (client_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_client_date ON daily_metrics (client_id, date);

-- RLS for daily_metrics
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all daily metrics"
  ON daily_metrics FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Client users can view their own daily metrics"
  ON daily_metrics FOR SELECT
  USING (client_id = auth_client_id());

-- ============================================================
-- Update admin profile with new columns
-- ============================================================
UPDATE profiles
SET is_active = TRUE, client_id = NULL
WHERE email = 'admin@karbonagency.com';

-- ============================================================
-- Data migration: copy existing contact submissions to agency_leads
-- ============================================================
INSERT INTO agency_leads (name, email, phone, source, notes, created_at)
SELECT
  ks.name,
  ks.email,
  ks.phone,
  'website',
  ks.message,
  ks.created_at
FROM karbon_contact_submissions ks
WHERE NOT EXISTS (
  SELECT 1 FROM agency_leads al WHERE al.email = ks.email AND al.created_at = ks.created_at
);

-- ============================================================
-- Migration: add meta_ad_account_id to campaigns table
-- Moves Meta ad account association from client-level to
-- campaign (project) level so each project can have its own
-- Meta ad account for per-project reporting.
-- ============================================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;
