import { getAdminSupabase } from '@/lib/supabase-admin';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

interface Anomaly {
  type: 'revenue_drop' | 'revenue_spike' | 'no_bookings' | 'high_refunds' | 'ad_spend_spike' | 'roas_drop' | 'new_customer_surge' | 'budget_overpace';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  current: number;
  baseline: number;
  change_pct: number;
}

/**
 * Detect anomalies by comparing today's data to the same day last week
 * and the trailing 7-day average.
 */
export async function detectAnomalies(): Promise<Anomaly[]> {
  const supabase = getAdminSupabase();
  const anomalies: Anomaly[] = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Get today's date boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = now.toISOString();

  // Same day last week
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStr = lastWeekDate.toISOString().split('T')[0];

  // Trailing 7-day window (excluding today)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // ── Revenue check ──
  const [{ data: todayRevenue }, { data: trailingRevenue }] = await Promise.all([
    supabase
      .from('shiftos_reservations')
      .select('revenue')
      .eq('company_id', MIAMI_COMPANY_ID)
      .eq('paid', true)
      .gte('booking_time', todayStart)
      .lt('booking_time', todayEnd),
    supabase
      .from('shiftos_reservations')
      .select('revenue, booking_time')
      .eq('company_id', MIAMI_COMPANY_ID)
      .eq('paid', true)
      .gte('booking_time', sevenDaysAgoStr + 'T00:00:00Z')
      .lt('booking_time', today + 'T00:00:00Z'),
  ]);

  const todayRev = (todayRevenue ?? []).reduce((s, r) => s + Number(r.revenue ?? 0), 0);
  const trailingDays = new Map<string, number>();
  for (const r of trailingRevenue ?? []) {
    const day = new Date(r.booking_time).toISOString().split('T')[0];
    trailingDays.set(day, (trailingDays.get(day) ?? 0) + Number(r.revenue ?? 0));
  }
  const avgDailyRev = trailingDays.size > 0
    ? [...trailingDays.values()].reduce((a, b) => a + b, 0) / trailingDays.size
    : 0;

  // Scale today's partial-day revenue to full-day estimate
  const hoursElapsed = Math.max(1, now.getHours() + now.getMinutes() / 60);
  const projectedRev = (todayRev / hoursElapsed) * 16; // assume 16 operating hours

  if (avgDailyRev > 0) {
    const revChangePct = ((projectedRev - avgDailyRev) / avgDailyRev) * 100;

    if (revChangePct <= -40) {
      anomalies.push({
        type: 'revenue_drop', severity: 'critical',
        message: `Revenue is projecting $${Math.round(projectedRev)} today — ${Math.abs(Math.round(revChangePct))}% below the 7-day average of $${Math.round(avgDailyRev)}`,
        metric: 'daily_revenue', current: projectedRev, baseline: avgDailyRev, change_pct: revChangePct,
      });
    } else if (revChangePct <= -20) {
      anomalies.push({
        type: 'revenue_drop', severity: 'warning',
        message: `Revenue trending ${Math.abs(Math.round(revChangePct))}% below average today ($${Math.round(projectedRev)} projected vs $${Math.round(avgDailyRev)} avg)`,
        metric: 'daily_revenue', current: projectedRev, baseline: avgDailyRev, change_pct: revChangePct,
      });
    } else if (revChangePct >= 50) {
      anomalies.push({
        type: 'revenue_spike', severity: 'info',
        message: `Strong day — revenue projecting $${Math.round(projectedRev)}, ${Math.round(revChangePct)}% above average`,
        metric: 'daily_revenue', current: projectedRev, baseline: avgDailyRev, change_pct: revChangePct,
      });
    }
  }

  if (todayRev === 0 && hoursElapsed >= 4) {
    anomalies.push({
      type: 'no_bookings', severity: 'critical',
      message: `No paid bookings today and it's already ${Math.round(hoursElapsed)} hours in`,
      metric: 'daily_bookings', current: 0, baseline: avgDailyRev, change_pct: -100,
    });
  }

  // ── Ad spend check ──
  const [{ data: todayAds }, { data: trailingAds }] = await Promise.all([
    supabase
      .from('daily_metrics')
      .select('spend, clicks, conversions')
      .eq('client_id', MIAMI_COMPANY_ID)
      .eq('date', today)
      .eq('platform', 'meta'),
    supabase
      .from('daily_metrics')
      .select('spend, clicks, conversions, date')
      .eq('client_id', MIAMI_COMPANY_ID)
      .eq('platform', 'meta')
      .gte('date', sevenDaysAgoStr)
      .lte('date', yesterdayStr),
  ]);

  const todaySpend = (todayAds ?? []).reduce((s, r) => s + Number(r.spend ?? 0), 0);
  const todayConversions = (todayAds ?? []).reduce((s, r) => s + Number(r.conversions ?? 0), 0);
  const trailingSpendDays = new Map<string, number>();
  const trailingConvDays = new Map<string, number>();
  for (const r of trailingAds ?? []) {
    trailingSpendDays.set(r.date, (trailingSpendDays.get(r.date) ?? 0) + Number(r.spend ?? 0));
    trailingConvDays.set(r.date, (trailingConvDays.get(r.date) ?? 0) + Number(r.conversions ?? 0));
  }
  const avgDailySpend = trailingSpendDays.size > 0
    ? [...trailingSpendDays.values()].reduce((a, b) => a + b, 0) / trailingSpendDays.size
    : 0;

  if (avgDailySpend > 0 && todaySpend > 0) {
    const spendChangePct = ((todaySpend - avgDailySpend) / avgDailySpend) * 100;
    if (spendChangePct >= 50) {
      anomalies.push({
        type: 'ad_spend_spike', severity: 'warning',
        message: `Ad spend at $${todaySpend.toFixed(0)} today — ${Math.round(spendChangePct)}% above the $${avgDailySpend.toFixed(0)} daily average`,
        metric: 'ad_spend', current: todaySpend, baseline: avgDailySpend, change_pct: spendChangePct,
      });
    }
  }

  // ROAS check — if we have both spend and revenue
  if (todaySpend > 10 && projectedRev > 0) {
    const todayRoas = projectedRev / todaySpend;
    const avgConvPerDay = trailingConvDays.size > 0
      ? [...trailingConvDays.values()].reduce((a, b) => a + b, 0) / trailingConvDays.size
      : 0;
    const avgRoas = avgDailySpend > 0 ? avgDailyRev / avgDailySpend : 0;

    if (avgRoas > 0) {
      const roasChangePct = ((todayRoas - avgRoas) / avgRoas) * 100;
      if (roasChangePct <= -40) {
        anomalies.push({
          type: 'roas_drop', severity: 'warning',
          message: `ROAS at ${todayRoas.toFixed(1)}x today vs ${avgRoas.toFixed(1)}x average — ad efficiency dropping`,
          metric: 'roas', current: todayRoas, baseline: avgRoas, change_pct: roasChangePct,
        });
      }
    }
  }

  // ── New customer surge ──
  const { data: todayNewCustomers } = await supabase
    .from('shiftos_customers')
    .select('id')
    .eq('company_id', MIAMI_COMPANY_ID)
    .gte('signup_date', todayStart);

  const todayNew = todayNewCustomers?.length ?? 0;

  const { data: trailingNewCustomers } = await supabase
    .from('shiftos_customers')
    .select('signup_date')
    .eq('company_id', MIAMI_COMPANY_ID)
    .gte('signup_date', sevenDaysAgoStr + 'T00:00:00Z')
    .lt('signup_date', today + 'T00:00:00Z');

  const newByDay = new Map<string, number>();
  for (const c of trailingNewCustomers ?? []) {
    const day = new Date(c.signup_date).toISOString().split('T')[0];
    newByDay.set(day, (newByDay.get(day) ?? 0) + 1);
  }
  const avgDailyNew = newByDay.size > 0
    ? [...newByDay.values()].reduce((a, b) => a + b, 0) / newByDay.size
    : 0;

  if (avgDailyNew > 0 && todayNew > 0) {
    const newChangePct = ((todayNew - avgDailyNew) / avgDailyNew) * 100;
    if (newChangePct >= 100) {
      anomalies.push({
        type: 'new_customer_surge', severity: 'info',
        message: `${todayNew} new customers today — ${Math.round(newChangePct)}% above average of ${avgDailyNew.toFixed(0)}/day`,
        metric: 'new_customers', current: todayNew, baseline: avgDailyNew, change_pct: newChangePct,
      });
    }
  }

  // ── Budget pacing check ──
  const monthlyBudget = Number(process.env.MONTHLY_AD_BUDGET) || 3000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const { data: monthAds } = await supabase
    .from('daily_metrics')
    .select('spend, date')
    .eq('client_id', MIAMI_COMPANY_ID)
    .eq('platform', 'meta')
    .gte('date', monthStartStr)
    .lte('date', today);

  const monthSpendSoFar = (monthAds ?? []).reduce((s, r) => s + Number(r.spend ?? 0), 0);
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthlySpend = (monthSpendSoFar / daysElapsed) * daysInMonth;

  if (projectedMonthlySpend > monthlyBudget * 1.1) {
    const severity = projectedMonthlySpend > monthlyBudget * 1.3 ? 'critical' : 'warning';
    const pctOver = Math.round(((projectedMonthlySpend - monthlyBudget) / monthlyBudget) * 100);
    anomalies.push({
      type: 'budget_overpace',
      severity,
      message: `Ad spend pacing ${pctOver}% over budget — $${Math.round(monthSpendSoFar)} spent in ${daysElapsed} days, projecting $${Math.round(projectedMonthlySpend)} vs $${monthlyBudget} budget`,
      metric: 'monthly_ad_budget',
      current: projectedMonthlySpend,
      baseline: monthlyBudget,
      change_pct: pctOver,
    });
  }

  // ── Refund check (from charges table, graceful if table doesn't exist) ──
  try {
    const { data: recentRefunds } = await supabase
      .from('shiftos_charges')
      .select('amount_refunded, amount_cents')
      .eq('company_id', MIAMI_COMPANY_ID)
      .gte('charge_created_at', sevenDaysAgoStr + 'T00:00:00Z');

    const totalCharged = (recentRefunds ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
    const totalRefunded = (recentRefunds ?? []).reduce((s, r) => s + (r.amount_refunded ?? 0), 0);
    const refundRate = totalCharged > 0 ? (totalRefunded / totalCharged) * 100 : 0;

    if (refundRate > 5) {
      anomalies.push({
        type: 'high_refunds', severity: refundRate > 10 ? 'critical' : 'warning',
        message: `Refund rate at ${refundRate.toFixed(1)}% over the last 7 days ($${(totalRefunded / 100).toFixed(0)} refunded)`,
        metric: 'refund_rate', current: refundRate, baseline: 3, change_pct: refundRate - 3,
      });
    }
  } catch {
    // shiftos_charges table might not exist yet
  }

  return anomalies;
}
