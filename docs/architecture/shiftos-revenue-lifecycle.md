# ShiftOS Revenue & Customer Lifecycle Architecture

## Executive Summary

This document defines the data architecture, sync strategy, and dashboard UX for integrating ShiftOS revenue and customer lifecycle data into the Karbon Agency dashboard. The goal: let the owner see **daily revenue**, **customer return rates**, **simulator utilization**, and **per-customer lifetime value** at a glance — and correlate it back to ad spend.

---

## 1. Supabase Schema

### Principle: Three New Tables, Zero Changes to Existing Tables

The existing `daily_metrics` table already receives ShiftOS data (reservations as `conversions`, new users as `clicks`). We add **three purpose-built tables** that store the raw ShiftOS entities we need for lifecycle analytics. The `daily_metrics` row for `platform = 'shiftos'` gets richer (we add revenue), but its schema stays the same.

---

### Table: `shiftos_customers`

Cached mirror of ShiftOS `/users/` for Miami location. Updated on every sync. This is the **customer master record** for all lifecycle metrics.

```sql
CREATE TABLE IF NOT EXISTS shiftos_customers (
  id SERIAL PRIMARY KEY,
  shiftos_user_id INTEGER NOT NULL UNIQUE,     -- ShiftOS user PK
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  stripe_customer_id TEXT,                      -- ShiftOS customer_id (Stripe)
  first_seen_at TIMESTAMPTZ NOT NULL,           -- ShiftOS `created` field
  last_booking_at TIMESTAMPTZ,                  -- denormalized: MAX(reservation.time)
  total_bookings INTEGER NOT NULL DEFAULT 0,    -- denormalized count
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0, -- denormalized sum
  avg_booking_value NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN total_bookings > 0 THEN total_revenue / total_bookings ELSE 0 END
  ) STORED,
  is_returning BOOLEAN GENERATED ALWAYS AS (total_bookings > 1) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shiftos_customers_client ON shiftos_customers (client_id);
CREATE INDEX idx_shiftos_customers_last_booking ON shiftos_customers (last_booking_at DESC);
CREATE INDEX idx_shiftos_customers_first_seen ON shiftos_customers (first_seen_at);
```

**Why denormalize `total_bookings`, `total_revenue`, `last_booking_at`?** Because the owner's primary question is "how are my customers doing?" — every dashboard load would otherwise require a JOIN + GROUP BY across all reservations. With ~500 customers, updating these on sync is trivial.

---

### Table: `shiftos_reservations`

Cached mirror of ShiftOS `/reservations/` filtered to Miami calendars. This is the **booking event log**.

```sql
CREATE TABLE IF NOT EXISTS shiftos_reservations (
  id SERIAL PRIMARY KEY,
  shiftos_reservation_id TEXT NOT NULL UNIQUE,  -- ShiftOS reservation UUID
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES shiftos_customers(shiftos_user_id),
  calendar_id TEXT NOT NULL,                    -- ShiftOS calendar UUID prefix
  calendar_name TEXT NOT NULL,                  -- e.g. "F1 Simulator Bay 1"
  experience_type TEXT,                         -- derived from calendar_name
  booking_time TIMESTAMPTZ NOT NULL,            -- the reservation `time` slot
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  revenue NUMERIC(10,2) NOT NULL DEFAULT 0,     -- from charges API or price map
  revenue_source TEXT NOT NULL DEFAULT 'price_map'
    CHECK (revenue_source IN ('charges_api', 'price_map', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- when the reservation was created
);

CREATE INDEX idx_shiftos_res_client ON shiftos_reservations (client_id);
CREATE INDEX idx_shiftos_res_booking_time ON shiftos_reservations (booking_time DESC);
CREATE INDEX idx_shiftos_res_customer ON shiftos_reservations (customer_id);
CREATE INDEX idx_shiftos_res_calendar ON shiftos_reservations (calendar_name);
CREATE INDEX idx_shiftos_res_date ON shiftos_reservations (client_id, (booking_time::date));
```

---

### Table: `shiftos_price_map`

Static lookup table. The owner enters the price for each experience/calendar name. This is the **fallback revenue source** if `/accounting/charges/` doesn't return amounts.

```sql
CREATE TABLE IF NOT EXISTS shiftos_price_map (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  calendar_name_pattern TEXT NOT NULL,  -- regex or LIKE pattern matching calendar_name
  experience_label TEXT NOT NULL,       -- human-readable: "30min F1 Session", "60min Group Race"
  price NUMERIC(10,2) NOT NULL,         -- revenue per reservation slot
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, calendar_name_pattern)
);
```

