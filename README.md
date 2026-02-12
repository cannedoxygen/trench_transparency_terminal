# Trench Transparency Terminal (TTT)

A public web application for Solana token intelligence and risk analysis. Paste a token mint address to understand who launched it, how the deployer was funded, and assess potential risks.

## Features

- **Deployer Detection**: Identifies the likely deployer wallet from transaction history
- **Funding Source Analysis**: Detects if deployer was funded via exchanges, bridges, or mixers
- **Risk Scoring**: Explainable 0-100 risk score with clear reasoning
- **Wallet Intelligence**: Age detection, transaction patterns, cash-out behavior
- **Shareable Reports**: Each analysis has a unique URL for sharing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Blockchain Data**: Helius API
- **Caching**: Upstash Redis

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Helius API Key](https://helius.dev)
- [Upstash Redis](https://upstash.com) account (optional but recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/trench.git
cd trench
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example and fill in your values:
```bash
cp .env.example .env
```

4. Configure your environment variables:
```
HELIUS_API_KEY=your_helius_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/analyze/     # Analysis API endpoint
│   ├── t/[mint]/        # Report page
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Homepage
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── VerdictHeader    # Risk score display
│   ├── TokenInfoCard    # Token metadata
│   ├── DeployerCard     # Deployer analysis
│   ├── FundingSourceCard
│   ├── TransfersTable   # Recent activity
│   └── SharePanel       # Share buttons
├── lib/
│   ├── helius/          # Helius API client
│   ├── deployer/        # Deployer resolution
│   ├── scoring/         # Risk calculation
│   └── cache.ts         # Redis utilities
└── types/               # TypeScript types
```

## Risk Scoring

The risk score (0-100) is calculated based on observable signals:

| Signal | Points |
|--------|--------|
| Mixer funding | +35 |
| Bridge funding | +15 |
| Exchange funding | +10 |
| Unknown funding source | +5 |
| Fresh wallet (<7 days) | +10 |
| Fast fund→deploy (<30min) | +15 |
| Fast fund→deploy (<3h) | +10 |
| Exchange cash-out detected | +10 |

### Score Labels

- **0-25**: Low Risk
- **26-50**: Moderate Risk
- **51-75**: High Risk
- **76-100**: Extreme Risk

## API Reference

### GET /api/analyze

Analyze a Solana token.

**Query Parameters:**
- `mint` (required): Solana token mint address

**Response:**
```json
{
  "success": true,
  "data": {
    "mint": "...",
    "timestamp": 1234567890,
    "deployer": {
      "address": "...",
      "confidence": "high",
      "method": "token_creation_detected",
      "evidence": ["..."]
    },
    "funding": {
      "sourceType": "exchange",
      "sourceAddress": "...",
      "confidence": "medium"
    },
    "riskScore": {
      "score": 45,
      "label": "moderate",
      "reasons": ["..."],
      "unknowns": ["..."]
    },
    "recentTransfers": [...],
    "metadata": {...}
  },
  "cached": false
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```
HELIUS_API_KEY=xxx
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Caching

Results are cached to reduce API costs and improve performance:

- Token reports: 6 hours
- Deployer resolution: 24 hours
- Wallet intelligence: 6 hours

Caching gracefully degrades if Redis is unavailable.

## Disclaimer

This tool is for informational purposes only and should not be considered financial advice. Risk scores are based on observable blockchain data and may not capture all relevant factors. Always conduct your own research before making any investment decisions.

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.
