import { getAdminSupabase } from '@/lib/supabase-admin';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';
const EMPLOYEE_SHIFTOS_IDS = new Set([79299, 71048]);

interface ForecastDay {
  date: string;
  predicted_revenue: number;
  confidence_low: number;
  confidence_high: number;
  is_weekend: boolean;
  day_of_week: string;
}

export interface Forecast {
  daily: ForecastDay[];
  summary: {
    projected_30d_revenue: number;
    confidence_low: number;
    confidence_high: number;
    avg_daily_projected: number;
    trend: 'growing' | 'stable' | 'declining';
    trend_pct: number;
    best_day: string;
    worst_day: string;
    weekend_vs_weekday_ratio: number;
  };
  basis: {
    days_of_history: number;
    avg_daily_revenue_30d: number;
    avg_daily_revenue_7d: number;
    day_of_week_multipliers: Record<string, number>;
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function forecastRevenue(): Promise<Forecast> {
  const supabase = getAdminSupabase();
  const now = new Date();

  // Fetch last 90 days of reservations for training data
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const allReservations: Array<{ revenue: number; booking_time: string; shiftos_user_id: number }> = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from('shiftos_reservations')
      .select('revenue, booking_time, shiftos_user_id')
      .eq('company_id', MIAMI_COMPANY_ID)
      .eq('paid', true)
      .gte('booking_time', ninetyDaysAgo)
      .order('booking_time', { ascending: true })
      .range(from, from + PAGE - 1);
    if (!data?.length) break;
    allReservations.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Filter employees
  const reservations = allReservations.filter((r) => !EMPLOYEE_SHIFTOS_IDS.has(r.shiftos_user_id));

  // Group revenue by date
  const dailyRevenue = new Map<string, number>();
  for (const r of reservations) {
    const date = new Date(r.booking_time).toISOString().split('T')[0];
    dailyRevenue.set(date, (dailyRevenue.get(date) ?? 0) + Number(r.revenue ?? 0));
  }

  // Build day-of-week multipliers (seasonality)
  const dowTotals: number[] = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

  for (const [dateStr, rev] of dailyRevenue) {
    const dow = new Date(dateStr + 'T12:00:00Z').getDay();
    dowTotals[dow] += rev;
    dowCounts[dow] += 1;
  }

  const dowAvgs = dowTotals.map((total, i) => dowCounts[i] > 0 ? total / dowCounts[i] : 0);
  const overallAvg = dowAvgs.reduce((a, b) => a + b, 0) / dowAvgs.filter((a) => a > 0).length || 1;
  const dowMultipliers = dowAvgs.map((avg) => avg > 0 ? avg / overallAvg : 1);

  // Calculate trend: compare last 7 days vs previous 7 days
  const dates = [...dailyRevenue.keys()].sort();
  const last7Dates = dates.slice(-7);
  const prev7Dates = dates.slice(-14, -7);

  const avgLast7 = last7Dates.length > 0
    ? last7Dates.reduce((s, d) => s + (dailyRevenue.get(d) ?? 0), 0) / last7Dates.length
    : 0;
  const avgPrev7 = prev7Dates.length > 0
    ? prev7Dates.reduce((s, d) => s + (dailyRevenue.get(d) ?? 0), 0) / prev7Dates.length
    : 0;

  const trendPct = avgPrev7 > 0 ? ((avgLast7 - avgPrev7) / avgPrev7) * 100 : 0;
  const trend: 'growing' | 'stable' | 'declining' =
    trendPct > 10 ? 'growing' :
    trendPct < -10 ? 'declining' :
    'stable';

  // Base daily rate: weighted average of recent performance
  // 70% weight on last 7 days, 30% on last 30 days
  const last30Dates = dates.slice(-30);
  const avgLast30 = last30Dates.length > 0
    ? last30Dates.reduce((s, d) => s + (dailyRevenue.get(d) ?? 0), 0) / last30Dates.length
    : 0;

  const baseDaily = avgLast7 * 0.7 + avgLast30 * 0.3;

  // Apply a small growth/decline factor based on trend
  const trendMultiplier = 1 + (trendPct / 100) * 0.3; // dampen the trend

  // Generate 30-day forecast
  const daily: ForecastDay[] = [];
  let totalProjected = 0;

  for (let i = 1; i <= 30; i++) {
    const forecastDate = new Date(now);
    forecastDate.setDate(forecastDate.getDate() + i);
    const dow = forecastDate.getDay();
    const dateStr = forecastDate.toISOString().split('T')[0];

    // Apply day-of-week seasonality + trend
    const predicted = baseDaily * dowMultipliers[dow] * trendMultiplier;

    // Confidence interval widens as we go further out
    const uncertaintyFactor = 1 + (i / 30) * 0.3; // up to 30% wider at day 30
    const stdDev = baseDaily * 0.25 * uncertaintyFactor; // assume ~25% daily variance

    const day: ForecastDay = {
      date: dateStr,
      predicted_revenue: Math.round(predicted),
      confidence_low: Math.round(Math.max(0, predicted - 1.5 * stdDev)),
      confidence_high: Math.round(predicted + 1.5 * stdDev),
      is_weekend: dow === 0 || dow === 5 || dow === 6,
      day_of_week: DAY_NAMES[dow],
    };

    daily.push(day);
    totalProjected += predicted;
  }

  // Find best/worst predicted days of week
  const dowPredictions = DAY_NAMES.map((name, i) => ({
    name,
    avg: dowAvgs[i],
  })).filter((d) => d.avg > 0);

  const bestDay = [...dowPredictions].sort((a, b) => b.avg - a.avg)[0]?.name ?? 'Saturday';
  const worstDay = [...dowPredictions].sort((a, b) => a.avg - b.avg)[0]?.name ?? 'Tuesday';

  // Weekend vs weekday ratio
  const weekendAvg = ([0, 5, 6].reduce((s, i) => s + dowAvgs[i], 0)) / 3;
  const weekdayAvg = ([1, 2, 3, 4].reduce((s, i) => s + dowAvgs[i], 0)) / 4;
  const weekendRatio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 1;

  const day_of_week_multipliers: Record<string, number> = {};
  DAY_NAMES.forEach((name, i) => {
    day_of_week_multipliers[name] = Math.round(dowMultipliers[i] * 100) / 100;
  });

  return {
    daily,
    summary: {
      projected_30d_revenue: Math.round(totalProjected),
      confidence_low: Math.round(daily.reduce((s, d) => s + d.confidence_low, 0)),
      confidence_high: Math.round(daily.reduce((s, d) => s + d.confidence_high, 0)),
      avg_daily_projected: Math.round(totalProjected / 30),
      trend,
      trend_pct: Math.round(trendPct * 10) / 10,
      best_day: bestDay,
      worst_day: worstDay,
      weekend_vs_weekday_ratio: Math.round(weekendRatio * 100) / 100,
    },
    basis: {
      days_of_history: dates.length,
      avg_daily_revenue_30d: Math.round(avgLast30),
      avg_daily_revenue_7d: Math.round(avgLast7),
      day_of_week_multipliers,
    },
  };
}
