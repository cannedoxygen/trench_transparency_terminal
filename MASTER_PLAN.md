# TrenchCheck Master Plan

## Current Status: ~85% Complete

### What We Have ✅
- [x] Basic deployer detection
- [x] Funding source detection (Wallet API /funded-by)
- [x] Identity tagging (Wallet API /identity)
- [x] Basic risk scoring
- [x] Recent transfers display
- [x] Simple report page
- [x] Deployer history & rug rate
- [x] Top holders analysis
- [x] Sniper/insider detection
- [x] Insider cluster detection
- [x] Exchange flow tracking
- [x] AI summary generation
- [x] Deployer personality profile
- [x] AI Copilot chat
- [x] Live rug probability meter
- [x] Wallet reputation scoring
- [x] Smart money tracking
- [x] Wallet network visualization
- [x] KOL/Influencer detection

### What's Missing ❌
- [ ] Telegram Bot
- [ ] WebSocket real-time (using polling instead)
- [ ] Push notifications
- [ ] Database for historical tracking
- [ ] Browser extension
- [ ] Public API

> See `/docs/PROGRESS.md` for detailed feature breakdown

---

## PHASE 1: Deployer Intelligence (Priority: HIGH)

### 1.1 Previous Launches & Rug History
**Goal:** Show deployer's track record across ALL tokens they've launched

**Implementation:**
- Query deployer's transaction history for token creation events
- For each token found:
  - Check if liquidity was removed (rug indicator)
  - Check token's current status (dead/alive)
  - Calculate "rug rate" (rugged tokens / total tokens)
- Display: "This deployer launched 5 tokens. 3 rugged (60% rug rate)"

**API Needed:**
- Helius `getSignaturesForAddress` + `parseTransactions`
- Filter for token mint/create instructions

### 1.2 Associated Wallets Detection
**Goal:** Find wallets connected to the deployer

**Implementation:**
- Analyze funding chains (who funded the funder?)
- Find wallets that received funds FROM deployer
- Cluster wallets by shared transaction patterns
- Check if associated wallets also deployed tokens

**New Component:** `AssociatedWalletsCard`

### 1.3 Time Analysis
**Goal:** Fund → Deploy timing signals

**Implementation:**
- Already have basic version
- Add: typical pattern for this deployer (always fast? always slow?)
- Compare to known rug patterns

---

## PHASE 2: Holder Analysis (Priority: HIGH)

### 2.1 Top Holders Intelligence
**Goal:** Who holds this token and are they insiders?

**Implementation:**
- Get token holders via Helius DAS API
- For each top holder:
  - Check when they bought (block 1 = likely insider)
  - Check if they're connected to deployer
  - Check their wallet identity/reputation
- Detect "sniper" wallets (bought in first few blocks)

**API Needed:**
- Helius `getTokenAccounts` or DAS `getAssetsByOwner`

### 2.2 Insider Cluster Detection
**Goal:** Find wallets acting together

**Implementation:**
- Analyze buy timing patterns
- Find wallets funded from same source
- Detect coordinated selling
- Graph-based clustering algorithm

**New Component:** `HolderAnalysisCard`, `InsiderClusterCard`

### 2.3 Exchange Flow Analysis
**Goal:** Track CEX deposits/withdrawals

**Implementation:**
- Monitor transfers to/from known exchange wallets
- Detect "cash out" patterns (token → SOL → exchange)
- Alert on large exchange inflows

---

## PHASE 3: AI Features (Priority: MEDIUM-HIGH)

### 3.1 AI Summary Generation
**Goal:** Natural language risk summary

**Implementation:**
- Collect all signals into structured data
- Send to Claude API with prompt template
- Generate human-readable summary like:
  "⚠️ Likely coordinated launch. Deployer funded from FixedFloat mixer, prior rugs: 3/5 tokens."

**API Needed:**
- Anthropic Claude API (or OpenAI)

**New Component:** `AISummaryCard`

### 3.2 Deployer Personality Profile
**Goal:** Behavioral fingerprint of the deployer

**Implementation:**
- Analyze patterns across all their tokens:
  - Average token lifespan before rug
  - Typical liquidity management
  - Wallet reuse patterns
  - Timing patterns
- Generate personality description

**Example Output:**
"This deployer tends to pump tokens for ~6 hours before liquidity removal. Uses multiple bridge wallets. Likely experienced grifter."

### 3.3 AI Copilot Chat
**Goal:** "Should I ape this?" conversational interface

**Implementation:**
- Chat interface on the page
- User can ask questions about the token
- AI has access to all analysis data
- Provides actionable advice

