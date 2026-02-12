# 06_ARCHITECTURE.md

## System Architecture --- Trench Transparency Terminal (TTT)

------------------------------------------------------------------------

## Purpose

This document defines the technical architecture for the TTT web
application.

Goals:

-   fast public access
-   secure API key handling
-   scalable blockchain intelligence analysis
-   minimal infrastructure overhead
-   clean separation of responsibilities

This is a read‑only intelligence platform.

No wallet custody or transaction signing.

------------------------------------------------------------------------

## High-Level Architecture

User Browser ↓ Next.js Frontend (SSR/CSR Hybrid) ↓ Next.js API Layer ↓
Helius APIs + Solana RPC ↓ Caching Layer (Redis / KV) ↓ Optional
Persistent DB (Future)

------------------------------------------------------------------------

## Frontend Layer

### Responsibilities

-   user input (token mint / wallet)
-   rendering analysis reports
-   responsive UI
-   loading/error states
-   shareable report pages

### Technology

-   Next.js App Router
-   Tailwind CSS
-   shadcn/ui components
-   TanStack Query

------------------------------------------------------------------------

## API Layer (Core Intelligence Engine)

Implemented via Next.js route handlers.

### Main Endpoint

`/api/analyze?mint=...`

Responsibilities:

1.  resolve deployer wallet
2.  fetch wallet intelligence from Helius
3.  compute scoring signals
4.  build structured report JSON
5.  cache result

------------------------------------------------------------------------

## Deployer Resolution Module

Critical step.

### Strategy (MVP)

-   identify earliest mint-related transaction
-   parse initializer / fee payer
-   infer deployer candidate
-   assign confidence score

Output:

{ deployer, confidence, method, evidence\[\] }

If unresolved:

return "unknown" with explanation.

------------------------------------------------------------------------

## Helius Integration Layer

Server-side only.

### Data Pulled

-   wallet identity tags
-   funding source (funded-by)
-   transfers
-   transaction history
-   token metadata (when available)

Never expose API key client-side.

------------------------------------------------------------------------

## Caching Layer

Recommended:

-   Upstash Redis
-   Vercel KV

### Cached Items

  Item                  TTL
  --------------------- ----------
  Token report          1--6 hrs
  Wallet intelligence   1--6 hrs
  Deployer resolution   24 hrs

Benefits:

-   reduced API cost
-   faster load times
-   improved reliability

------------------------------------------------------------------------

## Future Persistent Data Layer

Optional Postgres/Supabase.

Use cases:

-   historical reports
-   wallet reputation scoring
-   analytics dashboards
-   user accounts

Not required for MVP.

------------------------------------------------------------------------

## Security Architecture

### Key Protection

-   server-side API calls only
-   environment variable storage
-   no client exposure

------------------------------------------------------------------------

### Rate Limiting

Prevent abuse:

-   IP throttling
-   endpoint limits
-   cached fallback responses

------------------------------------------------------------------------

### Data Transparency

Always show:

-   confidence levels
-   unknown fields
-   evidence sources

Never overclaim.

------------------------------------------------------------------------

## Performance Strategy

### SSR + Edge Rendering

-   fast first load
-   SEO benefits
-   shareable previews

------------------------------------------------------------------------

### Progressive Data Loading

-   show verdict first
-   load tables second
-   lazy-load deep history

Improves perceived speed.

------------------------------------------------------------------------

## Observability (Recommended)

Future additions:

-   Sentry for error monitoring
-   Vercel Analytics
-   API usage dashboards

------------------------------------------------------------------------

## Scalability Path

### Phase 1 --- MVP

-   serverless functions
-   Redis caching
-   direct Helius calls

------------------------------------------------------------------------

### Phase 2

-   background workers
-   queued analysis jobs
-   persistent DB

------------------------------------------------------------------------

### Phase 3

-   live monitoring
-   wallet clustering AI
-   real-time alerts

------------------------------------------------------------------------

## Summary

TTT architecture prioritizes:

-   simplicity
-   transparency
-   scalability
-   secure API usage
-   fast public access

Designed to evolve from MVP into a full Solana transparency platform.
