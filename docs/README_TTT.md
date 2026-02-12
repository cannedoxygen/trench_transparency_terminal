# Trench Transparency Terminal (TTT)

**Public Solana intelligence web app for token transparency.**

Paste any Solana token mint address and instantly get a clear, shareable
report about:

-   Who likely deployed the token\
-   Where the deployer's funds came from (exchange, mixer, bridge)\
-   Wallet identity tags (if known)\
-   Recent transfers and behavioral signals\
-   An explainable risk score (0--100)\
-   Plain-English insights for traders ("trenches")

This is NOT a trading tool.\
This is a **transparency and intelligence layer for Solana tokens.**

------------------------------------------------------------------------

## Core Concept

Crypto trenches move fast. Most users don't read on-chain data.

TTT translates raw blockchain activity into:

-   understandable signals\
-   risk awareness\
-   verifiable evidence

No speculation. No hype. Just data + interpretation.

------------------------------------------------------------------------

## MVP Features

### Token Analysis

Paste a mint address:

-   Resolve likely deployer wallet (best-effort)
-   Show confidence + evidence
-   Funding source detection via Helius Wallet API
-   Identity tagging (exchange / entity recognition)
-   Recent transfer behavior
-   Risk score with explanation

------------------------------------------------------------------------

### Shareable Reports

Every analysis produces a public URL:

/t/`<mint-address>`{=html}

Designed for:

-   Telegram sharing
-   X (Twitter) threads
-   Discord alpha chats
-   Research documentation

------------------------------------------------------------------------

### Clean Web Interface

Helius-inspired design:

-   dark background\
-   minimal UI\
-   bold typography\
-   orange accent highlights

Mobile-first and beginner-friendly.

------------------------------------------------------------------------

## Tech Stack Overview

### Frontend

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS
-   shadcn/ui components

### Backend

-   Next.js API routes
-   Helius Wallet API integration

### Data & Infra

-   Upstash Redis / Vercel KV for caching
-   Server-side API key protection
-   Vercel deployment

------------------------------------------------------------------------

## Helius APIs Used

Primary:

-   Wallet Identity API
-   Funded-by endpoint
-   Wallet Transfers
-   Wallet History

Supporting:

-   Solana transaction parsing for deployer detection
-   Token metadata when available

------------------------------------------------------------------------

## Environment Variables

Create `.env.local`:

HELIUS_API_KEY=your_key_here UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token

Never expose these client-side.

------------------------------------------------------------------------

## Local Development

npm install npm run dev

Open: http://localhost:3000

------------------------------------------------------------------------

## Deployment

Recommended: **Vercel**

-   automatic Next.js optimization\
-   environment variable support\
-   fast global edge delivery

------------------------------------------------------------------------

## Project Status

Phase: **Architecture + Initial Build**

Upcoming:

-   deployer resolution improvements\
-   scoring refinement\
-   AI summary layer\
-   wallet clustering\
-   real-time monitoring

------------------------------------------------------------------------

## Philosophy

Transparency \> speculation.\
Data \> narratives.\
Evidence \> hype.

This project exists to make Solana markets safer and more
understandable.
