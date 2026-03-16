const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
function getApiKey() { return localStorage.getItem('yithra_api_key') || ''; }
export function setApiKey(key) { localStorage.setItem('yithra_api_key', key); }
export function hasApiKey() { const key = getApiKey(); return key && key.startsWith('sk-ant-'); }

const CATEGORY_MAP = {
  'Housing': ['rent','mortgage','lease','apartment'],
  'Food & Dining': ['lunch','dinner','breakfast','food','restaurant','eat','ate','meal','brunch','snack','pizza','burger','sushi','taco','sandwich','wings','takeout','mcdonalds','wendys','chickfila','chipotle','subway','dominos','popeyes','panera','ihop','applebees','chilis','five guys','whataburger','taco bell','coffee','starbucks','dunkin','cafe','latte'],
  'Transportation': ['gas','fuel','uber','lyft','taxi','parking','toll','bus','train','metro','car wash','oil change'],
  'Groceries': ['grocery','groceries','walmart groceries','kroger','aldi','publix','trader joe','whole foods','costco','sams club','food lion','market','supermarket'],
  'Entertainment': ['movie','movies','concert','show','game','games','gaming','ticket','tickets','bowling','arcade','museum','zoo'],
  'Shopping': ['target','amazon','walmart','shop','shopping','mall','store','clothes','shoes','shirt','pants','jacket','nike','adidas','zara','old navy','nordstrom','tj maxx','marshalls','ross','book','books','electronics'],
  'Utilities': ['electric','electricity','water','internet','wifi','phone bill','utility','utilities','power'],
  'Healthcare': ['doctor','hospital','pharmacy','medicine','prescription','dental','dentist','medical','copay','cvs','walgreens','therapy'],
  'Education': ['tuition','school','textbook','course','college','university'],
  'Subscriptions': ['netflix','spotify','hulu','disney','hbo','apple music','youtube premium','subscription','membership','gym','amazon prime','xbox','playstation'],
  'Personal Care': ['haircut','hair','barber','salon','nails','spa','skincare','makeup'],
  'Savings': ['savings','save','emergency fund'],
  'Debt Payment': ['credit card','loan','debt','student loan','car payment'],
  'Income': ['paid','paycheck','salary','wage','income','deposit','earned','freelance','bonus','refund','reimbursement','cashback']
};
function parseLocally(input) {
  const text = input.trim().toLowerCase();
  const incomeWords = ['paid','earned','paycheck','salary','income','deposit','bonus','refund','reimbursement'];
  const isIncome = incomeWords.some(w => text.includes(w));
  const patterns = [
    /\$\s?(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks?)/,
    /(?:spent|paid|cost|was|for|about|like|around)\s+(\d+(?:\.\d{1,2})?)/,
    /^(\d+(?:\.\d{1,2})?)\s+(?:on|at|for)/,
    /^(\d+(?:\.\d{1,2})?)\s+\w/,
    /\s(\d+(?:\.\d{1,2})?)\s*$/
  ];
  let amount = null;
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { amount = parseFloat(m[1]); if (amount > 0 && amount < 100000) break; amount = null; }
  }
  if (!amount) return null;
  let category = null, merchant = null, best = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      if (text.includes(kw) && kw.length > best) {
        category = cat; best = kw.length;
        const brands = ['walmart','target','amazon','costco','starbucks','dunkin','mcdonalds','wendys','chipotle','subway','netflix','spotify','hulu','uber','lyft','cvs','walgreens','kroger','aldi','publix','nike','adidas','panera','dominos','popeyes'];
        if (brands.some(b => kw.includes(b))) merchant = kw.charAt(0).toUpperCase() + kw.slice(1);
      }
    }
  }
  if (!category) {
    const indicators = ['spent','paid','bought','cost','got','on','at','for','$'];
    if (!indicators.some(w => text.includes(w))) return null;
    category = 'Other';
  }
  if (!merchant) {
    const atMatch = text.match(/at\s+([a-z][a-z\s']+?)(?:\s+(?:for|spent|paid|\d|$)|\s*$)/i);
    if (atMatch) merchant = atMatch[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return { is_transaction: true, transactions: [{ amount, type: isIncome ? 'income' : 'expense', category, merchant: merchant || null, description: merchant ? category + ' at ' + merchant : category }] };
}

function parseMultipleLocally(input) {
  const parts = input.split(/\s*[,&]\s*|\s+and\s+/i);
  if (parts.length < 2) return null;
  const results = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const parsed = parseLocally(part.trim());
    if (parsed && parsed.transactions) results.push(...parsed.transactions);
  }
  return results.length >= 2 ? { is_transaction: true, transactions: results } : null;
}
export async function parseTransaction(userMessage) {
  const multi = parseMultipleLocally(userMessage);
  if (multi) return multi;
  const local = parseLocally(userMessage);
  if (local) return local;
  const apiKey = getApiKey();
  if (!apiKey) return { is_transaction: false, reply: "I couldn't parse that. Try: spent 40 at Target" };
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        system: "You are a financial transaction parser. Respond with valid JSON only. If spending: {\"is_transaction\": true, \"transactions\": [{\"amount\": number, \"type\": \"expense\"|\"income\", \"category\": \"string\", \"merchant\": string|null, \"description\": string}]}. If not: {\"is_transaction\": false, \"reply\": \"response\"}.",
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    const data = await response.json();
    if (data.error) return { is_transaction: false, reply: 'AI error: ' + data.error.message };
    return JSON.parse((data.content?.[0]?.text || '').replace(/```json|```/g, '').trim());
  } catch (err) { return { is_transaction: false, reply: "Try: spent 40 at Target" }; }
}
export async function generateDailyMove(profile, recentSpending) {
  const apiKey = getApiKey();
  if (!apiKey) return { move_text: "Add your API key in Settings for personalized tips.", move_type: "educate", potential_savings: null };
  const ctx = "Age: " + profile.age_range + ", Income: " + profile.income_range + ", Goal: " + profile.top_goal + ", Stress: " + profile.biggest_stress + "\nSpending: " + (recentSpending.length > 0 ? recentSpending.map(t => "$" + t.amount + " " + t.category).join(', ') : 'None yet');
  try {
    const r = await fetch(CLAUDE_API_URL, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500,
        system: "Generate ONE financial tip under 2 sentences. JSON only: {\"move_text\": \"...\", \"move_type\": \"save|reduce|optimize|earn|invest|protect|educate\", \"potential_savings\": number|null}",
        messages: [{ role: 'user', content: ctx }] }) });
    const d = await r.json(); if (d.error) throw new Error(d.error.message);
    return JSON.parse((d.content?.[0]?.text || '').replace(/```json|```/g, '').trim());
  } catch (e) { return { move_text: "Track every dollar today.", move_type: "educate", potential_savings: null }; }
}

export async function generateWeeklySummary(profile, weeklyData) {
  const apiKey = getApiKey();
  if (!apiKey) return 'Add your API key in Settings.';
  try {
    const r = await fetch(CLAUDE_API_URL, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300,
        system: 'Financial coach. 2-3 sentence weekly summary. Plain text only.',
        messages: [{ role: 'user', content: "User: " + profile.age_range + ", goal: " + profile.top_goal + ". Spent $" + weeklyData.totalSpent }] }) });
    const d = await r.json(); if (d.error) throw new Error(d.error.message);
    return d.content?.[0]?.text || 'Great week!';
  } catch (e) { return 'Keep tracking your spending.'; }
}