import { getAdminSupabase } from '@/lib/supabase-admin';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';
const EMPLOYEE_SHIFTOS_IDS = new Set([79299, 71048]);

interface ChurnRisk {
  customer_id: string;
  name: string;
  email: string;
  churn_score: number; // 0-100, higher = more likely to churn
  risk_level: 'safe' | 'watch' | 'at_risk' | 'critical';
  factors: string[]; // human-readable reasons
  last_booking_days: number;
  avg_booking_gap: number;
  total_bookings: number;
  lifetime_value: number;
  predicted_next_booking: string | null; // ISO date
  win_back_urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ChurnPredictionResult {
  customers: ChurnRisk[];
  summary: {
    safe: number;
    watch: number;
    at_risk: number;
    critical: number;
    total_at_risk_revenue: number;
  };
}

export async function predictChurn(): Promise<ChurnPredictionResult> {
  const supabase = getAdminSupabase();
  const now = Date.now();

  // Fetch all customers with booking data
  const { data: customers } = await supabase
    .from('shiftos_customers')
    .select('id, shiftos_user_id, first_name, last_name, email, total_bookings, total_revenue, first_booking_at, last_booking_at, signup_date, is_returning')
    .eq('company_id', MIAMI_COMPANY_ID);

  // Fetch all reservations for gap analysis
  const allReservations: Array<{ customer_id: string; booking_time: string; revenue: number }> = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from('shiftos_reservations')
      .select('customer_id, booking_time, revenue')
      .eq('company_id', MIAMI_COMPANY_ID)
      .eq('paid', true)
      .order('booking_time', { ascending: true })
      .range(from, from + PAGE - 1);
    if (!data?.length) break;
    allReservations.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Build per-customer booking gaps
  const customerBookings = new Map<string, Date[]>();
  for (const r of allReservations) {
    const list = customerBookings.get(r.customer_id) ?? [];
    list.push(new Date(r.booking_time));
    customerBookings.set(r.customer_id, list);
  }

  const results: ChurnRisk[] = [];

  for (const c of customers ?? []) {
    if (EMPLOYEE_SHIFTOS_IDS.has(c.shiftos_user_id)) continue;
    if (!c.last_booking_at) continue;

    const lastBookingMs = new Date(c.last_booking_at).getTime();
    const daysSinceLast = Math.floor((now - lastBookingMs) / (1000 * 60 * 60 * 24));

    // Calculate average gap between bookings
    const bookings = customerBookings.get(c.id) ?? [];
    let avgGap = 0;
    if (bookings.length >= 2) {
      const sorted = [...bookings].sort((a, b) => a.getTime() - b.getTime());
      let totalGap = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalGap += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      }
      avgGap = totalGap / (sorted.length - 1);
    }

    // ── Churn scoring model ──
    // Factors weighted by importance
    let score = 0;
    const factors: string[] = [];

    // Factor 1: Days since last booking vs their personal average gap (40% weight)
    if (avgGap > 0 && daysSinceLast > avgGap) {
      const overdueRatio = daysSinceLast / avgGap;
      if (overdueRatio >= 3) {
        score += 40;
        factors.push(`${daysSinceLast}d since last visit — ${overdueRatio.toFixed(1)}x their usual ${Math.round(avgGap)}d gap`);
      } else if (overdueRatio >= 2) {
        score += 30;
        factors.push(`Overdue by ${Math.round(daysSinceLast - avgGap)}d — usually returns every ${Math.round(avgGap)}d`);
      } else if (overdueRatio >= 1.5) {
        score += 15;
        factors.push(`Approaching overdue — ${daysSinceLast}d vs ${Math.round(avgGap)}d avg gap`);
      }
    } else if (daysSinceLast > 90) {
      score += 35;
      factors.push(`${daysSinceLast} days since last visit (no pattern established)`);
    } else if (daysSinceLast > 60) {
      score += 20;
      factors.push(`${daysSinceLast} days since last visit`);
    }

    // Factor 2: Total bookings (20% weight) — one-timers are high risk
    if (c.total_bookings === 1) {
      score += 20;
      factors.push('Single visit only — never returned');
    } else if (c.total_bookings === 2) {
      score += 10;
      factors.push('Only 2 visits — habit not yet formed');
    }

    // Factor 3: Recency decay (20% weight)
    if (daysSinceLast > 120) {
      score += 20;
      factors.push('Over 4 months inactive');
    } else if (daysSinceLast > 60) {
      score += 10;
      factors.push('Over 2 months inactive');
    }

    // Factor 4: Booking frequency trend (10% weight) — are gaps getting longer?
    if (bookings.length >= 3) {
      const sorted = [...bookings].sort((a, b) => a.getTime() - b.getTime());
      const recentGaps: number[] = [];
      const earlyGaps: number[] = [];
      const mid = Math.floor(sorted.length / 2);

      for (let i = 1; i < sorted.length; i++) {
        const gap = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (i > mid) recentGaps.push(gap);
        else earlyGaps.push(gap);
      }

      const avgRecent = recentGaps.length > 0 ? recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length : 0;
      const avgEarly = earlyGaps.length > 0 ? earlyGaps.reduce((a, b) => a + b, 0) / earlyGaps.length : 0;

      if (avgEarly > 0 && avgRecent > avgEarly * 1.5) {
        score += 10;
        factors.push('Booking frequency slowing down');
      }
    }

    // Factor 5: Low LTV (10% weight) — less invested customers churn more
    if (c.total_revenue < 100) {
      score += 10;
      factors.push(`Low lifetime spend ($${c.total_revenue})`);
    }

    // Bonus: reduce score for very active customers
    if (daysSinceLast < 14 && c.total_bookings >= 3) {
      score = Math.max(0, score - 20);
    }

    score = Math.min(100, Math.max(0, score));

    // Determine risk level
    const risk_level: ChurnRisk['risk_level'] =
      score >= 70 ? 'critical' :
      score >= 45 ? 'at_risk' :
      score >= 25 ? 'watch' :
      'safe';

    // Predict next booking based on avg gap
    let predicted_next_booking: string | null = null;
    if (avgGap > 0 && daysSinceLast < avgGap * 2) {
      const nextMs = lastBookingMs + avgGap * 24 * 60 * 60 * 1000;
      predicted_next_booking = new Date(nextMs).toISOString().split('T')[0];
    }

    // Win-back urgency
    const win_back_urgency: ChurnRisk['win_back_urgency'] =
      score >= 70 && c.total_revenue >= 200 ? 'urgent' :
      score >= 70 ? 'high' :
      score >= 45 ? 'medium' :
      'low';

    if (factors.length === 0) factors.push('Active and healthy');

    results.push({
      customer_id: c.id,
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
      email: c.email ?? '',
      churn_score: score,
      risk_level,
      factors,
      last_booking_days: daysSinceLast,
      avg_booking_gap: Math.round(avgGap),
      total_bookings: c.total_bookings ?? 0,
      lifetime_value: c.total_revenue ?? 0,
      predicted_next_booking,
      win_back_urgency,
    });
  }

  // Sort by churn score descending
  results.sort((a, b) => b.churn_score - a.churn_score);

  const summary = {
    safe: results.filter((r) => r.risk_level === 'safe').length,
    watch: results.filter((r) => r.risk_level === 'watch').length,
    at_risk: results.filter((r) => r.risk_level === 'at_risk').length,
    critical: results.filter((r) => r.risk_level === 'critical').length,
    total_at_risk_revenue: results
      .filter((r) => r.risk_level === 'at_risk' || r.risk_level === 'critical')
      .reduce((s, r) => s + r.lifetime_value, 0),
  };

  return { customers: results, summary };
}
