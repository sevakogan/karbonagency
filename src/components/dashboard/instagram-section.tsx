'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { Brain, TrendingUp, TrendingDown, Heart, MessageCircle, Bookmark, Share2, Eye, Users, UserPlus, UserMinus, Link2, ExternalLink } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types matching instagram-api.ts outputs
// ---------------------------------------------------------------------------

interface IgAccountInfo {
  ig_user_id: string;
  username: string;
  name: string;
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
  website: string;
}

interface IgAccountInsights {
  reach: number;
  views: number;
  accounts_engaged: number;
  follows: number;
  unfollows: number;
  profile_links_taps: number;
  total_interactions: number;
  period: string;
}

interface IgMediaInsight {
  media_id: string;
  caption: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  reach: number;
  views: number;
  saves: number;
  shares: number;
  total_interactions: number;
}

interface IgDemographics {
  cities: Record<string, number>;
  countries: Record<string, number>;
  age_gender: Record<string, number>;
}

interface IgOverviewData {
  account: IgAccountInfo;
  insights: IgAccountInsights;
  top_media: IgMediaInsight[];
  demographics: IgDemographics | null;
}

interface Props {
  companyId: string;
  accessToken: string; // Supabase session token for API auth
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function engagementRate(interactions: number, followers: number): number {
  return followers > 0 ? (interactions / followers) * 100 : 0;
}

function scoreEngagement(rate: number): { score: number; label: string; detail: string; color: string } {
  if (rate >= 6) return { score: 5, label: 'Viral', detail: 'Engagement rate is exceptional. Your content is resonating deeply with audiences.', color: '#00C7BE' };
  if (rate >= 3) return { score: 4, label: 'Strong', detail: 'Above-average engagement. Your audience is actively interacting.', color: '#34C759' };
  if (rate >= 1.5) return { score: 3, label: 'Average', detail: 'Typical engagement for business accounts. Room to improve content strategy.', color: '#FFCC00' };
  if (rate >= 0.5) return { score: 2, label: 'Low', detail: 'Below average. Test different content types, posting times, and CTAs.', color: '#FF9500' };
  return { score: 1, label: 'Poor', detail: 'Very low engagement. Major content strategy overhaul needed.', color: '#FF3B30' };
}

function scoreFollowerGrowth(follows: number, unfollows: number): { score: number; label: string; detail: string; color: string } {
  const net = follows - unfollows;
  const ratio = unfollows > 0 ? follows / unfollows : follows > 0 ? 5 : 0;
  if (ratio >= 3 && net > 0) return { score: 5, label: 'Growing Fast', detail: `+${net} net followers. Strong organic growth with low churn.`, color: '#00C7BE' };
  if (ratio >= 2 && net > 0) return { score: 4, label: 'Healthy Growth', detail: `+${net} net followers. Good acquisition vs churn ratio.`, color: '#34C759' };
  if (net > 0) return { score: 3, label: 'Slow Growth', detail: `+${net} net followers. Growing but churn is eating into gains.`, color: '#FFCC00' };
  if (net === 0) return { score: 2, label: 'Flat', detail: 'No net change in followers. Need fresh content or campaigns to grow.', color: '#FF9500' };
  return { score: 1, label: 'Declining', detail: `${net} net followers. Losing more than gaining — review content quality.`, color: '#FF3B30' };
}

function scoreContentMix(media: IgMediaInsight[]): { score: number; label: string; detail: string; color: string } {
  if (media.length === 0) return { score: 0, label: 'No Data', detail: '', color: '#888' };
  const types = new Set(media.map(m => m.media_type));
  const hasVariety = types.size >= 2;
  const avgSaves = media.reduce((s, m) => s + m.saves, 0) / media.length;
  const avgShares = media.reduce((s, m) => s + m.shares, 0) / media.length;
  if (hasVariety && avgSaves > 5 && avgShares > 3) return { score: 5, label: 'Excellent', detail: 'Great content mix with high save and share rates. Content is bookmark-worthy.', color: '#00C7BE' };
  if (hasVariety && (avgSaves > 2 || avgShares > 1)) return { score: 4, label: 'Good', detail: 'Varied content types with decent save/share rates.', color: '#34C759' };
  if (hasVariety) return { score: 3, label: 'Average', detail: 'Using multiple content types. Focus on creating more saveable/shareable content.', color: '#FFCC00' };
  return { score: 2, label: 'Limited', detail: 'Only using one content type. Add Reels, Carousels, or Stories for better reach.', color: '#FF9500' };
}

// ---------------------------------------------------------------------------
// Widget wrapper (matches main dashboard glass style)
// ---------------------------------------------------------------------------

const W = ({ children, span = 1 }: { children: React.ReactNode; span?: number }) => (
  <div style={{
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
    borderRadius: 16, padding: '14px 16px',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-card)',
    gridColumn: span > 1 ? `span ${span}` : undefined,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, var(--gloss-highlight-strong), transparent)', pointerEvents: 'none' }} />
    {children}
  </div>
);

const Label = ({ children }: { children: string }) => (
  <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0', fontWeight: 600 }}>{children}</p>
);

const BigNum = ({ children }: { children: string }) => (
  <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0', fontVariantNumeric: 'tabular-nums' }}>{children}</p>
);

const ScoreBadge = ({ score, label, detail, color }: { score: number; label: string; detail: string; color: string }) => {
  if (score === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 8px', borderRadius: 8, background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 20%, transparent)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Brain size={10} style={{ color }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color }}>{score}/5</span>
      </div>
      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{detail}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function InstagramSection({ companyId, accessToken }: Props) {
  const [data, setData] = useState<IgOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const since = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const until = now.toISOString().split('T')[0];

    fetch(`/api/instagram?type=overview&clientId=${companyId}&since=${since}&until=${until}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json.data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [companyId, accessToken]);

  if (loading) {
    return (
      <div style={{ gridColumn: 'span 4', padding: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, border: '2px solid #E1306C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading Instagram data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ gridColumn: 'span 4' }}>
        <W span={4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ fontSize: 16 }}>📸</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Instagram not connected. <span style={{ color: '#E1306C' }}>Connect via Platforms page</span> to see follower count, engagement, top posts, demographics & more.
            </span>
          </div>
        </W>
      </div>
    );
  }

  const { account, insights, top_media, demographics } = data;

  // Computed metrics
  const engRate = engagementRate(insights.total_interactions, account.followers_count);
  const engScore = scoreEngagement(engRate);
  const growthScore = scoreFollowerGrowth(insights.follows, insights.unfollows);
  const contentScore = scoreContentMix(top_media);

  // Media engagement breakdown for chart
  const mediaChartData = top_media.slice(0, 10).map((m, i) => ({
    name: `Post ${i + 1}`,
    likes: m.like_count,
    comments: m.comments_count,
    saves: m.saves,
    shares: m.shares,
    reach: m.reach,
    views: m.views,
    type: m.media_type,
  }));

  // Content type breakdown
  const typeBreakdown = top_media.reduce<Record<string, { count: number; totalReach: number; totalEngagement: number }>>((acc, m) => {
    const type = m.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : m.media_type === 'VIDEO' ? 'Reel/Video' : 'Image';
    const entry = acc[type] ?? { count: 0, totalReach: 0, totalEngagement: 0 };
    entry.count += 1;
    entry.totalReach += m.reach;
    entry.totalEngagement += m.total_interactions;
    acc[type] = entry;
    return acc;
  }, {});

  const typeChartData = Object.entries(typeBreakdown).map(([type, d]) => ({
    name: type,
    count: d.count,
    avgReach: Math.round(d.totalReach / d.count),
    avgEngagement: Math.round(d.totalEngagement / d.count),
    color: type === 'Reel/Video' ? '#E1306C' : type === 'Carousel' ? '#833AB4' : '#F77737',
  }));

  // Demographics charts
  const topCities = demographics?.cities
    ? Object.entries(demographics.cities).sort(([, a], [, b]) => b - a).slice(0, 6).map(([city, count]) => ({ name: city.split(',')[0], value: count }))
    : [];

  const topCountries = demographics?.countries
    ? Object.entries(demographics.countries).sort(([, a], [, b]) => b - a).slice(0, 5).map(([country, count]) => ({ name: country, value: count }))
    : [];

  // Radar chart data for content performance
  const avgMetrics = top_media.length > 0 ? {
    likes: top_media.reduce((s, m) => s + m.like_count, 0) / top_media.length,
    comments: top_media.reduce((s, m) => s + m.comments_count, 0) / top_media.length,
    saves: top_media.reduce((s, m) => s + m.saves, 0) / top_media.length,
    shares: top_media.reduce((s, m) => s + m.shares, 0) / top_media.length,
    reach: top_media.reduce((s, m) => s + m.reach, 0) / top_media.length,
  } : { likes: 0, comments: 0, saves: 0, shares: 0, reach: 0 };

  // Normalize for radar (0-100 scale)
  const maxVal = Math.max(avgMetrics.likes, avgMetrics.comments * 5, avgMetrics.saves * 3, avgMetrics.shares * 4, avgMetrics.reach / 10, 1);
  const radarData = [
    { metric: 'Likes', value: (avgMetrics.likes / maxVal) * 100 },
    { metric: 'Comments', value: ((avgMetrics.comments * 5) / maxVal) * 100 },
    { metric: 'Saves', value: ((avgMetrics.saves * 3) / maxVal) * 100 },
    { metric: 'Shares', value: ((avgMetrics.shares * 4) / maxVal) * 100 },
    { metric: 'Reach', value: ((avgMetrics.reach / 10) / maxVal) * 100 },
  ];

  const IG_PINK = '#E1306C';
  const IG_PURPLE = '#833AB4';
  const IG_ORANGE = '#F77737';

  return (
    <>
      {/* Section Header */}
      <div style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0 0 0' }}>
        <span style={{ fontSize: 14 }}>📸</span>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Instagram</h3>
        <a href={`https://instagram.com/${account.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: IG_PINK, textDecoration: 'none', fontWeight: 600 }}>
          @{account.username} <ExternalLink size={9} style={{ display: 'inline' }} />
        </a>
      </div>

      {/* Row 1: Account KPIs */}
      <W>
        <Label>Followers</Label>
        <BigNum>{fmt(account.followers_count)}</BigNum>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: '10px', color: 'var(--system-green)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <UserPlus size={10} /> +{insights.follows}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--system-red)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <UserMinus size={10} /> -{insights.unfollows}
          </span>
        </div>
        <ScoreBadge {...growthScore} />
      </W>

      <W>
        <Label>Engagement Rate</Label>
        <BigNum>{engRate.toFixed(2)}%</BigNum>
        <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>{insights.total_interactions.toLocaleString()} interactions / {fmt(account.followers_count)} followers</p>
        <ScoreBadge {...engScore} />
      </W>

      <W>
        <Label>Reach</Label>
        <BigNum>{fmt(insights.reach)}</BigNum>
        <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>
          {account.followers_count > 0 ? ((insights.reach / account.followers_count) * 100).toFixed(1) : 0}% of followers reached
        </p>
      </W>

      <W>
        <Label>Profile Actions</Label>
        <BigNum>{fmt(insights.profile_links_taps)}</BigNum>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <span style={{ fontSize: '9px', color: 'var(--text-quaternary)' }}>
            <Eye size={9} style={{ display: 'inline', marginRight: 2 }} />{fmt(insights.views)} views
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-quaternary)' }}>
            <Users size={9} style={{ display: 'inline', marginRight: 2 }} />{fmt(insights.accounts_engaged)} engaged
          </span>
        </div>
      </W>

      {/* Row 2: Following + Posts + Media count */}
      <W>
        <Label>Following</Label>
        <BigNum>{fmt(account.follows_count)}</BigNum>
        <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>
          Ratio: {account.follows_count > 0 ? (account.followers_count / account.follows_count).toFixed(1) : '∞'}:1
        </p>
      </W>

      <W>
        <Label>Total Posts</Label>
        <BigNum>{fmt(account.media_count)}</BigNum>
        <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>lifetime content</p>
      </W>

      <W>
        <Label>Net Growth</Label>
        <BigNum style={{ color: (insights.follows - insights.unfollows) >= 0 ? 'var(--system-green)' : 'var(--system-red)' } as never}>
          {(insights.follows - insights.unfollows) >= 0 ? '+' : ''}{insights.follows - insights.unfollows}
        </BigNum>
        <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>{insights.period}</p>
      </W>

      <W>
        <Label>Avg Engagement / Post</Label>
        <BigNum>{top_media.length > 0 ? fmt(top_media.reduce((s, m) => s + m.total_interactions, 0) / top_media.length) : '—'}</BigNum>
        <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>across last {top_media.length} posts</p>
      </W>

      {/* Row 3: Engagement Radar + Post Performance Bar Chart */}
      <W span={2}>
        <Label>Engagement Breakdown</Label>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--separator)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
            <Radar dataKey="value" stroke={IG_PINK} fill={IG_PINK} fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={9} color={IG_PINK} /> {fmt(avgMetrics.likes)} avg</span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={9} color={IG_PURPLE} /> {fmt(avgMetrics.comments)} avg</span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Bookmark size={9} color={IG_ORANGE} /> {fmt(avgMetrics.saves)} avg</span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Share2 size={9} color="#30D158" /> {fmt(avgMetrics.shares)} avg</span>
        </div>
        <ScoreBadge {...contentScore} />
      </W>

      <W span={2}>
        <Label>Post Performance (Recent {mediaChartData.length})</Label>
        {mediaChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mediaChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number, name: string) => [fmt(v), name]}
              />
              <Bar dataKey="likes" name="Likes" fill={IG_PINK} radius={[4, 4, 0, 0]} stackId="eng" />
              <Bar dataKey="comments" name="Comments" fill={IG_PURPLE} radius={[0, 0, 0, 0]} stackId="eng" />
              <Bar dataKey="saves" name="Saves" fill={IG_ORANGE} radius={[0, 0, 0, 0]} stackId="eng" />
              <Bar dataKey="shares" name="Shares" fill="#30D158" radius={[4, 4, 0, 0]} stackId="eng" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '60px 0' }}>No posts</p>
        )}
      </W>

      {/* Row 4: Content type breakdown + Reach per post */}
      <W span={2}>
        <Label>Content Type Performance</Label>
        {typeChartData.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={typeChartData} dataKey="count" cx="50%" cy="50%" innerRadius={25} outerRadius={42} paddingAngle={3}>
                  {typeChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {typeChartData.map((t) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--separator)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>{t.name}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-quaternary)' }}>({t.count})</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(t.avgReach)} reach</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-quaternary)', marginLeft: 8 }}>{fmt(t.avgEngagement)} eng</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '30px 0' }}>No data</p>
        )}
      </W>

      <W span={2}>
        <Label>Reach Per Post</Label>
        {mediaChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={mediaChartData}>
              <defs>
                <linearGradient id="igReachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={IG_PINK} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={IG_PINK} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={35} tickFormatter={fmt} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [fmt(v), 'Reach']} />
              <Area type="natural" dataKey="reach" stroke={IG_PINK} strokeWidth={2} fill="url(#igReachGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '30px 0' }}>No data</p>
        )}
      </W>

      {/* Row 5: Top Posts Table */}
      <W span={4}>
        <Label>Top Posts</Label>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                {['Post', 'Type', 'Likes', 'Comments', 'Saves', 'Shares', 'Reach', 'Views', 'Engagement'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--separator)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top_media.slice(0, 10).map((m, i) => (
                <tr
                  key={m.media_id}
                  style={{ borderBottom: '1px solid var(--separator)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fill-quaternary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '6px 8px', maxWidth: 200 }}>
                    <a href={m.permalink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '11px' }}>
                      {m.caption ? (m.caption.length > 50 ? m.caption.slice(0, 50) + '...' : m.caption) : `Post ${i + 1}`}
                    </a>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: m.media_type === 'VIDEO' ? `color-mix(in srgb, ${IG_PINK} 15%, transparent)` : m.media_type === 'CAROUSEL_ALBUM' ? `color-mix(in srgb, ${IG_PURPLE} 15%, transparent)` : `color-mix(in srgb, ${IG_ORANGE} 15%, transparent)`,
                      color: m.media_type === 'VIDEO' ? IG_PINK : m.media_type === 'CAROUSEL_ALBUM' ? IG_PURPLE : IG_ORANGE,
                    }}>
                      {m.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : m.media_type === 'VIDEO' ? 'Reel' : 'Image'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{m.like_count.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{m.comments_count.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{m.saves.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{m.shares.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{m.reach.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{m.views.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: IG_PINK }}>{m.total_interactions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </W>

      {/* Row 6: Demographics (if available) */}
      {topCities.length > 0 && (
        <>
          <W span={2}>
            <Label>Top Cities</Label>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={topCities} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="value" fill={IG_PURPLE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </W>

          <W span={2}>
            <Label>Top Countries</Label>
            {topCountries.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={topCountries} dataKey="value" cx="50%" cy="50%" outerRadius={42} paddingAngle={2}>
                      {topCountries.map((_, i) => <Cell key={i} fill={[IG_PINK, IG_PURPLE, IG_ORANGE, '#30D158', '#0A84FF'][i] ?? '#888'} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div>
                  {topCountries.map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: [IG_PINK, IG_PURPLE, IG_ORANGE, '#30D158', '#0A84FF'][i] ?? '#888' }} />
                      {c.name}: {c.value.toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-quaternary)', textAlign: 'center' }}>No data</p>
            )}
          </W>
        </>
      )}
    </>
  );
}