**Population:** The owner provides the price list once. Example rows:
| calendar_name_pattern | experience_label | price |
|----------------------|-----------------|-------|
| `%F1%` | F1 Simulator | 45.00 |
| `%GT%` | GT Experience | 55.00 |
| `%Group%` | Group Race | 35.00 |
| `%Party%` | Party Package | 250.00 |
| `%` (catch-all) | Standard Session | 40.00 |

---

### Existing Table Enrichment: `daily_metrics`

The current ShiftOS sync writes `spend: 0` and `conversions: reservation_count`. We upgrade it:

| Column | Current Value | New Value |
|--------|--------------|-----------|
| `spend` | 0 | **Daily revenue** (sum of reservation revenue for that day) |
| `conversions` | reservation count | reservation count (unchanged) |
| `clicks` | new user signups | new user signups (unchanged) |
| `reach` | total users | total users (unchanged) |
| `leads` | 0 | **returning customer bookings** for that day |
| `link_clicks` | 0 | **new customer bookings** for that day |

This is the key insight: by putting revenue into the `spend` column for the `shiftos` platform row, the existing dashboard infrastructure (KPI cards, charts, platform breakdown) automatically picks it up. The `spend` field in `daily_metrics` for ShiftOS represents **revenue earned** rather than money spent — we rename the label in the UI for ShiftOS platform only.

---

## 2. Revenue Calculation: Dual Approach

### Approach A: Charges API (Preferred)

```
GET /accounting/charges/?created__gte={date}&page_size=100
```

**Step 1: Probe the endpoint.** Make a single call and inspect the response shape. We need:
- `amount` or `total` field (the dollar amount)
- `user` or `reservation` FK (to link back)
- `created` or `date` (for daily aggregation)

If the response has an amount, this becomes the source of truth. Each charge maps to a reservation, giving us exact revenue per booking.

**Implementation:** During sync, for each date in range:
1. Fetch charges for that day
2. Match charge -> reservation via user ID + timestamp proximity
3. Write `revenue` on the `shiftos_reservations` row
4. Sum into `daily_metrics.spend` for that day

### Approach B: Price Map (Fallback)

If `/accounting/charges/` doesn't have usable amounts (or the endpoint requires permissions we don't have):

1. Match each reservation's `calendar_name` against `shiftos_price_map` patterns
2. First matching pattern (ordered by specificity — exact match first, then patterns, then catch-all) determines the price
3. Write that price as `revenue` on the reservation row

**The sync code tries Approach A first. If it fails or returns no amount field, it falls back to Approach B automatically.** The `revenue_source` column on `shiftos_reservations` tracks which method was used.

### Revenue Formula

```
daily_revenue = SUM(shiftos_reservations.revenue)
  WHERE booking_time::date = target_date
  AND client_id = X
  AND is_paid = TRUE
```

For unpaid reservations, we still record them but don't count toward revenue. The dashboard shows both: "Booked: $X / Paid: $Y".

---

## 3. Sync Strategy

### What Gets Synced

| Data | Source | Frequency | Method |
|------|--------|-----------|--------|
| Reservations | `GET /reservations/` | Every 5 min (via N8N) | Incremental: `created__gte=last_sync` |
| Users | `GET /users/` | Every 15 min | Incremental: `created__gte=last_sync` |
| Charges | `GET /accounting/charges/` | Every 5 min (with reservations) | Incremental: `created__gte=last_sync` |
| Total Users | `GET /users/?page_size=1` | Every hour | Count only |

### Sync Flow (Enhanced `syncShiftOS`)

```
1. Fetch new reservations since last sync (Miami calendars only)
2. Fetch new users since last sync
3. Attempt: Fetch charges since last sync
4. For each new user:
   a. UPSERT into shiftos_customers (on conflict shiftos_user_id)
5. For each new reservation:
   a. UPSERT into shiftos_reservations
   b. If charge found for this reservation → set revenue from charge, revenue_source = 'charges_api'
   c. Else → match calendar_name against shiftos_price_map, revenue_source = 'price_map'
   d. Update shiftos_customers denormalized fields:
      - total_bookings = total_bookings + 1
      - total_revenue = total_revenue + revenue
      - last_booking_at = MAX(last_booking_at, booking_time)
6. Aggregate into daily_metrics:
   - spend = SUM(revenue) for paid reservations
   - conversions = COUNT(reservations)
   - clicks = COUNT(new users)
   - leads = COUNT(reservations WHERE customer.total_bookings > 1)  -- returning
   - link_clicks = COUNT(reservations WHERE customer.total_bookings = 1)  -- new
```

