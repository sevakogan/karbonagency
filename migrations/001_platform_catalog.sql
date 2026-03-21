-- Migration 001: Platform Catalog
-- Defines all supported marketing platforms with credential field schemas

CREATE TABLE IF NOT EXISTS platform_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  credential_fields JSONB NOT NULL,
  test_connection_endpoint TEXT,
  icon_url TEXT,
  can_run_ads BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_catalog_slug ON platform_catalog (slug);
CREATE INDEX IF NOT EXISTS idx_platform_catalog_is_active ON platform_catalog (is_active);
