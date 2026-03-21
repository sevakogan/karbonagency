export interface AiScore {
  score: number; // 0-5
  label: string;
  detail: string;
}

export function scoreMetric(metric: string, value: number, context: { spend: number; impressions: number; clicks: number; conversions: number; reach?: number }): AiScore {
  switch (metric) {
    case 'ctr': {
      if (value >= 5) return { score: 5, label: 'Excellent', detail: 'CTR is well above the 2-3% industry average. Your ads are highly relevant to the audience.' };
      if (value >= 3) return { score: 4, label: 'Good', detail: 'CTR is above average. Your targeting and creative are performing well.' };
      if (value >= 1.5) return { score: 3, label: 'Average', detail: 'CTR is within the normal range. Consider testing new ad creatives to improve.' };
      if (value >= 0.5) return { score: 2, label: 'Below Avg', detail: 'CTR is below average. Review your targeting, ad copy, and creative assets.' };
      return { score: 1, label: 'Poor', detail: 'Very low CTR. Significant changes needed in targeting, creative, or offer.' };
    }
    case 'cpc': {
      if (value === 0) return { score: 0, label: 'No Data', detail: 'No click cost data available yet.' };
      if (value <= 0.3) return { score: 5, label: 'Excellent', detail: 'CPC is extremely low. You\'re getting very efficient clicks.' };
      if (value <= 0.7) return { score: 4, label: 'Good', detail: 'CPC is below average. Cost-efficient traffic acquisition.' };
      if (value <= 1.5) return { score: 3, label: 'Average', detail: 'CPC is within the typical range for social/search ads.' };
      if (value <= 3) return { score: 2, label: 'High', detail: 'CPC is above average. Consider broadening audiences or improving relevance.' };
      return { score: 1, label: 'Very High', detail: 'CPC is very high. Review keyword competition and audience targeting urgently.' };
    }
    case 'cpm': {
      const cpm = context.impressions > 0 ? (context.spend / context.impressions) * 1000 : 0;
      if (cpm === 0) return { score: 0, label: 'No Data', detail: 'No impression cost data yet.' };
      if (cpm <= 5) return { score: 5, label: 'Excellent', detail: 'CPM is very low. Great reach for the budget.' };
      if (cpm <= 12) return { score: 4, label: 'Good', detail: 'CPM is competitive. Efficient awareness building.' };
      if (cpm <= 20) return { score: 3, label: 'Average', detail: 'CPM is standard for social platforms.' };
      if (cpm <= 35) return { score: 2, label: 'High', detail: 'CPM is elevated. Audience might be too narrow or competitive.' };
      return { score: 1, label: 'Very High', detail: 'CPM is very high. Broaden targeting or test different placements.' };
    }
    case 'conversion_rate': {
      const rate = context.clicks > 0 ? (context.conversions / context.clicks) * 100 : 0;
      if (rate === 0) return { score: 0, label: 'No Data', detail: 'No conversion data yet.' };
      if (rate >= 10) return { score: 5, label: 'Excellent', detail: 'Outstanding conversion rate. Your funnel is highly optimized.' };
      if (rate >= 5) return { score: 4, label: 'Good', detail: 'Strong conversion rate. Above average performance.' };
      if (rate >= 2) return { score: 3, label: 'Average', detail: 'Conversion rate is typical. Test landing page improvements.' };
      if (rate >= 0.5) return { score: 2, label: 'Low', detail: 'Low conversion rate. Review landing page and offer alignment.' };
      return { score: 1, label: 'Very Low', detail: 'Conversion rate needs immediate attention. Check tracking and funnel.' };
    }
    case 'roas': {
      if (value === 0) return { score: 0, label: 'No Data', detail: 'No ROAS data available.' };
      if (value >= 5) return { score: 5, label: 'Excellent', detail: 'Outstanding return on ad spend. Every $1 returns $5+.' };
      if (value >= 3) return { score: 4, label: 'Good', detail: 'Healthy ROAS. Campaign is profitable and scalable.' };
      if (value >= 1.5) return { score: 3, label: 'Break Even', detail: 'Marginally profitable. Optimize to improve returns.' };
      if (value >= 0.5) return { score: 2, label: 'Unprofitable', detail: 'Spending more than earning. Review targeting and offers.' };
      return { score: 1, label: 'Losing', detail: 'Significant losses. Pause and restructure the campaign.' };
    }
    case 'reach_efficiency': {
      const freq = (context.reach ?? 0) > 0 ? context.impressions / (context.reach ?? 1) : 0;
      if (freq === 0) return { score: 0, label: 'No Data', detail: 'No reach data yet.' };
      if (freq <= 1.5) return { score: 5, label: 'Fresh', detail: 'Low frequency — audience is seeing ads for the first time. Maximum impact.' };
      if (freq <= 2.5) return { score: 4, label: 'Good', detail: 'Moderate frequency. Good balance of reach and reinforcement.' };
      if (freq <= 4) return { score: 3, label: 'Saturating', detail: 'Starting to show ads too often. Consider expanding audience.' };
      if (freq <= 6) return { score: 2, label: 'High', detail: 'Ad fatigue likely setting in. Rotate creatives and expand reach.' };
      return { score: 1, label: 'Fatigued', detail: 'Audience is oversaturated. Refresh creative and broaden targeting.' };
    }
    case 'overall': {
      // Average of available scores
      const scores = [
        scoreMetric('ctr', context.clicks > 0 ? (context.clicks / context.impressions) * 100 : 0, context),
        scoreMetric('cpc', context.clicks > 0 ? context.spend / context.clicks : 0, context),
        scoreMetric('conversion_rate', 0, context),
        scoreMetric('reach_efficiency', 0, context),
      ].filter(s => s.score > 0);
      const avg = scores.length > 0 ? scores.reduce((s, c) => s + c.score, 0) / scores.length : 0;
      const rounded = Math.round(avg);
      const labels = ['No Data', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent'];
      return { score: rounded, label: labels[rounded] ?? 'N/A', detail: `Overall campaign health based on ${scores.length} metrics.` };
    }
    default:
      return { score: 0, label: 'N/A', detail: '' };
  }
}
