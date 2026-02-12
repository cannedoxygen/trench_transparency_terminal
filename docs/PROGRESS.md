# Trench Transparency Terminal - Development Progress

> "Bloomberg Terminal for Shitcoins"

**Last Updated:** February 2025
**Status:** ~85% Feature Complete

---

## Overview

Trench Transparency Terminal (TTT) is a Solana token intelligence platform that helps traders avoid rug pulls by providing deep analysis of token deployers, holders, and on-chain behavior.

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- Helius API (Solana data)
- OpenAI GPT-4o-mini (AI features)
- Upstash Redis (caching)

---

## Feature Status

### Phase 1: Deployer Intelligence ✅ COMPLETE

| Feature | Status | Description |
|---------|--------|-------------|
| Deployer Detection | ✅ | Identifies token creator from on-chain data |
| Deployer History | ✅ | Shows all tokens launched by deployer |
| Rug Rate Calculation | ✅ | Percentage of deployer's tokens that rugged |
| Associated Wallets | ✅ | Maps connected wallets (funders, recipients) |
| Funding Chain Analysis | ✅ | Traces money flow up to 3 levels |
| Token Age Tracking | ✅ | When token was created |
| Wallet Age Tracking | ✅ | When deployer wallet first transacted |

**Key Files:**
- `src/lib/deployer/resolver.ts` - Deployer detection
- `src/lib/deployer/history.ts` - Token launch history
- `src/lib/deployer/personality.ts` - Behavioral profiling
- `src/lib/wallets/associated.ts` - Wallet clustering

---

### Phase 2: Holder Analysis ✅ COMPLETE

| Feature | Status | Description |
|---------|--------|-------------|
| Top Holders | ✅ | Shows largest token holders |
| Holder Concentration | ✅ | Top 10 holder percentage |
| Sniper Detection | ✅ | Identifies early block buyers |
| Insider Detection | ✅ | Finds wallets connected to deployer |
| Insider Clusters | ✅ | Groups coordinated wallets |
| Exchange Flow Tracking | ✅ | Monitors CEX deposits/withdrawals |
| Cash-out Detection | ✅ | Alerts on exchange deposits |

**Key Files:**
- `src/lib/holders/analyzer.ts` - Holder analysis
- `src/lib/insiders/detector.ts` - Cluster detection
- `src/lib/exchange/tracker.ts` - CEX flow tracking

---

### Phase 3: AI Features ✅ COMPLETE

| Feature | Status | Description |
|---------|--------|-------------|
| AI Summary | ✅ | Natural language risk assessment |
| Risk Verdict | ✅ | SAFE / CAUTION / DANGER / EXTREME |
| Key Points | ✅ | Bullet-point risk factors |
| Deployer Personality | ✅ | Behavioral fingerprint |
| AI Copilot Chat | ✅ | Ask questions about any token |

**Key Files:**
- `src/lib/ai/summary.ts` - AI summary generation
- `src/lib/deployer/personality.ts` - Personality profiler
- `src/app/api/chat/route.ts` - Chat API endpoint
- `src/components/AICopilot.tsx` - Chat widget

---

### Phase 4: Real-Time Features ⚠️ PARTIAL

| Feature | Status | Description |
|---------|--------|-------------|
| Live Rug Meter | ✅ | Real-time risk score updates |
| Activity Monitoring | ✅ | Polls for suspicious activity |
| UI Alerts | ✅ | Shows alerts in the interface |
| WebSocket Updates | ❌ | Would need Helius webhooks |
| Push Notifications | ❌ | Would need backend infrastructure |

**Key Files:**
- `src/lib/live/monitor.ts` - Live monitoring logic
- `src/components/LiveRugMeter.tsx` - Real-time meter UI

---

### Phase 5: Reputation System ✅ COMPLETE

| Feature | Status | Description |
|---------|--------|-------------|
| Wallet Scoring | ✅ | 0-100 reputation score |
| Score Breakdown | ✅ | Age, activity, history factors |
| Wallet Lookup | ✅ | Check any wallet's reputation |
| Smart Money Tracking | ✅ | Find high-reputation holders |
| Smart Money Sentiment | ✅ | Bullish/Neutral/Bearish signal |

**Key Files:**
- `src/lib/reputation/scorer.ts` - Reputation calculation
- `src/lib/smartmoney/tracker.ts` - Smart money detection
- `src/app/api/reputation/route.ts` - Reputation API
- `src/components/WalletReputationCard.tsx` - Reputation UI

---

### Phase 6: Graph Analysis ✅ COMPLETE

| Feature | Status | Description |
|---------|--------|-------------|
| Wallet Network | ✅ | Visual map of wallet connections |
| Funding Tree | ✅ | Shows funding chain visually |
| Related Deployers | ✅ | Finds connected token creators |
| KOL Detection | ✅ | Checks for influencer connections |

**Key Files:**
- `src/components/WalletGraphCard.tsx` - Network visualization
- `src/lib/kol/detector.ts` - KOL detection logic
- `src/components/KOLDetectionCard.tsx` - KOL display

---

