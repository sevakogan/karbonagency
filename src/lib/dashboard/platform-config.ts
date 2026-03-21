/** Normalize platform slugs (e.g. 'meta' -> 'meta_ads') */
export function normSlug(slug: string): string {
  if (slug === 'meta') return 'meta_ads';
  return slug;
}

export const PLATFORM_NAMES: Record<string, string> = {
  meta: 'Meta Ads',
  meta_ads: 'Meta Ads',
  instagram: 'Instagram',
  google_analytics: 'Google Analytics',
  google_ads: 'Google Ads',
  google_business: 'Google Business',
  google_search_console: 'Search Console',
  tiktok_ads: 'TikTok',
  x_ads: 'X (Twitter)',
  pinterest_ads: 'Pinterest',
  linkedin_ads: 'LinkedIn',
  yelp: 'Yelp',
  bing_ads: 'Bing Ads',
  snapchat_ads: 'Snapchat',
  shiftos: 'ShiftOS',
};

export const PLATFORM_COLORS: Record<string, string> = {
  meta: '#7B61FF',
  meta_ads: '#7B61FF',
  instagram: '#E1306C',
  google_analytics: '#34A853',
  google_ads: '#4285F4',
  google_business: '#FBBC05',
  google_search_console: '#4285F4',
  tiktok_ads: '#00F2EA',
  x_ads: '#1DA1F2',
  pinterest_ads: '#E60023',
  linkedin_ads: '#0077B5',
  yelp: '#FF1A1A',
  bing_ads: '#008373',
  snapchat_ads: '#FFFC00',
  shiftos: '#00D26A',
  square: '#C0C0D0',
};

export const SCORE_COLORS = [
  '',         // 0 — unused
  '#FF3B30',  // 1 — red
  '#FF9500',  // 2 — orange
  '#FFCC00',  // 3 — yellow
  '#34C759',  // 4 — light green
  '#00C7BE',  // 5 — teal
];

export const PLATFORM_ICONS: Record<string, string> = {
  meta_ads: '🔴',
  instagram: '📸',
  google_analytics: '🟢',
  google_ads: '🔵',
  google_business: '🟠',
  tiktok_ads: '🩵',
  shiftos: '🟣',
};
