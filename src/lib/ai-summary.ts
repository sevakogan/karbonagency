const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface AskClaudeOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

export async function askClaude({ systemPrompt, userMessage, maxTokens = 500 }: AskClaudeOptions): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return 'AI analysis unavailable — ANTHROPIC_API_KEY not set.';
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await res.json();
    if (data.content?.[0]?.text) {
      return data.content[0].text;
    }
    return 'Unable to generate analysis.';
  } catch (err) {
    console.error('Claude API error:', err);
    return 'AI analysis temporarily unavailable.';
  }
}

export async function generateAdInsight(metricsContext: string, question: string): Promise<string> {
  return askClaude({
    systemPrompt: `You are Karbon AI, a marketing analytics assistant for Karbon Agency. You analyze ad performance data for Shift Arcade Miami and other companies. Be concise, actionable, and specific. Use numbers from the data. Format for Telegram (HTML tags: <b>bold</b>, <i>italic</i>, <code>code</code>). Keep responses under 200 words.`,
    userMessage: `Here is the current ad performance data:\n\n${metricsContext}\n\nQuestion: ${question}`,
    maxTokens: 400,
  });
}

export async function generateConversionAlert(conversionData: string): Promise<string> {
  return askClaude({
    systemPrompt: `You are Karbon AI. Generate a brief, excited Telegram alert about a new conversion/sale. Include the key numbers. Use HTML formatting for Telegram. Keep it to 2-3 sentences max.`,
    userMessage: conversionData,
    maxTokens: 150,
  });
}

export async function generateHourlySummary(metricsData: string): Promise<string> {
  return askClaude({
    systemPrompt: `You are Karbon AI. Generate a brief hourly performance snapshot for Telegram. Compare today vs yesterday if data available. Highlight anything unusual. Use HTML formatting. Keep it under 150 words. Start with a relevant emoji.`,
    userMessage: metricsData,
    maxTokens: 300,
  });
}
