-- Migration 002: Company Integrations
-- Per-company platform connections with encrypted credential storage

CREATE TABLE IF NOT EXISTS company_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform_slug TEXT REFERENCES platform_catalog(slug),
  credentials JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'disconnected',
  status_detail TEXT,
  last_synced_at TIMESTAMPTZ,
  last_sync_duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, platform_slug)
);

CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON company_integrations (company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_platform ON company_integrations (platform_slug);
CREATE INDEX IF NOT EXISTS idx_company_integrations_status ON company_integrations (status);

-- RLS
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all integrations"
  ON company_integrations FOR ALL
  USING (auth_role() = 'admin');

CREATE POLICY "Client users can view their own integrations"
  ON company_integrations FOR SELECT
  USING (company_id = auth_client_id());

CREATE POLICY "Client users can manage their own integrations"
  ON company_integrations FOR UPDATE
  USING (company_id = auth_client_id())
  WITH CHECK (company_id = auth_client_id());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_company_integrations_updated_at ON company_integrations;
CREATE TRIGGER set_company_integrations_updated_at
  BEFORE UPDATE ON company_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
