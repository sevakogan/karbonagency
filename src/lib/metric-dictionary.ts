export type MetricFormat = 'currency' | 'number' | 'percentage' | 'multiplier' | 'duration' | 'rating' | 'status' | 'breakdown' | 'text' | 'fraction' | 'relative_time';
export type MetricDirection = 'higher-is-better' | 'lower-is-better' | 'range-is-best' | 'neutral';

export interface MetricExplanation {
  label: string;
  emoji: string;
  plain: string;
  whyItMatters: string;
  goodOrBad: MetricDirection;
  goodMeans: string;
  format: MetricFormat;
}

export const metricDictionary: Record<string, MetricExplanation> = {
  spend: {
    label: "Ad Spend",
    emoji: "\u{1F4B0}",
    plain: "This is how much money you paid to run your ads. Think of it like paying rent for a billboard \u2014 except this billboard is on people\u2019s phones.",
    whyItMatters: "This is your cost. You want to spend as little as possible while still getting customers. If this number goes up but your sales don\u2019t, something needs to change.",
    goodOrBad: "neutral",
    goodMeans: "Lower is better IF your results stay the same or improve. But spending $0 means nobody sees your ads.",
    format: "currency"
  },
  impressions: {
    label: "Impressions",
    emoji: "\u{1F440}",
    plain: "This is how many times your ad showed up on someone\u2019s screen. It doesn\u2019t mean they looked at it \u2014 just that it appeared.",
    whyItMatters: "More impressions means more people had a chance to see your business. But impressions alone don\u2019t mean anything \u2014 what matters is if people actually clicked.",
    goodOrBad: "higher-is-better",
    goodMeans: "More impressions = more eyeballs. But if impressions are high and clicks are low, your ad might not be interesting enough.",
    format: "number"
  },
  clicks: {
    label: "Clicks",
    emoji: "\u{1F446}",
    plain: "This is how many people tapped or clicked on your ad to learn more. They saw your ad, liked what they saw, and said \u2018tell me more.\u2019",
    whyItMatters: "Clicks mean real interest. These are people who stopped scrolling and chose YOUR ad.",
    goodOrBad: "higher-is-better",
    goodMeans: "More clicks = more interested people. If clicks are low compared to impressions, your ad creative or targeting might need work.",
    format: "number"
  },
  ctr: {
    label: "Click-Through Rate (CTR)",
    emoji: "\u{1F3AF}",
    plain: "Out of everyone who saw your ad, this is the percentage who actually clicked on it.",
    whyItMatters: "This tells you how interesting your ad is. A high CTR means your ad is doing a great job grabbing attention.",
    goodOrBad: "higher-is-better",
    goodMeans: "Above 1% is okay. Above 2% is good. Above 3% is excellent. Below 0.5% means your ad probably needs a new image or message.",
    format: "percentage"
  },
  cpc: {
    label: "Cost Per Click (CPC)",
    emoji: "\u{1F3F7}\uFE0F",
    plain: "This is how much you paid for each person who clicked your ad.",
    whyItMatters: "Lower CPC means you\u2019re getting interested people for less money.",
    goodOrBad: "lower-is-better",
    goodMeans: "Under $1 is great for most businesses. $1-3 is normal. Over $5 means your targeting might be too narrow.",
    format: "currency"
  },
  cpm: {
    label: "Cost Per 1,000 Impressions (CPM)",
    emoji: "\u{1F4CA}",
    plain: "This is how much you paid for every 1,000 times your ad was shown.",
    whyItMatters: "This tells you how expensive it is to reach people in your target audience.",
    goodOrBad: "lower-is-better",
    goodMeans: "Under $10 is great. $10-25 is normal. Over $40 means you\u2019re in a competitive space.",
    format: "currency"
  },
  conversions: {
    label: "Conversions",
    emoji: "\u{1F389}",
    plain: "This is the number of people who did the thing you wanted them to do \u2014 bought something, filled out a form, called you, signed up.",
    whyItMatters: "This is the whole point of running ads. Everything else is just steps along the way. Conversions are the finish line.",
    goodOrBad: "higher-is-better",
    goodMeans: "More conversions = more customers = more revenue. If conversions are low but clicks are high, your landing page might be the problem.",
    format: "number"
  },
  roas: {
    label: "Return on Ad Spend (ROAS)",
    emoji: "\u{1F4C8}",
    plain: "For every $1 you spent on ads, this is how many dollars you made back.",
    whyItMatters: "This is the single most important number for any ad campaign. If ROAS is below 1, you\u2019re losing money.",
    goodOrBad: "higher-is-better",
    goodMeans: "Below 1 = losing money. 1-2 = breaking even. 2-4 = profitable. Above 4 = excellent.",
    format: "multiplier"
  },
  cost_per_conversion: {
    label: "Cost Per Conversion",
    emoji: "\u{1F4B5}",
    plain: "This is how much money you spent to get ONE customer to do what you wanted.",
    whyItMatters: "This tells you the real price of getting a new customer. Compare it to how much that customer is worth to you.",
    goodOrBad: "lower-is-better",
    goodMeans: "Depends on your business. For a $10 product, $50 per conversion is terrible. For a $5,000 service, $50 is amazing.",
    format: "currency"
  },
  frequency: {
    label: "Frequency",
    emoji: "\u{1F501}",
    plain: "On average, how many times the same person saw your ad.",
    whyItMatters: "Too low and people might not remember you. Too high and people get annoyed and start ignoring your ad.",
    goodOrBad: "range-is-best",
    goodMeans: "1.5-3 is the sweet spot. Below 1.5 = not enough repetition. Above 5 = showing the same people too many times.",
    format: "number"
  },
  reach: {
    label: "Reach",
    emoji: "\u{1F4E2}",
    plain: "This is how many different, unique people saw your ad at least once. Unlike impressions, reach counts actual humans.",
    whyItMatters: "Reach tells you how wide your net is. High reach means you\u2019re getting in front of lots of different people.",
    goodOrBad: "higher-is-better",
    goodMeans: "More reach = more potential customers who know you exist.",
    format: "number"
  },
  sessions: {
    label: "Sessions",
    emoji: "\u{1F6AA}",
    plain: "A session is one visit to your website. When someone opens your site, looks around, and leaves \u2014 that\u2019s one session.",
    whyItMatters: "More sessions means more people are visiting your website.",
    goodOrBad: "higher-is-better",
    goodMeans: "More sessions = more traffic = more opportunities to convert visitors into customers.",
    format: "number"
  },
  users: {
    label: "Users",
    emoji: "\u{1F464}",
    plain: "This is how many different people visited your website. One person could visit 5 times but they\u2019re still 1 user.",
    whyItMatters: "This tells you how many real humans are interested in your business.",
    goodOrBad: "higher-is-better",
    goodMeans: "Growing users over time means your audience is growing.",
    format: "number"
  },
  new_users: {
    label: "New Users",
    emoji: "\u{1F195}",
    plain: "People visiting your website for the very first time.",
    whyItMatters: "New users = fresh potential customers discovering you.",
    goodOrBad: "higher-is-better",
    goodMeans: "A healthy site has a mix of new users (growth) and returning users (loyalty).",
    format: "number"
  },
  pageviews: {
    label: "Pageviews",
    emoji: "\u{1F4C4}",
    plain: "Every time someone loads a page on your website, that\u2019s one pageview.",
    whyItMatters: "More pageviews usually means people are exploring your site and finding it interesting.",
    goodOrBad: "higher-is-better",
    goodMeans: "Compare pageviews to sessions to get pages-per-session. 2-4 pages per session is healthy.",
    format: "number"
  },
  bounce_rate: {
    label: "Bounce Rate",
    emoji: "\u{1F3C0}",
    plain: "The percentage of people who landed on your website and left without doing anything.",
    whyItMatters: "A high bounce rate means people aren\u2019t finding what they expected.",
    goodOrBad: "lower-is-better",
    goodMeans: "Under 40% is excellent. 40-60% is average. Above 70% is a problem.",
    format: "percentage"
  },
  avg_session_duration: {
    label: "Avg. Session Duration",
    emoji: "\u23F1\uFE0F",
    plain: "On average, how long people spend on your website during one visit.",
    whyItMatters: "Longer sessions usually mean people are engaged with your content.",
    goodOrBad: "higher-is-better",
    goodMeans: "1-2 minutes is okay. 2-4 minutes is good. Above 4 minutes is excellent.",
    format: "duration"
  },
  pages_per_session: {
    label: "Pages Per Session",
    emoji: "\u{1F4D6}",
    plain: "On average, how many different pages someone looks at during one visit.",
    whyItMatters: "More pages per session means people are interested enough to keep clicking.",
    goodOrBad: "higher-is-better",
    goodMeans: "1 page = they bounced. 2-3 pages = normal. 4+ pages = highly engaged.",
    format: "number"
  },
  traffic_organic: {
    label: "Organic Search",
    emoji: "\u{1F331}",
    plain: "People who found your website by searching on Google and clicking a regular result \u2014 NOT an ad.",
    whyItMatters: "Organic traffic is free and high-quality \u2014 these people were actively searching for something related to your business.",
    goodOrBad: "higher-is-better",
    goodMeans: "More organic = more free customers. If growing, your SEO is working.",
    format: "number"
  },
  traffic_direct: {
    label: "Direct Traffic",
    emoji: "\u{1F517}",
    plain: "People who typed your website URL directly or had it bookmarked.",
    whyItMatters: "High direct traffic means strong brand awareness.",
    goodOrBad: "higher-is-better",
    goodMeans: "Growing direct traffic = growing brand awareness.",
    format: "number"
  },
  traffic_social: {
    label: "Social Media Traffic",
    emoji: "\u{1F4F1}",
    plain: "People who came to your website from a social media platform.",
    whyItMatters: "This tells you how well your social media is driving people to take action.",
    goodOrBad: "higher-is-better",
    goodMeans: "If growing, your social media content is compelling enough to drive site visits.",
    format: "number"
  },
  traffic_referral: {
    label: "Referral Traffic",
    emoji: "\u{1F91D}",
    plain: "People who came to your website by clicking a link on another website.",
    whyItMatters: "Referral traffic means other websites are sending you visitors \u2014 essentially free advertising.",
    goodOrBad: "higher-is-better",
    goodMeans: "Growing referral traffic means more external sites are linking to you.",
    format: "number"
  },
  traffic_paid: {
    label: "Paid Traffic",
    emoji: "\u{1F4B3}",
    plain: "People who came to your website by clicking on an ad you paid for.",
    whyItMatters: "This connects directly to your ad campaigns.",
    goodOrBad: "higher-is-better",
    goodMeans: "More paid traffic per dollar spent = more efficient campaigns.",
    format: "number"
  },
  traffic_email: {
    label: "Email Traffic",
    emoji: "\u{1F4E7}",
    plain: "People who came to your website by clicking a link in an email you sent.",
    whyItMatters: "Email traffic shows how engaged your email subscribers are.",
    goodOrBad: "higher-is-better",
    goodMeans: "Higher email traffic means your emails are compelling enough to drive action.",
    format: "number"
  },
  gbp_reviews: {
    label: "Reviews",
    emoji: "\u2B50",
    plain: "How many reviews your business has on Google.",
    whyItMatters: "More reviews (especially positive ones) = more trust from potential customers.",
    goodOrBad: "higher-is-better",
    goodMeans: "Under 10 looks unestablished. 10-50 is okay. 50+ is solid. 100+ is excellent.",
    format: "number"
  },
  gbp_rating: {
    label: "Average Rating",
    emoji: "\u{1F31F}",
    plain: "Your average star rating on Google out of 5.0.",
    whyItMatters: "Most people won\u2019t even consider a business below 4.0.",
    goodOrBad: "higher-is-better",
    goodMeans: "Below 3.5 is a serious problem. 3.5-4.0 needs improvement. 4.0-4.5 is good. Above 4.5 is excellent.",
    format: "rating"
  },
  gbp_views: {
    label: "Profile Views",
    emoji: "\u{1F50D}",
    plain: "How many people viewed your Google Business Profile.",
    whyItMatters: "More views = more people considering your business.",
    goodOrBad: "higher-is-better",
    goodMeans: "Growing views means you\u2019re becoming more visible on Google.",
    format: "number"
  },
  gbp_calls: {
    label: "Phone Calls",
    emoji: "\u{1F4DE}",
    plain: "How many people tapped the \u2018Call\u2019 button on your Google Business Profile.",
    whyItMatters: "Phone calls are one of the highest-intent actions.",
    goodOrBad: "higher-is-better",
    goodMeans: "Every call is a potential customer.",
    format: "number"
  },
  gsc_clicks: {
    label: "Search Clicks",
    emoji: "\u{1F50E}",
    plain: "How many times someone searched on Google, saw your website, and clicked on it.",
    whyItMatters: "More search clicks = more free, high-quality traffic.",
    goodOrBad: "higher-is-better",
    goodMeans: "Growing clicks means your site is appearing more in Google.",
    format: "number"
  },
  gsc_impressions: {
    label: "Search Impressions",
    emoji: "\u{1F4CB}",
    plain: "How many times your website appeared in Google search results.",
    whyItMatters: "High impressions but low clicks means your title and description in Google might need to be more compelling.",
    goodOrBad: "higher-is-better",
    goodMeans: "More impressions = more search visibility.",
    format: "number"
  },
  gsc_position: {
    label: "Average Position",
    emoji: "\u{1F3C6}",
    plain: "On average, where your website shows up in Google search results. Position 1 = first result.",
    whyItMatters: "Position 1-3 gets about 60% of all clicks. Position 4-10 gets about 30%. Page 2+ gets almost nothing.",
    goodOrBad: "lower-is-better",
    goodMeans: "1-3 is excellent. 4-10 is good. 11-20 is okay. 20+ needs SEO work.",
    format: "number"
  },
  yelp_reviews: {
    label: "Yelp Reviews",
    emoji: "\u{1F4DD}",
    plain: "How many reviews your business has on Yelp.",
    whyItMatters: "Many people check Yelp specifically before trying a new business.",
    goodOrBad: "higher-is-better",
    goodMeans: "More is better. Yelp also has a filter that hides reviews it considers unreliable.",
    format: "number"
  },
  yelp_rating: {
    label: "Yelp Rating",
    emoji: "\u2B50",
    plain: "Your average star rating on Yelp, out of 5. Yelp tends to be a tougher crowd than Google.",
    whyItMatters: "Yelp ratings heavily influence purchasing decisions for local businesses.",
    goodOrBad: "higher-is-better",
    goodMeans: "Below 3.0 is damaging. 3.0-3.5 is below average. 3.5-4.0 is decent. Above 4.0 is strong.",
    format: "rating"
  },
  total_spend_all: {
    label: "Total Ad Spend (All Companies)",
    emoji: "\u{1F3E6}",
    plain: "The total amount of money you spent on ads across ALL your companies combined.",
    whyItMatters: "This is your complete marketing investment. Compare it to total revenue to see if your overall strategy is profitable.",
    goodOrBad: "neutral",
    goodMeans: "Context matters \u2014 spending more isn\u2019t bad if it\u2019s driving proportionally more revenue.",
    format: "currency"
  },
  connected_platforms: {
    label: "Connected Platforms",
    emoji: "\u{1F50C}",
    plain: "How many ad or analytics platforms are connected and sending data for this company.",
    whyItMatters: "More connections = more complete picture of your marketing.",
    goodOrBad: "neutral",
    goodMeans: "Connect every platform you actively use. You don\u2019t need all 12 \u2014 just the ones you use.",
    format: "fraction"
  },
  sync_status: {
    label: "Sync Status",
    emoji: "\u{1F504}",
    plain: "Whether the app was able to pull the latest data from this platform.",
    whyItMatters: "If sync is broken, you\u2019re looking at stale data.",
    goodOrBad: "neutral",
    goodMeans: "Green = all good. Yellow = partial data. Red = fix credentials immediately.",
    format: "status"
  },
  last_synced: {
    label: "Last Synced",
    emoji: "\u{1F550}",
    plain: "How long ago the app last pulled fresh data from this platform.",
    whyItMatters: "Stale data leads to bad decisions.",
    goodOrBad: "neutral",
    goodMeans: "Under 24 hours is normal (daily sync). If older, check the sync log.",
    format: "relative_time"
  }
};

export function getMetricExplanation(key: string): MetricExplanation | undefined {
  return metricDictionary[key];
}
