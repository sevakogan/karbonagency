export interface ShiftOSCustomer {
  id: string; // shiftos user id
  company_id: string;
  shiftos_user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  signup_date: string;
  first_booking_at: string | null;
  last_booking_at: string | null;
  total_bookings: number;
  total_revenue: number;
  is_returning: boolean;
  days_signup_to_first_booking: number | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftOSReservationRecord {
  id: string; // shiftos reservation id
  company_id: string;
  customer_id: string; // FK to shiftos_customers
  shiftos_user_id: number;
  calendar_name: string;
  sim_count: number; // number of simulators booked
  revenue: number;
  revenue_source: 'charges_api' | 'price_map' | 'unknown';
  coupon_code: string | null;
  discount_amount: number;
  paid: boolean;
  booking_time: string; // when the session is scheduled for
  created_at: string; // when the reservation was made
}

export interface ShiftOSPriceMapEntry {
  id: string;
  calendar_name_pattern: string; // pattern to match, e.g. "2-Hr GT3"
  price: number;
  created_at: string;
}

export interface ShiftOSDailyRevenue {
  date: string;
  total_revenue: number;
  booking_count: number;
  new_customers: number;
  returning_customers: number;
  avg_ticket: number;
  top_sim: string;
}
