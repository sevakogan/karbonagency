import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

// Employees excluded
const EMPLOYEE_SHIFTOS_IDS = new Set([79299, 71048]);

export async function GET(request: NextRequest) {
  // Auth check
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) { /* ok */ }
  else if (apiKey && apiKey === process.env.CRON_SECRET) { /* ok */ }
  else {
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = getAdminSupabase();

    // Get all customers with their first booking month
    const { data: customers } = await supabase
      .from('shiftos_customers')
      .select('id, shiftos_user_id, first_booking_at, total_revenue, total_bookings, signup_date')
      .eq('company_id', MIAMI_COMPANY_ID)
      .not('first_booking_at', 'is', null);

    // Get all reservations for revenue-by-month calculation
    const allReservations: Array<{ customer_id: string; revenue: number; booking_time: string; shiftos_user_id: number }> = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await supabase
        .from('shiftos_reservations')
        .select('customer_id, revenue, booking_time, shiftos_user_id')
        .eq('company_id', MIAMI_COMPANY_ID)
        .eq('paid', true)
        .range(from, from + PAGE - 1);
      if (!data?.length) break;
      allReservations.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // Filter employees
    const filteredCustomers = (customers ?? []).filter((c) => !EMPLOYEE_SHIFTOS_IDS.has(c.shiftos_user_id));
    const filteredReservations = allReservations.filter((r) => !EMPLOYEE_SHIFTOS_IDS.has(r.shiftos_user_id));

    // Build customer → acquisition month mapping
    const customerCohort = new Map<string, string>();
    for (const c of filteredCustomers) {
      const cohortMonth = c.first_booking_at!.substring(0, 7); // "2025-01"
      customerCohort.set(c.id, cohortMonth);
    }

    // Build cohort data: for each cohort month, track spend in each subsequent month
    const cohortData = new Map<string, {
      cohort: string;
      customerCount: number;
      months: Map<string, { revenue: number; bookings: number; activeCustomers: Set<string> }>;
    }>();

    // Initialize cohorts from customers
    for (const c of filteredCustomers) {
      const cohort = c.first_booking_at!.substring(0, 7);
      if (!cohortData.has(cohort)) {
        cohortData.set(cohort, { cohort, customerCount: 0, months: new Map() });
      }
      cohortData.get(cohort)!.customerCount += 1;
    }

    // Assign reservation revenue to cohort × activity month
    for (const r of filteredReservations) {
      const cohort = customerCohort.get(r.customer_id);
      if (!cohort) continue;
      const activityMonth = r.booking_time.substring(0, 7);
      const cd = cohortData.get(cohort);
      if (!cd) continue;

      const existing = cd.months.get(activityMonth) ?? { revenue: 0, bookings: 0, activeCustomers: new Set<string>() };
      existing.revenue += Number(r.revenue ?? 0);
      existing.bookings += 1;
      existing.activeCustomers.add(r.customer_id);
      cd.months.set(activityMonth, existing);
    }

    // Convert to serializable format
    // Each cohort row has: cohort month, # customers, and revenue per calendar month
    const allMonths = new Set<string>();
    for (const cd of cohortData.values()) {
      for (const m of cd.months.keys()) allMonths.add(m);
    }
    const sortedMonths = [...allMonths].sort();

    const cohorts = [...cohortData.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohort, data]) => {
        const monthlyData: Record<string, { revenue: number; bookings: number; active_customers: number }> = {};
        let cumulativeRevenue = 0;

        for (const month of sortedMonths) {
          const md = data.months.get(month);
          if (md) {
            cumulativeRevenue += md.revenue;
            monthlyData[month] = {
              revenue: Math.round(md.revenue * 100) / 100,
              bookings: md.bookings,
              active_customers: md.activeCustomers.size,
            };
          }
        }

        const retentionByMonth: Record<string, number> = {};
        for (const month of sortedMonths) {
          const md = data.months.get(month);
          retentionByMonth[month] = md ? Math.round((md.activeCustomers.size / data.customerCount) * 100) : 0;
        }

        return {
          cohort,
          customer_count: data.customerCount,
          total_revenue: Math.round(cumulativeRevenue * 100) / 100,
          avg_revenue_per_customer: data.customerCount > 0
            ? Math.round((cumulativeRevenue / data.customerCount) * 100) / 100
            : 0,
          monthly: monthlyData,
          retention: retentionByMonth,
        };
      });

    return NextResponse.json({
      cohorts,
      months: sortedMonths,
      total_cohorts: cohorts.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cohorts] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