### What to Cache vs. Fetch Live

| Data | Strategy | Rationale |
|------|----------|-----------|
| Customer list + aggregates | **Cache in Supabase** | Powers lifecycle cards, needs JOIN-free reads |
| Reservations | **Cache in Supabase** | Needed for utilization calc, calendar strip, timeline |
| Daily revenue totals | **Cache in daily_metrics** | Already used by entire dashboard infra |
| Real-time booking count (today) | **Live fetch on page load** | ShiftOS API call: `GET /reservations/?created__gte=todayT00:00:00` — fast, shows the freshest number |
| Price map | **Cache in Supabase** | Static, owner-maintained |

---

## 4. Dashboard UX Design

### 4A. Revenue Section (Top of Company Dashboard)

Add a new **"Revenue" section** above the existing "Spend & Budget" section. This is the first thing the owner sees.

#### Hero Revenue Card (Full Width)
```
┌──────────────────────────────────────────────────────────┐
│  REVENUE TODAY          LAST 30 DAYS        LIFETIME     │
│  $1,245                 $18,430             $127,850     │
│  ▲ 12% vs yesterday     ▲ 8% vs prev 30d                │
│                                                          │
│  28 bookings today · 6 simulators active · 82% paid      │
└──────────────────────────────────────────────────────────┘
```

**Implementation:** New `HeroBookingRevenue` component. Data comes from:
- Today: live ShiftOS API call for today's date
- 30d: `daily_metrics` WHERE platform='shiftos' AND date >= 30d ago, SUM(spend)
- Lifetime: `SUM(total_revenue)` from `shiftos_customers` table

#### Daily Revenue Calendar Strip
A horizontal scrollable strip showing the last 14 days. Each day is a small card:

