# Karbon Agency — Platform Redesign: Full Marketing Integration Hub

**Date:** 2026-03-20
**Status:** Design phase — data model approved, UI/routes pending
**Owner:** Seva (TheLevelTeam LLC)

---

## Vision

Transform KarbonAgency from a single-platform (Meta Ads) agency dashboard into a **full-service marketing integration hub**. One login, all clients, all platforms, all credentials, all data flowing into unified dashboards. Karbon Agency becomes the control center for all businesses under TheLevelTeam LLC AND external paying clients.

---

## Current State (What Already Exists)

- **Stack:** Next.js 16 + Supabase + Tailwind CSS 4 + TypeScript
- **Auth:** Supabase Auth with role-based access (admin / client)
- **Multi-tenant:** RLS policies enforce data isolation per client
- **Meta Ads integration:** Partially built — sync, verify, reporting via Meta Graph API
- **`daily_metrics` table:** Already supports `platform: 'meta' | 'google' | 'tiktok'`
- **Campaign services:** Already tracks which platforms a project uses (JSONB array)
- **Reporting dashboard:** KPI grids, demographics, placement breakdowns (Meta only)
- **Supabase clients:** Browser (lazy proxy), Server (cookies), Admin (service role)

### Existing Database Tables
- `clients` — tenant venues
- `profiles` — user accounts (role: admin/client, client_id FK)
- `campaigns` — projects per client
- `campaign_metrics` — legacy period-based metrics
- `daily_metrics` — daily platform metrics
- `agency_leads` — CRM leads per client
- `karbon_contact_submissions` — public contact form

### Existing Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN
META_AD_ACCOUNT_ID, META_PAGE_ID
GHL_API_KEY, GHL_LOCATION_ID
```

### Key File Locations
- Database schema: `supabase-schema.sql`
- Server actions: `src/lib/actions/` (campaigns, clients, leads, meta, metrics, users, profile, reporting)
- Supabase clients: `src/lib/supabase.ts`, `supabase-server.ts`, `supabase-admin.ts`
- Types: `src/types/index.ts`
- Dashboard routes: `src/app/(dashboard)/`
- Components: `src/components/dashboard/`

---

## Decisions Made

### 1. Naming: "Project" → "Client"
- Rename throughout the UI
- Clients are the top-level entity; each client has platform integrations beneath it

### 2. Client Creation Flow (Admin-Driven)
- Admin clicks "+" to create a client
- Fields: email, name, phone number, save
- Optional checkbox: "Send invite email" — if checked, client gets an invite to log in
- If unchecked, admin sets everything up on their side
- Admin can always invite the client later
- Client logs in and sees everything, can manage their own integrations

### 3. Platform Integrations — All 12 at Launch
All platforms get full UI with proper credential fields, toggles, and guided walkthroughs. Architecture supports adding more platforms with zero code changes (data-driven via `platform_catalog` table).

| # | Platform | Category | Can Run Ads | Can Pull Data |
|---|----------|----------|-------------|---------------|
| 1 | Meta Ads (Facebook + Instagram) | Ads | Yes | Yes |
| 2 | Google Ads | Ads | Yes | Yes |
| 3 | Google Analytics 4 | Analytics | No | Yes |
| 4 | Google Business Profile | Reviews/Local | No | Yes (reviews, views, calls) |
| 5 | Google Search Console | Analytics/SEO | No | Yes (rankings, clicks) |
| 6 | TikTok Ads | Ads | Yes | Yes |
| 7 | X (Twitter) Ads | Ads | Yes | Yes |
| 8 | Pinterest Ads | Ads | Yes | Yes |
| 9 | LinkedIn Ads | Ads | Yes | Yes |
| 10 | Yelp | Reviews | No (no public API for ads) | Yes (reviews, read-only) |
| 11 | Microsoft/Bing Ads | Ads | Yes | Yes |
| 12 | Snapchat Ads | Ads | Yes | Yes |

### 4. Monetization — Hybrid Pricing via Stripe
- **Model:** Base monthly fee + per-platform add-on pricing
- **Custom override:** Admin can set custom pricing per client
- **Paywall:** Built in from day one but all prices default to $0
- **Billing:** Stripe integration directly inside Karbon
- **Flow:** Client toggles a service on → billing updates automatically via Stripe
- No payment required at launch — flip prices on when ready

### 5. Client Dashboard — Full Self-Service (Option C)
- Clients can:
  - View all their metrics and reports
  - Connect/disconnect platforms
  - Enter/update their own credentials
  - Toggle services on/off (triggers billing changes)
  - See billing summary
- **Guided walkthroughs:** Each platform has step-by-step instructions with links on exactly where to find credentials (e.g., "Go to Google Ads → Settings → API → Copy your Customer ID")
- **Admin mirror:** Admin side has the exact same interface so Seva can do it for his own companies
- **Toggle:** Admin can switch between "client does it" vs "I do it" mode

### 6. N8N Automation — Full Two-Way Communication (Option C)
- **Karbon → N8N (Webhooks OUT):** Karbon fires webhooks when events happen:
  - `client.created` — new client added
  - `integration.connected` — platform credentials saved/verified
  - `integration.disconnected` — platform removed
  - `integration.credentials_updated` — credentials changed
  - `service.enabled` / `service.disabled` — toggle changes
  - `billing.invoice_created` — new charge
- **N8N → Karbon (REST API IN):** N8N calls Karbon's API to:
  - Push synced metrics data from ad platforms
  - Update integration status (connected/error)
  - Read client/integration data
  - Trigger metric syncs
- **Auth:** API key-based authentication for N8N endpoints
- **N8N handles:** All platform-specific API calls, data transformation, scheduling, retry logic

---

## Data Model (Approved)

### New Tables

#### `platform_catalog` (Reference table — defines all supported platforms)
```sql
CREATE TABLE platform_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- 'meta_ads', 'google_ads', etc.
  display_name TEXT NOT NULL,          -- 'Meta Ads (Facebook + Instagram)'
  category TEXT NOT NULL,              -- 'ads', 'analytics', 'reviews'
  default_price NUMERIC DEFAULT 0,    -- monthly price ($0 at launch)
  credential_fields JSONB NOT NULL,   -- schema defining what fields to collect
  help_url TEXT,                       -- link to walkthrough/docs
  help_steps JSONB,                   -- step-by-step in-app walkthrough
  icon_url TEXT,                       -- platform logo
  can_run_ads BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,     -- admin can hide platforms
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**`credential_fields` example for Meta Ads:**
```json
[
  { "key": "ad_account_id", "label": "Ad Account ID", "type": "text", "required": true, "help": "Found in Meta Business Suite → Settings → Ad Account" },
  { "key": "page_id", "label": "Facebook Page ID", "type": "text", "required": true, "help": "Found in your Page → About → Page ID" },
  { "key": "pixel_id", "label": "Meta Pixel ID", "type": "text", "required": false, "help": "Found in Events Manager → Data Sources" },
  { "key": "access_token", "label": "Access Token", "type": "secret", "required": true, "help": "Generate in Meta Business Suite → Settings → API" }
]
```

