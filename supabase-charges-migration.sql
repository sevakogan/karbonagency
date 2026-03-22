-- ShiftOS Charges table — stores Stripe-confirmed payments
-- Links ShiftOS charges to customers with CAPI tracking
CREATE TABLE IF NOT EXISTS shiftos_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  shiftos_charge_id TEXT NOT NULL UNIQUE,
  shiftos_user_id INT NOT NULL,
  location_id TEXT NOT NULL,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCEEDED',
  amount_cents INT NOT NULL DEFAULT 0,
  amount_captured INT NOT NULL DEFAULT 0,
  amount_refunded INT NOT NULL DEFAULT 0,
  net_amount_cents INT GENERATED ALWAYS AS (amount_cents - amount_refunded) STORED,
  receipt_url TEXT,
  notes TEXT,
  charge_created_at TIMESTAMPTZ NOT NULL,
  capi_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charges_company ON shiftos_charges(company_id);
CREATE INDEX IF NOT EXISTS idx_charges_unsent ON shiftos_charges(capi_sent_at) WHERE capi_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_charges_created ON shiftos_charges(charge_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charges_user ON shiftos_charges(shiftos_user_id);

-- Attribution columns on customers
ALTER TABLE shiftos_customers
  ADD COLUMN IF NOT EXISTS attribution_source TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS attribution_confidence REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attribution_detail JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attributed_at TIMESTAMPTZ;

-- Source values: meta_ad, google_ad, google_organic, direct, referral, unknown
-- Confidence: 0.0 to 1.0 (1.0 = CAPI confirmed, 0.8 = timing match, 0.5 = day-level correlation)
CREATE INDEX IF NOT EXISTS idx_customers_attribution ON shiftos_customers(attribution_source);

-- ──────────────────────────────────────────────────────
-- Reviews table — stores Google + Yelp reviews
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  author_name TEXT,
  rating INT NOT NULL,
  text TEXT,
  review_time TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(platform, external_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id);
