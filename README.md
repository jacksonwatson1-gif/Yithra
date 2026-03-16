# Clarifi — Your Money. One Move at a Time.

AI-powered personal finance coach — ages 15 to 65+, all income levels.

## Architecture

```
┌─────────────────────────────────────────────┐
│  FRONTEND (React PWA)                       │
│  ├── Auth (Supabase Auth)                   │
│  ├── Onboarding (5-question profiler)       │
│  ├── Chat (conversational tx logging)       │
│  ├── Dashboard (Daily Move + stats)         │
│  └── Settings (push toggle + profile)       │
├─────────────────────────────────────────────┤
│  EDGE FUNCTIONS (Supabase, Deno)            │
│  ├── parse-transaction → Claude Sonnet      │
│  ├── daily-move → Claude Sonnet             │
│  └── weekly-summary → Claude Sonnet         │
├─────────────────────────────────────────────┤
│  DATABASE (Supabase PostgreSQL + RLS)       │
│  ├── profiles, transactions, categories     │
│  ├── daily_moves, weekly_reports            │
│  ├── chat_messages, email_ingestion         │
│  ├── waitlist, push_subscriptions           │
│  └── Row Level Security on ALL tables       │
├─────────────────────────────────────────────┤
│  LANDING PAGE (standalone HTML)             │
│  └── Email capture → waitlist table         │
└─────────────────────────────────────────────┘
```

## Quick Start

### 1. Clone & Install
```bash
tar -xzf clarifi-mvp.tar.gz
cd clarifi
npm install
```

### 2. Add Anthropic API Key to Supabase
This is the one critical secret. The Edge Functions need it to call Claude.

1. Go to https://supabase.com/dashboard/project/vgexbtqtdilyzydstbur/settings/functions
2. Under "Edge Function Secrets", click "Add Secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: your `sk-ant-...` key from https://console.anthropic.com

### 3. Generate VAPID Keys (for push notifications)
```bash
npx web-push generate-vapid-keys
```
This outputs a public and private key. Then:
- Replace `YOUR_VAPID_PUBLIC_KEY_HERE` in `src/lib/push.js` with the public key
- Add `VAPID_PRIVATE_KEY` as a Supabase Edge Function secret (for future server-side push)

### 4. Run Locally
```bash
npm start
```
Opens at http://localhost:3000

### 5. Deploy

**Vercel (recommended, free):**
```bash
npm run build
npx vercel --prod
```

**Landing page:** The file `public/landing.html` is a standalone page. You can:
- Deploy it on its own domain (e.g., `clarifi.app`) via Netlify Drop, Cloudflare Pages, or Vercel
- Or it ships with the app build at `/landing.html`

## Project Structure

```
clarifi/
├── public/
│   ├── index.html          # PWA HTML shell
│   ├── manifest.json       # PWA install manifest
│   ├── sw.js               # Service worker (caching + push notifications)
│   └── landing.html        # Standalone landing page with waitlist
├── src/
│   ├── components/
│   │   ├── Auth.js         # Login / signup
│   │   ├── Onboarding.js   # 5-question life-stage profiler
│   │   ├── Chat.js         # Conversational transaction logger
│   │   ├── Dashboard.js    # Daily Money Move + 7-day stats
│   │   └── Settings.js     # Profile, push toggle, sign-out
│   ├── lib/
│   │   ├── supabase.js     # Supabase client config
│   │   ├── database.js     # All DB helper functions (CRUD)
│   │   ├── ai-engine.js    # Edge Function client (no API keys!)
│   │   └── push.js         # Push notification subscription manager
│   ├── App.js              # Root (auth flow + tab navigation)
│   ├── index.js            # React entry
│   └── index.css           # Mobile-first dark theme stylesheet
└── package.json
```

## Supabase Project

| Detail | Value |
|--------|-------|
| Project | Clarifi |
| Region | us-east-1 |
| Project ID | vgexbtqtdilyzydstbur |
| URL | https://vgexbtqtdilyzydstbur.supabase.co |
| Dashboard | https://supabase.com/dashboard/project/vgexbtqtdilyzydstbur |

### Database (9 tables, all RLS-enabled)
- `profiles` — user life-stage data
- `transactions` — all spending/income
- `categories` — 15 defaults seeded
- `daily_moves` — AI daily tips
- `weekly_reports` — auto-generated summaries
- `chat_messages` — conversation log
- `email_ingestion` — future bank email parsing
- `waitlist` — landing page signups
- `push_subscriptions` — push notification endpoints

### Edge Functions (3 deployed)
- `parse-transaction` — natural language → structured transaction
- `daily-move` — profile + spending → personalized tip
- `weekly-summary` — weekly data → narrative summary

## Roadmap

### Now → 30 days: Validate
- [ ] Deploy app + landing page
- [ ] Collect 100 waitlist signups
- [ ] Onboard 10 beta testers
- [ ] Iterate based on feedback

### 30–90 days: Grow
- [ ] Bank email forwarding (Mailgun inbound parse)
- [ ] CSV/PDF statement upload
- [ ] Shareable weekly reports (public link)
- [ ] Affiliate partnerships (credit cards, savings accounts)

### 90–180 days: Monetize
- [ ] RevenueCat paywall (Free / Pro $4.99 / Family $7.99)
- [ ] Goal tracking with progress viz
- [ ] Trend analysis (monthly/yearly)
- [ ] Plaid bank integration

### 180+ days: Scale
- [ ] React Native for App Store / Google Play
- [ ] Family shared budgets
- [ ] Export (CSV/PDF)
- [ ] Enterprise/advisor features

## License

Proprietary. All rights reserved.
