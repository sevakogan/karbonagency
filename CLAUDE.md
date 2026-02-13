# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

KarbonAgency is a multi-tenant agency platform built with Next.js 16, Supabase, and Tailwind CSS 4. It serves two user types: **admin** (agency team) and **client** (sim racing venue owners) with role-based dashboards and RLS data isolation.

## Commands

```bash
npm run dev         # Dev server (localhost:3000)
npm run build       # Production build
npm run lint        # ESLint (eslint-config-next 16, ESLint 9)
npm test            # Vitest watch mode
npm run test:run    # Vitest single run (CI mode)
npm run test:coverage # Coverage report (v8 provider)
```

Run a single test: `npx vitest run src/__tests__/path/to/test.ts`

## Architecture

- **Next.js 16** with App Router (`src/app/`)
- **Supabase** for auth and database (SSR via `@supabase/ssr`)
- **Tailwind CSS 4** with PostCSS
- **TypeScript** with strict mode, path alias `@/*` → `./src/*`

### Route Groups

- `(marketing)/` — Public marketing pages (home, contact, book, privacy, terms, sitemap)
- `(auth)/` — Login page
- `(dashboard)/` — Protected dashboard and admin pages (wrapped in AuthProvider)
- `auth/callback/` — Supabase auth callback route
- `api/contact/` — Contact form API

### Supabase Clients

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Browser client (lazy Proxy, for client components) |
| `src/lib/supabase-server.ts` | Server client with cookies (for server components/actions) |
| `src/lib/supabase-admin.ts` | Service-role client (bypasses RLS, for API routes) |

### Database Schema

See `supabase-schema.sql` for full schema. **Shared Supabase instance** with other projects.

Key tables:
- `clients` — Tenant venues
- `profiles` — User profiles (extends auth.users, role: admin/client, client_id FK). Shared table with extra columns from other projects (avatar_url, status).
- `agency_leads` — Client-scoped leads (named `agency_leads` to avoid conflict with existing `leads` table from RevenuFlow)
- `campaigns` — Ad campaigns per client
- `campaign_metrics` — Performance snapshots
- `karbon_contact_submissions` — Contact form data

RLS policies enforce admin-sees-all, client-sees-own-data via `auth_role()` and `auth_client_id()` helper functions.

### Server Actions

Located in `src/lib/actions/`:
- `leads.ts` — getLeads, getLeadById, updateLeadStatus
- `clients.ts` — getClients, getClientById, createClient, updateClient
- `users.ts` — getUsers, inviteClientUser, deactivateUser
- `campaigns.ts` — getCampaigns, getCampaignById, createCampaign, updateCampaign, getCampaignMetrics, addCampaignMetrics

### Testing
- **Vitest** with jsdom environment, globals enabled
- Setup file: `src/__tests__/setup.ts`
- Coverage includes `src/lib/`, `src/app/`, `src/components/`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GHL_API_KEY, GHL_LOCATION_ID
```
