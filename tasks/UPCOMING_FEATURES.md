# Upcoming Features — Karbon Agency

## 1. Live Dashboard Updates (5-min polling)

**What:** Marketing dashboard + company dashboard auto-refresh every 5 minutes to match N8N ingest cadence.

**Implementation:**
- `useEffect` with `setInterval(300000)` on the MarketingCommandCenter component
- Re-fetches `/api/marketing/customers` and `/api/marketing/analytics` every 5 min
- Visual indicator: pulsing green "Live" dot in header + "Last updated: X min ago" timestamp
- On company dashboard: same polling for ShiftOS analytics panel + KPI strip
- Uses `AbortController` to cancel in-flight requests on unmount

**Files to modify:**
- `src/components/marketing/marketing-command-center.tsx` — add polling
- `src/components/dashboard/company/company-dashboard.tsx` — add polling
- New shared hook: `src/hooks/use-live-poll.ts`

---

## 2. Marketing CRM — Status (Building Now)

**What's done:**
- POST /api/shiftos/bootstrap — one-time bulk pull of all Miami customers + reservations
- GET /api/marketing/customers — paginated, sortable, searchable customer list with computed lifecycle metrics
- GET /api/marketing/analytics — chart data (revenue trend, health ring, scatter, coupon impact)
- Marketing page route at /dashboard/marketing
- Marketing nav button in dashboard header
- Pulse Bar (6 clickable metric cards)
- 4-quadrant chart grid (Revenue Trend, Health Ring, VIP Scatter, Coupon Impact)
- Active filters bar with chips
- Cross-filter state management

**What's building:**
- Customer list (card view + compact table view)
- Customer expanded card (booking timeline, gaps, detail)
- Export CSV

**What's next after CRM ships:**
- Live polling (feature #1 above)
- Act as Company (feature #2 above)
- Bulk SMS via Twilio (future)