**New Component:** `AICopilot` chat widget

---

## PHASE 4: Real-Time Features (Priority: MEDIUM)

### 4.1 Live Rug Probability Meter
**Goal:** Real-time risk score that updates

**Implementation:**
- WebSocket connection to Helius
- Monitor for:
  - Liquidity changes
  - Dev wallet sells
  - Large holder movements
  - Exchange inflows
- Update score in real-time

**Display:**
🟢 Safe-ish | 🟡 Risky | 🔴 Rug likely

### 4.2 Alerts System
**Goal:** Notify on dangerous changes

**Implementation:**
- Helius webhooks for wallet activity
- Push notifications / alerts
- "Dev just sold 50% of holdings!"

---

## PHASE 5: Wallet Reputation System (Priority: MEDIUM)

### 5.1 Wallet Scoring
**Goal:** Portable reputation for any wallet

**Signals:**
- Historical PnL (profitable trader?)
- Rug participation (bought rugs?)
- Token launch outcomes (if deployer)
- Account age and activity
- Known associations

**Output:**
"Wallet Reputation: 78/100 (Trusted Trader)"

### 5.2 Smart Money Tracking
**Goal:** "Top wallets entering this token"

**Implementation:**
- Identify high-reputation wallets
- Track their token entries
- Show when smart money is buying

---

## PHASE 6: Graph Analysis (Priority: MEDIUM)

### 6.1 Wallet Connection Graph
**Goal:** Visual map of connected wallets

**Implementation:**
- Build transaction graph
- Identify clusters
- Detect hidden connections
- Find same deployer across tokens

### 6.2 KOL/Influencer Detection
**Goal:** Connect tokens to known personalities

**Implementation:**
- Database of known KOL wallets
- Detect when KOLs are connected to token
- "This token is likely connected to X influencer cluster"

---

## PHASE 7: Distribution (Priority: LOW initially)

### 7.1 Telegram Bot
**Goal:** Paste CA, get instant analysis

**Implementation:**
- Telegram Bot API
- Call our analysis endpoint
- Return formatted response

### 7.2 Twitter/X Bot
**Goal:** Reply to token mentions with analysis

### 7.3 Browser Extension
**Goal:** Overlay on Dexscreener, Birdeye, etc.

### 7.4 API for Others
**Goal:** Let others build on our data

---

## Technical Requirements

### New Dependencies Needed
- `@anthropic-ai/sdk` - AI summaries and copilot
- `ws` or `socket.io` - Real-time updates
- Database (Supabase/Postgres) - Store historical data, reputation scores
- Graph library (for clustering visualization)

### Database Schema Needed
```sql
-- Deployer history
deployers (
  address,
  tokens_launched,
  rugs_count,
  rug_rate,
  first_seen,
  last_seen
)

-- Token tracking
tokens (
  mint,
  deployer,
  launch_time,
  is_rugged,
  liquidity_removed_at
)

-- Wallet reputation
wallet_reputation (
  address,
  score,
  pnl_history,
  rug_participation,
  last_updated
)

-- Wallet clusters
wallet_clusters (
  cluster_id,
  wallets[],
  confidence,
  detected_at
)
```

---

## Implementation Order

### Sprint 1 (Core Intelligence)
1. [ ] Deployer's previous token launches
2. [ ] Rug rate calculation
3. [ ] Top holders analysis
4. [ ] Insider/sniper detection

### Sprint 2 (AI Layer)
5. [ ] AI Summary generation (Claude API)
6. [ ] Deployer personality profile
7. [ ] Enhanced risk scoring with AI

### Sprint 3 (Holder Deep Dive)
8. [ ] Associated wallets detection
9. [ ] Wallet clustering
10. [ ] Exchange flow tracking

### Sprint 4 (Real-Time)
11. [ ] Live rug probability meter
12. [ ] WebSocket updates
13. [ ] Alerts system

### Sprint 5 (Reputation)
14. [ ] Wallet reputation scoring
15. [ ] Smart money tracking
16. [ ] Historical database

### Sprint 6 (Distribution)
17. [ ] Telegram bot
18. [ ] API endpoints
19. [ ] Documentation

---

## Success Metrics

- **Accuracy:** Correctly flag rugs before they happen
- **Speed:** Analysis in < 3 seconds
- **Adoption:** Daily active users
- **Virality:** Shares per analysis

---

## The Vision

> "Bloomberg Terminal for Shitcoins"

Turn raw blockchain data into actionable gut checks that save trenchers from rugs.
