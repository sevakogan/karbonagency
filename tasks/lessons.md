# Lessons Learned

## 2026-03-20 — Hardcoded Tailwind colors don't work with theme systems
**Mistake:** Built a full iOS 18 CSS variable theme system (dark/light/system) but left all existing components using hardcoded Tailwind classes (`bg-white`, `text-gray-900`, `border-gray-200`). The result was a broken-looking mix of themed and unthemed elements.
**Correct approach:** When introducing a theme system, ALL visible components must be updated to use the CSS variables — not just the new ones. Do a sweep of every component that renders on screen and replace hardcoded color classes with `style={{ color: "var(--text-primary)" }}` etc.
**Rule:** When adding a theme/design system, NEVER ship without converting ALL visible components to use the new variables. Check every component that appears on the current page before pushing.

## 2026-03-20 — UI sizing too large for dashboard apps
**Mistake:** Used large font sizes (text-2xl, text-3xl) and generous padding (p-5, p-6) on dashboard cards and stats, making the UI feel bloated and un-iOS-like.
**Correct approach:** Dashboard UIs should be compact. Use smaller type (text-lg max for values, text-[11px] for labels), tighter padding (p-3), and iOS-proportioned spacing. Think iPhone Settings app density, not marketing landing page.
**Rule:** For dashboard/admin UIs, default to compact sizing. If it looks like a marketing page, it's too big. Reference iOS Settings or Stocks app density.

## Rules
- When adding a theme/design system, convert ALL visible components to use the new variables before shipping — no hardcoded Tailwind color classes alongside CSS variables
- Dashboard UIs = compact sizing. Use text-lg max for values, text-[11px] for labels, p-3 for card padding
- Always check the rendered page in browser before pushing — don't assume CSS changes look right
- When doing a major redesign, do a `grep` for hardcoded color classes across ALL component files and fix them in the same PR
- Platform/integration lists should be COMPACT ROWS (like iOS Settings), not big grid cards. Think list items, not marketing cards. One row per item with inline controls.
- Dashboard UI density: if a card has only 3-4 pieces of info, it should be a single row — not a card with sections, headers, and a full-width button

## 2026-03-21 — Don't ask Seva to run things
**Mistake:** Asked user to run the bootstrap curl command manually
**Correct approach:** Run it myself. Claude can execute any API call, curl, deployment trigger, or automation step. Only ask the user for things that physically require their input (passwords, OAuth flows in browser, hardware access).
**Rule:** NEVER ask the user to do something Claude can do. Always execute it. Only escalate when physically impossible (browser OAuth, entering credentials on a website, hardware).

## 2026-03-21 — Miami store only, always
**Mistake:** Revenue this month was pulling data without proper Miami filtering
**Correct approach:** ALL ShiftOS data queries must filter by company_id (Shift Arcade Miami UUID: 950d0b84-63fa-409b-ad4f-ca1fdae25c7c) AND only use the 8 Miami calendar IDs. Never show data from other locations.
**Rule:** EVERY query touching shiftos_customers or shiftos_reservations MUST include .eq('company_id', MIAMI_COMPANY_ID). Revenue calculations must only count paid=true reservations from Miami calendars (Hamilton-Mia, Verstappen-Mia, Norris-Mia, Piastri-Mia, Russell-Mia, Leclerc-Mia, Antonelli-Mia, Sainz-Mia).