#### `client_integrations` (Per-client platform connections)
```sql
CREATE TABLE client_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform_slug TEXT REFERENCES platform_catalog(slug),
  credentials JSONB DEFAULT '{}',     -- encrypted at rest
  is_enabled BOOLEAN DEFAULT false,   -- service toggle (triggers billing)
  status TEXT DEFAULT 'disconnected', -- disconnected/connected/error/syncing
  monthly_price NUMERIC DEFAULT 0,    -- override per-client (NULL = use catalog default)
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,                 -- last error if status = 'error'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, platform_slug)
);
-- RLS: admin sees all, client sees own
```

#### `billing_events` (Stripe charge tracking)
```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',       -- pending/paid/failed/refunded
  period_start DATE,
  period_end DATE,
  line_items JSONB,                    -- which services were charged
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: admin sees all, client sees own
```

#### `webhook_events` (N8N outbound event log)
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,            -- 'client.created', 'integration.connected', etc.
  payload JSONB NOT NULL,
  webhook_url TEXT NOT NULL,           -- N8N endpoint
  status TEXT DEFAULT 'pending',       -- pending/sent/failed
  response_code INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);
```

#### `api_keys` (For N8N and external API access)
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- 'N8N Production', 'N8N Staging'
  key_hash TEXT NOT NULL,              -- hashed API key (never store plaintext)
  key_prefix TEXT NOT NULL,            -- first 8 chars for identification (e.g., 'karb_abc1')
  permissions JSONB DEFAULT '["read"]', -- read, write, admin
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

### Modified Existing Tables

#### `clients` (add columns)
```sql
ALTER TABLE clients ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE clients ADD COLUMN billing_plan TEXT DEFAULT 'hybrid'; -- hybrid/custom
ALTER TABLE clients ADD COLUMN base_monthly_fee NUMERIC DEFAULT 0;
ALTER TABLE clients ADD COLUMN billing_email TEXT;
```

---

## UI / Route Structure (Pending Design)

### Planned Admin Routes
```
/dashboard                          → Overview (stats across all clients)
/dashboard/clients                  → Client list (renamed from "campaigns")
/dashboard/clients/new              → Create client (+ button, name/email/phone/invite toggle)
/dashboard/clients/[id]             → Client detail
/dashboard/clients/[id]/integrations → Platform connections for this client
/dashboard/clients/[id]/billing     → Billing & pricing for this client
/dashboard/clients/[id]/reporting   → Metrics dashboard for this client
/dashboard/settings                 → Global settings
/dashboard/settings/api-keys        → API key management (for N8N)
/dashboard/settings/webhooks        → Webhook configuration (N8N endpoints)
/dashboard/settings/platforms       → Platform catalog management (prices, toggles)
```

### Planned Client Routes
```
/dashboard                          → Overview (their metrics)
/dashboard/integrations             → Their platform connections (with walkthroughs)
/dashboard/billing                  → Their billing summary & service toggles
/dashboard/reporting                → Their metrics dashboard
/dashboard/profile                  → Profile settings
```

### API Routes (for N8N)
```
POST   /api/v1/metrics              → Push metrics data
GET    /api/v1/clients/:id          → Read client data
GET    /api/v1/clients/:id/integrations → Read integration status
POST   /api/v1/sync/:platform       → Trigger platform sync
GET    /api/v1/health               → Health check
```

### Webhook Events (Karbon → N8N)
```
client.created
client.updated
client.deleted
integration.connected
integration.disconnected
integration.credentials_updated
integration.sync_completed
integration.sync_failed
service.enabled
service.disabled
billing.invoice_created
billing.payment_received
billing.payment_failed
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    KARBON AGENCY                          │
│                                                          │
│  ┌─────────┐    ┌──────────┐    ┌───────────────────┐   │
│  │  Admin   │    │  Client  │    │   REST API        │   │
│  │  Dashboard│   │  Dashboard│   │   (for N8N)       │   │
│  │  (Next.js)│   │  (Next.js)│   │   /api/v1/*       │   │
│  └────┬─────┘    └────┬─────┘   └────────┬──────────┘   │
│       │               │                   │              │
│  ┌────▼───────────────▼───────────────────▼──────────┐  │
│  │              Server Actions / API Routes            │  │
│  │         (Supabase + Stripe + Webhook dispatch)      │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │              Supabase (PostgreSQL + Auth)           │  │
│  │  clients | profiles | client_integrations          │  │
│  │  platform_catalog | daily_metrics | billing_events │  │
│  │  webhook_events | api_keys                         │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │
              Webhooks OUT │ │ API calls IN
                           │ │
              ┌────────────▼─▼────────────────┐
              │         N8N (Karbon N8N)        │
              │                                │
              │  Workflows per platform:       │
              │  ├── Meta Ads sync             │
              │  ├── Google Ads sync           │
              │  ├── Google Analytics sync     │
              │  ├── TikTok Ads sync           │
              │  ├── Google Business sync      │
              │  ├── LinkedIn Ads sync         │
              │  ├── Pinterest Ads sync        │
              │  ├── X Ads sync                │
              │  ├── Bing Ads sync             │
              │  ├── Snapchat Ads sync         │
              │  ├── Yelp Reviews sync         │
              │  └── Google Search Console sync│
              └───────┬───────────────────────┘
                      │
        ┌─────────────▼─────────────────────┐
        │     External Platform APIs         │
        │  Meta | Google | TikTok | X | etc. │
        └───────────────────────────────────┘
```

---

## Stripe Integration Plan

### Flow
1. Admin creates client → Stripe Customer created automatically
2. Client (or admin) enables a platform integration → Stripe Subscription updated
3. Monthly billing cycle → Stripe charges base fee + per-platform fees
4. Webhooks from Stripe → update `billing_events` table
5. Client can see billing summary in their dashboard

### Stripe Objects Mapping
- 1 `Customer` per client
- 1 `Subscription` per client (with multiple line items)
- 1 `Price` per platform in the catalog (created from `platform_catalog.default_price`)
- Custom pricing = `Subscription Item` with price override

---

## Implementation Phases (Proposed)

### Phase 1 — Foundation
- Rename "project" → "client" throughout UI
- New client creation flow (+ button, name/email/phone, invite toggle)
- `platform_catalog` table + seed all 12 platforms with credential field schemas
- `client_integrations` table + RLS policies

### Phase 2 — Integration UI
- Client integrations page (all 12 platforms as cards with toggles)
- Credential input forms (generated from `platform_catalog.credential_fields`)
- Guided walkthroughs per platform (step-by-step with links)
- Admin mirror (same UI on admin side)
- Credential encryption at rest

### Phase 3 — N8N API + Webhooks
- REST API endpoints (`/api/v1/*`) with API key auth
- `api_keys` table + management UI
- Webhook dispatch system (`webhook_events` table)
- Webhook configuration UI (set N8N endpoint URLs)
- N8N workflow templates for each platform

### Phase 4 — Stripe Billing
- Stripe Customer creation on client create
- `billing_events` table
- Subscription management (add/remove platform line items)
- Client billing dashboard
- Admin pricing management (set prices per platform, custom per client)
- Stripe webhook handlers (payment events)

### Phase 5 — Platform Data & Reporting
- Expand `daily_metrics` to handle all 12 platforms
- Unified multi-platform reporting dashboard
- Per-platform breakdown views
- Cross-platform comparison charts

---

## Environment Variables (New, Required)

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# N8N
N8N_WEBHOOK_BASE_URL=https://n8n.karbonagency.com

# Encryption (for credential storage)
CREDENTIAL_ENCRYPTION_KEY=...
```

---

## Open Questions

1. **Credential encryption approach:** Use Supabase Vault (pgcrypto) or application-level encryption (Node.js crypto)?
2. **N8N hosting:** Self-hosted or N8N Cloud?
3. **Platform walkthrough content:** Need to write step-by-step guides for all 12 platforms — where to find each credential
4. **Stripe pricing structure:** Exact dollar amounts for each platform when monetization is turned on
5. **Existing Meta integration migration:** Move current `.env.local` Meta credentials into the new `client_integrations` table
