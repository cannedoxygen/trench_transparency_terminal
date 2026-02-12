# CLAUDE_MASTER_BUILD_PROMPT.md

You are a senior Solana + Next.js engineer.

Build a public web app called:

Trench Transparency Terminal (TTT).

------------------------------------------------------------------------

## Core Goal

User pastes a Solana token mint.

System:

1.  resolves likely deployer wallet
2.  queries Helius Wallet API
3.  computes explainable risk score
4.  renders a shareable report page

No trading features. Read-only intelligence.

------------------------------------------------------------------------

## Tech Stack

Frontend: - Next.js (App Router) - TypeScript - TailwindCSS - shadcn/ui

Backend: - Next.js API routes - server-side Helius API calls - Redis
caching (Upstash)

Hosting: - Vercel recommended

------------------------------------------------------------------------

## Required Pages

/ → homepage input /t/\[mint\] → report page

------------------------------------------------------------------------

## Required API Route

/api/analyze?mint=...

Responsibilities:

-   deployer resolution
-   wallet API queries
-   scoring computation
-   caching result

------------------------------------------------------------------------

## Helius Endpoints

Wallet API:

-   identity
-   funded-by
-   transfers
-   history

Use server-side only.

------------------------------------------------------------------------

## UI Style

Helius-inspired:

-   dark background (#090909)
-   off-white text (#DBDBDB)
-   orange accent (#E84125)
-   bold typography
-   minimal layout

------------------------------------------------------------------------

## Scoring Signals

Mixer funding → +35\
Bridge funding → +15\
Exchange funding → +10\
Unknown funding → +5\
Fresh wallet → +10\
Fast fund→deploy timing → +15\
Exchange cash-out → +10

Always explain reasons.

------------------------------------------------------------------------

## Deliverables

-   full Next.js repo
-   README
-   env example
-   Helius wrapper module
-   scoring module
-   deployer resolution module