### Phase 7: Distribution ❌ NOT STARTED

| Feature | Status | Description |
|---------|--------|-------------|
| Telegram Bot | ❌ | Paste CA, get analysis |
| Twitter/X Bot | ❌ | Reply to token mentions |
| Browser Extension | ❌ | Overlay on DEX sites |
| Public API | ❌ | Let others build on data |

---

## Component Library

### Analysis Cards
| Component | Purpose |
|-----------|---------|
| `VerdictHeader` | Risk score header display |
| `AISummaryCard` | AI-generated summary |
| `TokenInfoCard` | Token metadata |
| `DeployerCard` | Deployer information |
| `DeployerHistoryCard` | Token launch history |
| `PersonalityProfileCard` | Deployer behavioral profile |
| `HolderAnalysisCard` | Top holders display |
| `InsiderClustersCard` | Coordinated wallet groups |
| `AssociatedWalletsCard` | Connected wallets |
| `ExchangeFlowCard` | CEX activity |
| `FundingSourceCard` | Funding chain info |
| `TransfersTable` | Recent transactions |

### Interactive Features
| Component | Purpose |
|-----------|---------|
| `LiveRugMeter` | Real-time risk monitoring |
| `AICopilot` | Chat interface for questions |
| `SmartMoneyCard` | High-reputation holder tracking |
| `WalletGraphCard` | Visual wallet network |
| `KOLDetectionCard` | Influencer detection |
| `WalletReputationCard` | Wallet lookup tool |
| `SharePanel` | Social sharing |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze` | POST | Full token analysis |
| `/api/chat` | POST | AI copilot conversations |
| `/api/reputation` | GET | Wallet reputation lookup |

---

## Risk Scoring System

### Base Signals
| Signal | Points | Condition |
|--------|--------|-----------|
| Mixer funding | +35 | Funded from tornado/mixer |
| Bridge funding | +15 | Funded from bridge |
| Exchange funding | +10 | Funded from CEX |
| Unknown source | +5 | Can't identify funder |
| Fresh wallet | +10 | Wallet < 7 days old |
| Fast fund→deploy | +15 | < 1 hour between |
| Exchange cash-out | +10-25 | Deposits to CEX |

### Boosters
| Condition | Points |
|-----------|--------|
| High rug rate (>50%) | +30 |
| Moderate rug rate (>25%) | +15 |
| Top 10 concentration (>80%) | +10 |
| Sniper count (≥5) | +10 |
| Known bad actor tags | +50 |
| Mixer in funding chain | +20 |
| Related deployers | +10 |
| Cash-out detected | +25 |
| Serial rugger profile | +30 |
| Pump & dump profile | +20 |
| Insider clusters (>25%) | +20 |
| Deployer-funded holders | +15 |

### Risk Levels
| Score | Label |
|-------|-------|
| 0-25 | LOW |
| 26-50 | MODERATE |
| 51-75 | HIGH |
| 76-100 | EXTREME |

---

## Environment Variables

```env
# Required
HELIUS_API_KEY=           # Helius API key
OPENAI_API_KEY=           # OpenAI API key

# Optional
UPSTASH_REDIS_REST_URL=   # Redis cache URL
UPSTASH_REDIS_REST_TOKEN= # Redis token
NEXT_PUBLIC_BASE_URL=     # For share links
```

---

## What's Next

### High Priority
1. **Database Integration** - Store historical data for better analysis
2. **WebSocket Updates** - True real-time monitoring via Helius webhooks
3. **Telegram Bot** - Quick analysis via chat

### Medium Priority
4. **Browser Extension** - Overlay on Dexscreener, Birdeye
5. **Push Notifications** - Alert on dangerous activity
6. **KOL Database** - Real influencer wallet tracking

### Low Priority
7. **Twitter Bot** - Auto-reply analysis
8. **Public API** - Let others integrate
9. **Mobile App** - Native experience

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── t/[mint]/page.tsx     # Report page
│   └── api/
│       ├── analyze/          # Main analysis
│       ├── chat/             # AI copilot
│       └── reputation/       # Wallet lookup
├── components/
│   ├── ui/                   # shadcn components
│   └── *.tsx                 # Feature components
├── lib/
│   ├── helius/               # Helius API client
│   ├── deployer/             # Deployer analysis
│   ├── holders/              # Holder analysis
│   ├── wallets/              # Wallet clustering
│   ├── exchange/             # CEX tracking
│   ├── insiders/             # Insider detection
│   ├── reputation/           # Wallet scoring
│   ├── smartmoney/           # Smart money tracking
│   ├── kol/                  # KOL detection
│   ├── live/                 # Real-time monitoring
│   ├── ai/                   # AI summary
│   ├── scoring/              # Risk calculation
│   └── cache.ts              # Redis caching
└── types/
    └── index.ts              # TypeScript types
```

---

## Credits

- **Helius** - Solana data infrastructure
- **OpenAI** - AI summaries
- **shadcn/ui** - Component library
- **Vercel** - Hosting (recommended)

---

*Built for the trenches. Stay safe out there.*