```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Mon  │ │ Tue  │ │ Wed  │ │ Thu  │ │ Fri  │
│ $845 │ │$1.2k │ │ $430 │ │ $980 │ │$1.5k │
│ 19bk │ │ 26bk │ │ 10bk │ │ 22bk │ │ 32bk │
│ ████ │ │█████ │ │ ██   │ │████  │ │██████│
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

The bar height represents revenue relative to the max day. Color: green gradient. Today's card is highlighted. Tapping a day shows the detail breakdown.

**Data:** `daily_metrics` WHERE platform='shiftos', last 14 days.

---

### 4B. Customer Health Section

Below the revenue hero, a section with **four BentoCards** in a 2x2 grid:

#### Card 1: New vs Returning (Donut)
```
┌─────────────────────┐
│ Customer Mix (30d)   │
│                      │
│   [DONUT CHART]      │
│   58% Returning      │
│   42% New            │
│                      │
│ 156 total customers  │
└─────────────────────┘
```

**Formula:**
- New customers (30d) = `COUNT(shiftos_customers WHERE first_seen_at >= 30d ago AND total_bookings = 1)`
- Returning (30d) = bookings from `shiftos_reservations` WHERE customer's `total_bookings > 1`
- Ratio = returning_bookings / total_bookings

#### Card 2: Customer Return Rate
```
┌─────────────────────┐
│ Return Rate          │
│                      │
│ 34%                  │
│ of all customers     │
│ have booked 2+ times │
│                      │
│ Avg 3.2 visits       │
│ per returning cust   │
└─────────────────────┘
```

**Formula:**
- Return rate = `COUNT(shiftos_customers WHERE total_bookings > 1) / COUNT(shiftos_customers)` (all time)
- Avg visits per returning = `AVG(total_bookings) WHERE total_bookings > 1`

#### Card 3: Avg Time Between Bookings
```
┌─────────────────────┐
│ Rebooking Cadence    │
│                      │
│ 18 days              │
│ avg between visits   │
│                      │
│ Median: 12 days      │
│ Range: 3-45 days     │
└─────────────────────┘
```

**Formula:** For each returning customer, calculate intervals between consecutive `booking_time` values from `shiftos_reservations`, then AVG across all customers.

This requires a query across reservations, partitioned by customer, ordered by booking_time. Best done during sync and stored as a materialized metric, OR computed server-side on page load (acceptable for ~500 customers, ~2000 reservations).

#### Card 4: Revenue Per Customer
```
┌─────────────────────┐
│ Avg Customer Value   │
│                      │
│ LTV: $256            │
│ all-time per cust    │
│                      │
│ 30d avg: $118        │
│ Today avg: $45       │
└─────────────────────┘
```

**Formula:**
- LTV = `AVG(total_revenue)` from `shiftos_customers` WHERE `total_bookings > 0`
- 30d = `SUM(revenue from last 30d reservations) / COUNT(DISTINCT customer_id from last 30d reservations)`

---

### 4C. Simulator Utilization Section

A single wide card with 8 columns (one per Miami simulator/calendar).

```
┌──────────────────────────────────────────────────────┐
│ Simulator Utilization (Today)                         │
│                                                       │
│  Bay 1   Bay 2   Bay 3   Bay 4   Bay 5  Bay 6  ...  │
│  ████    █████   ██      ████    ███    ████         │
│  75%     92%     25%     68%     55%    71%          │
│  6/8     7/8     2/8     5/8     4/8    6/8          │
│                                                       │
│  Overall: 64% utilized · Peak hour: 6-7 PM            │
└──────────────────────────────────────────────────────┘
```

**Formula:**
- For each calendar (simulator), count reservations for the day
- Utilization = `booked_slots / total_available_slots`
- Total available slots per day needs to be configured (e.g., 8 slots per simulator per day = 10am-6pm, 1hr each)
- This is a setting in `shiftos_price_map` or a separate config

**Implementation note:** Available slots could initially be hardcoded (e.g., 12 slots per sim per day for a 12-hour operating window), then later made configurable.

---

### 4D. Recent Bookings Feed

The existing `RecentTransactions` component already has the right shape. We upgrade it with **real data from `shiftos_reservations`** instead of the placeholder data it currently uses.

Add a "Revenue" badge showing the dollar amount per booking, and a "New" or "Return" indicator per customer.

---

### 4E. Customer Story Modal/Drawer

When clicking on a customer name anywhere in the dashboard, open a slide-out drawer:

```
┌──────────────────────────────┐
│ John Smith                   │
│ john@email.com · 305-555-... │
│ Customer since: Jan 15, 2025 │
│                              │
│ LIFETIME       30 DAYS       │
│ $890           $180          │
│ 18 bookings    4 bookings    │
│                              │
│ ─── Booking Timeline ─────── │
│ Mar 20 · F1 Simulator · $45  │
│ Mar 12 · GT Experience · $55 │
│ Feb 28 · Group Race · $35    │
│ Feb 15 · F1 Simulator · $45  │
│ ... (show all)               │
│                              │
│ Avg interval: 9 days         │
│ Favorite: F1 Simulator (72%) │
└──────────────────────────────┘
```

This uses the existing `CustomerJourney` component pattern, populated with real `shiftos_reservations` data for that customer.

---

### 4F. Integration With Existing Dashboard Sections

The existing `daily_metrics`-based sections (Spend & Budget, Reach & Awareness, Conversions) already work. When the user selects "ShiftOS" as a platform filter:

- **Spend** shows as **Revenue** (we relabel in `PLATFORM_NAMES` context or add a per-platform label override)
- **Conversions** = bookings
- **Clicks** = new user signups
- **Reach** = total user base

The existing chart, donut, and platform breakdown components all work without modification — they just need the `daily_metrics` rows to have meaningful `spend` values (revenue).

---

## 5. Key Metrics & Formulas

### Revenue Metrics
| Metric | Formula | Source |
|--------|---------|--------|
| Daily Revenue | `SUM(revenue) WHERE booking_time::date = D AND is_paid` | shiftos_reservations |
| 30-Day Revenue | `SUM(daily_metrics.spend) WHERE platform='shiftos' AND date >= 30d ago` | daily_metrics |
| Lifetime Revenue | `SUM(total_revenue) FROM shiftos_customers` | shiftos_customers |
| Avg Booking Value | `SUM(revenue) / COUNT(reservations) WHERE is_paid` | shiftos_reservations |
| Revenue per Simulator | `SUM(revenue) GROUP BY calendar_name` | shiftos_reservations |

### Customer Metrics
| Metric | Formula | Source |
|--------|---------|--------|
| Return Rate | `COUNT(WHERE total_bookings > 1) / COUNT(all)` | shiftos_customers |
| Avg Visits (returning) | `AVG(total_bookings) WHERE total_bookings > 1` | shiftos_customers |
| Avg Interval | `AVG(days between consecutive bookings) per returning customer` | shiftos_reservations (computed) |
| New Customers Today | `COUNT(WHERE first_seen_at::date = today)` | shiftos_customers |
| Customer LTV | `AVG(total_revenue) WHERE total_bookings > 0` | shiftos_customers |
| 30d Active Customers | `COUNT(DISTINCT customer_id) FROM reservations WHERE booking_time >= 30d ago` | shiftos_reservations |

### Utilization Metrics
| Metric | Formula | Source |
|--------|---------|--------|
| Sim Utilization (day) | `COUNT(reservations for sim on day) / available_slots` | shiftos_reservations + config |
| Peak Hour | `MODE(EXTRACT(HOUR FROM booking_time))` | shiftos_reservations |
| Busiest Day | `MODE(EXTRACT(DOW FROM booking_time))` | shiftos_reservations |

### Attribution Metrics (Ad Spend -> Revenue)
| Metric | Formula | Source |
|--------|---------|--------|
| True ROAS | `shiftos_revenue / ad_spend` for same period | daily_metrics (both platforms) |
| Cost Per Booking | `ad_spend / booking_count` | daily_metrics |
| New Customer Acquisition Cost | `ad_spend / new_customer_count` | daily_metrics |

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1) — The 80/20
**Goal:** Revenue visible on the dashboard. This single phase delivers 80% of the value.

1. Create `shiftos_price_map` table + seed with prices from owner
2. Create `shiftos_customers` table
3. Create `shiftos_reservations` table
4. Probe `GET /accounting/charges/` to determine if amounts are available
5. Enhance `syncShiftOS` to:
   - Populate `shiftos_customers` from users
   - Populate `shiftos_reservations` from reservations
   - Calculate revenue per reservation (charges API or price map)
   - Write revenue into `daily_metrics.spend` for shiftos platform
6. Build `HeroBookingRevenue` component (today / 30d / lifetime)
7. Build daily revenue calendar strip
8. Wire `RecentTransactions` to real `shiftos_reservations` data

**Owner sees after Phase 1:** Daily revenue, total revenue, booking counts, and real recent bookings on the dashboard. The existing platform charts and KPI cards automatically show ShiftOS revenue.

### Phase 2: Customer Intelligence (Week 2)
**Goal:** Customer health visible. Return rates, lifecycle metrics.

1. Build the 4 customer health BentoCards (new/returning donut, return rate, rebooking cadence, avg customer value)
2. Build server action `getCustomerHealthMetrics(clientId)` that queries `shiftos_customers` aggregates
3. Add "New" / "Returning" badges to the RecentTransactions cards
4. Build the Customer Story drawer/modal
5. Add a "Top Customers" mini-leaderboard card (top 5 by lifetime revenue)

### Phase 3: Utilization & Attribution (Week 3)
**Goal:** Simulator utilization and ad-to-revenue attribution.

1. Build the Simulator Utilization card (per-calendar booking density)
2. Add True ROAS calculation (ad spend vs ShiftOS revenue for same period)
3. Add Cost Per Booking metric (total ad spend / total bookings)
4. Add cohort analysis: customers who signed up in month X — what's their total revenue?
5. Add the "peak hours" and "busiest days" insights

### Phase 4: Polish & Automation (Week 4)
**Goal:** Refinements, alerts, scheduled reports.

1. Add revenue to the N8N scheduled report (daily revenue summary in Telegram)
2. Build anomaly detection: alert if daily revenue drops >30% vs trailing 7-day avg
3. Add configurable available-slots setting for accurate utilization %
4. Customer churn warning: flag customers whose avg interval has doubled
5. Export: CSV download of customer list with lifecycle metrics

---

## 7. Practical Notes

### Why Not Just Use daily_metrics for Everything?

`daily_metrics` is great for aggregated per-day platform comparisons. But the owner's questions require **customer-level and booking-level granularity** that a single row per day can't answer:
- "Who are my top customers?"
- "How many customers came back this week?"
- "Which simulator is most popular?"
- "What's the typical time between bookings?"

The three new tables give us that granularity while `daily_metrics` continues to serve the aggregate dashboard.

### Data Volume Estimate

For a single venue doing ~20-40 bookings/day:
- ~10,000 reservations/year → `shiftos_reservations` stays small
- ~2,000-3,000 unique customers/year → `shiftos_customers` stays small
- All queries will be sub-50ms with proper indexes

### Price Map Maintenance

The `shiftos_price_map` is the one manual element. Keep it simple:
- Owner fills it once via a settings page or direct Supabase insert
- It only changes when pricing changes (rare for a venue)
- If charges API works, the price map becomes a backup only

### Schema Ordering: Why `calendar_name` and not `calendar_id`

The ShiftOS `calendar` field on reservations is a UUID that includes the prefix we use for Miami filtering. But the `calendar_name` (from `readonly_values`) is the human-readable name that maps to experiences. We store both: the ID for dedup/filtering, the name for display and price matching.
