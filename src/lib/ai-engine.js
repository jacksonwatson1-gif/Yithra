const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

function getApiKey() {
  return localStorage.getItem('yithra_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('yithra_api_key', key);
}

export function hasApiKey() {
  const key = getApiKey();
  return key && key.startsWith('sk-ant-');
}

export async function parseTransaction(userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { is_transaction: false, reply: 'API key not set. Go to Settings to add your Anthropic key.' };
  }
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: "You are a financial transaction parser. The user will send you a casual message about money they spent or received. Extract structured transaction data.\n\nRULES:\n- Extract: amount (number), type (\"expense\" or \"income\"), category (one of: Housing, Food & Dining, Transportation, Groceries, Entertainment, Shopping, Utilities, Healthcare, Education, Subscriptions, Personal Care, Savings, Debt Payment, Income, Other), merchant (if mentioned), description (brief).\n- If multiple transactions in one message, return an array.\n- If the message is NOT about a transaction, return {\"is_transaction\": false, \"reply\": \"your helpful response\"}.\n- Always respond with valid JSON only. No markdown, no backticks.\n\nExamples:\nInput: \"spent 40 at target\"\nOutput: {\"is_transaction\": true, \"transactions\": [{\"amount\": 40, \"type\": \"expense\", \"category\": \"Shopping\", \"merchant\": \"Target\", \"description\": \"Shopping at Target\"}]}\n\nInput: \"got paid 2500\"\nOutput: {\"is_transaction\": true, \"transactions\": [{\"amount\": 2500, \"type\": \"income\", \"category\": \"Income\", \"merchant\": null, \"description\": \"Paycheck\"}]}\n\nInput: \"how much did I spend?\"\nOutput: {\"is_transaction\": false, \"reply\": \"Let me check your spending.\"}",
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    const data = await response.json();
    if (data.error) {
      return { is_transaction: false, reply: 'API error: ' + (data.error.message || 'Unknown error') };
    }
    const text = data.content?.[0]?.text || '';
    const cleaned = text.replace(/`json|`/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Transaction parse error:', err);
    return { is_transaction: false, reply: "I had trouble understanding that. Could you rephrase?" };
  }
}

export async function generateDailyMove(profile, recentSpending) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { move_text: "Add your API key in Settings to get personalized tips.", move_type: "educate", potential_savings: null };
  }
  const context = "User profile:\n- Age range: " + profile.age_range + "\n- Income range: " + profile.income_range + "\n- Top goal: " + profile.top_goal + "\n- Stress: " + profile.biggest_stress + "\n- Dependents: " + profile.dependents + "\n\nRecent spending (7 days):\n" + (recentSpending.length > 0 ? recentSpending.map(function(t) { return "- $" + t.amount + " on " + t.category + " (" + (t.merchant || t.description) + ")"; }).join('\n') : 'No transactions logged yet.') + "\n\nTotal: $" + recentSpending.reduce(function(sum, t) { return sum + (t.type === 'expense' ? Number(t.amount) : 0); }, 0).toFixed(2);
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: "You are a personal financial coach. Generate ONE specific, actionable financial tip. Keep it under 2 sentences. Respond with valid JSON only: {\"move_text\": \"...\", \"move_type\": \"save|reduce|optimize|earn|invest|protect|educate\", \"potential_savings\": number|null}",
        messages: [{ role: 'user', content: context }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/`json|`/g, '').trim());
  } catch (err) {
    return { move_text: "Track every dollar you spend today.", move_type: "educate", potential_savings: null };
  }
}

export async function generateWeeklySummary(profile, weeklyData) {
  const apiKey = getApiKey();
  if (!apiKey) return 'Add your API key in Settings for weekly insights.';
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a financial coach. Write a 2-3 sentence weekly spending summary. Plain text only.',
        messages: [{ role: 'user', content: "User: " + profile.age_range + ", goal: " + profile.top_goal + ". This week spent $" + weeklyData.totalSpent + ", earned $" + weeklyData.totalIncome }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.[0]?.text || 'Great week of tracking!';
  } catch (err) {
    return 'Keep tracking your spending.';
  }
}
