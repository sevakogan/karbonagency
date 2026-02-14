import type { MetricInfo } from "@/types";

/**
 * Human-readable definitions for every metric shown on the client dashboard.
 * Each tooltip explains what the metric is, why it matters, and the formula (if applicable).
 */
export const METRIC_DEFINITIONS: Record<string, MetricInfo> = {
  // ── Spend & Budget ──────────────────────────────────
  total_spend: {
    label: "Total Spend",
    description:
      "The total amount of money spent on your advertising campaigns during the selected period. This is the actual dollar amount charged by the ad platform.",
  },
  daily_spend: {
    label: "Daily Spend",
    description:
      "Average amount spent per day on your ads. Helps you understand your daily burn rate and forecast monthly costs.",
    formula: "Total Spend ÷ Number of Days",
  },
  budget_remaining: {
    label: "Budget Remaining",
    description:
      "How much of your allocated monthly ad budget is still available. When this reaches zero, ads may stop running unless the budget is increased.",
    formula: "Monthly Budget − Total Spend",
  },

  // ── Reach & Awareness ──────────────────────────────
  impressions: {
    label: "Impressions",
    description:
      "The total number of times your ad was displayed on someone's screen. One person can see your ad multiple times, and each view counts as one impression.",
  },
  reach: {
    label: "Reach",
    description:
      "The number of unique people who saw your ad at least once. Unlike impressions, reach counts each person only once regardless of how many times they saw the ad.",
  },
  frequency: {
    label: "Frequency",
    description:
      "The average number of times each person saw your ad. A frequency of 3 means the average viewer saw your ad 3 times. Too high can cause ad fatigue.",
    formula: "Impressions ÷ Reach",
  },
  cpm: {
    label: "CPM",
    description:
      "Cost Per Mille — the cost to show your ad 1,000 times. This measures how efficiently your budget generates visibility. Lower CPM means cheaper reach.",
    formula: "(Total Spend ÷ Impressions) × 1,000",
  },

  // ── Engagement & Clicks ────────────────────────────
  clicks: {
    label: "Clicks",
    description:
      "The total number of times people clicked on your ad. This includes clicks on the ad image, headline, call-to-action button, or links in the ad.",
  },
  link_clicks: {
    label: "Link Clicks",
    description:
      "Clicks that specifically led to destinations on or off the ad platform — like your website, booking page, or contact form. More valuable than total clicks.",
  },
  ctr: {
    label: "CTR",
    description:
      "Click-Through Rate — the percentage of people who clicked your ad after seeing it. A higher CTR means your ad is compelling and relevant to the audience. Industry average is 0.9%.",
    formula: "(Clicks ÷ Impressions) × 100",
  },
  cpc: {
    label: "CPC",
    description:
      "Cost Per Click — how much you pay each time someone clicks on your ad. Lower CPC means you're getting more clicks for less money.",
    formula: "Total Spend ÷ Clicks",
  },

  // ── Conversions & Results ──────────────────────────
  conversions: {
    label: "Conversions",
    description:
      "The number of times someone completed a valuable action after clicking your ad — like booking a session, signing up, or making a purchase. This is the ultimate measure of ad success.",
  },
  cost_per_conversion: {
    label: "Cost per Conversion",
    description:
      "How much you pay for each conversion (booking, sign-up, purchase). This is the most important metric for measuring ROI — lower means better value.",
    formula: "Total Spend ÷ Conversions",
  },
  conversion_rate: {
    label: "Conversion Rate",
    description:
      "The percentage of clicks that result in a conversion. If 100 people click and 5 book, your conversion rate is 5%.",
    formula: "(Conversions ÷ Clicks) × 100",
  },
  roas: {
    label: "ROAS",
    description:
      "Return On Ad Spend — how much revenue you earn for every dollar spent on ads. A ROAS of 4.0 means you make $4 for every $1 spent. Above 3.0 is generally considered good.",
    formula: "Revenue ÷ Ad Spend",
  },

  // ── Lead Generation ────────────────────────────────
  leads: {
    label: "Leads",
    description:
      "The number of potential customers who shared their contact information through your ads — like filling out a form with their name, email, or phone number.",
  },
  cost_per_lead: {
    label: "Cost per Lead",
    description:
      "How much you pay to acquire each lead. A lower cost per lead means your ads are efficiently generating interest in your business.",
    formula: "Total Spend ÷ Leads",
  },

  // ── Video ──────────────────────────────────────────
  video_views: {
    label: "Video Views",
    description:
      "The number of times your video ad was watched for at least 3 seconds (or the full duration if shorter). Video ads tend to have higher engagement than static images.",
  },

  // ── Bookings (custom for sim racing) ───────────────
  bookings: {
    label: "Bookings",
    description:
      "The number of session bookings generated from your advertising campaigns. This is tracked via the booking system on your website.",
  },
  cost_per_booking: {
    label: "Cost per Booking",
    description:
      "How much ad spend it takes to generate one booking. This is the single most important metric for measuring your advertising ROI.",
    formula: "Total Spend ÷ Bookings",
  },
} as const;
