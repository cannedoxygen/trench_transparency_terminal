# 02_TECH_STACK.md

## Trench Transparency Terminal (TTT) --- Technical Stack

------------------------------------------------------------------------

## Overview

This document defines the official technical stack for the Trench
Transparency Terminal web application.

The stack prioritizes:

-   fast public web access
-   Solana-native infrastructure
-   scalability
-   security of API keys
-   clean developer experience
-   rapid iteration

This is a read-only intelligence platform (no wallet custody).

------------------------------------------------------------------------

## Frontend Stack

### Framework

**Next.js (App Router)** Reasons:

-   Server-side rendering for SEO + performance
-   Built-in API routes
-   Edge deployment compatibility
-   Large ecosystem
-   Works perfectly on Vercel

------------------------------------------------------------------------

### Language

**TypeScript**

Reasons:

-   Prevents runtime errors
-   Strong typing for blockchain data
-   Better maintainability

------------------------------------------------------------------------

### Styling

**Tailwind CSS** - Fast UI iteration - Consistent design system - Easy
dark-mode support

**shadcn/ui components** - Accessible primitives - Clean aesthetic
(matches Helius style) - Highly customizable

------------------------------------------------------------------------

### State + Data Fetching

**TanStack Query** - Automatic caching - Retry handling - Optimistic
updates - Smooth loading states

------------------------------------------------------------------------

### Animation (Optional)

**Framer Motion** - Subtle transitions - Improves perceived
performance - Keeps UI modern

------------------------------------------------------------------------

## Backend Stack

### API Layer

**Next.js Route Handlers / API Routes**

Responsibilities:

-   Helius API proxy
-   Deployer resolution
-   Risk scoring
-   Report caching
-   Rate limiting

Important:

Helius API keys must NEVER be exposed client-side.

------------------------------------------------------------------------

### Solana Data Source

**Helius Infrastructure**

Primary usage:

-   Wallet API
-   Identity tagging
-   Funded-by analysis
-   Transfers + history
-   Transaction parsing

This removes the need for raw RPC parsing.

------------------------------------------------------------------------

## Data Storage

### Primary Cache

**Upstash Redis (Recommended)**

Used for:

-   cached analysis reports
-   deployer resolution results
-   wallet intelligence caching

Benefits:

-   serverless
-   global latency optimization
-   simple pricing
-   works natively with Vercel

------------------------------------------------------------------------

### Optional Database (Future)

**Supabase / Postgres**

Use cases:

-   saved public reports
-   analytics dashboards
-   reputation scoring
-   user accounts (later phase)

Not required for MVP.

------------------------------------------------------------------------

## Hosting & Deployment

### Preferred Platform

**Vercel**

Reasons:

-   optimized for Next.js
-   global CDN
-   edge functions
-   easy environment variable management
-   automatic SSL

------------------------------------------------------------------------

## Security Strategy

### API Key Protection

-   Server-only calls to Helius
-   No client exposure
-   Environment variables only

------------------------------------------------------------------------

### Rate Limiting

Protect endpoints from abuse:

-   IP-based throttling
-   Edge middleware
-   Cached responses

------------------------------------------------------------------------

### Data Integrity

Always:

-   show confidence levels
-   display unknowns
-   avoid overclaiming deployer identity

------------------------------------------------------------------------

## Performance Strategy

### Caching Rules

  Data Type               TTL
  ----------------------- ------------
  Token analysis report   1--6 hours
  Deployer resolution     24 hours
  Wallet intelligence     1--6 hours

This reduces:

-   API cost
-   latency
-   duplicate queries

------------------------------------------------------------------------

## Observability (Future)

Recommended tools:

-   Sentry → error tracking
-   PostHog → product analytics
-   Vercel Analytics → performance monitoring

------------------------------------------------------------------------

## Development Workflow

### Recommended Tools

-   GitHub repository
-   Claude Code / AI-assisted development
-   VS Code
-   Prettier + ESLint

------------------------------------------------------------------------

## Scalability Path

### Phase 1

Serverless + caching only

### Phase 2

Add:

-   background workers
-   persistent database
-   report indexing

### Phase 3

Advanced analytics:

-   wallet clustering
-   AI investigation tools
-   live monitoring dashboards

------------------------------------------------------------------------

## Summary

This stack ensures:

-   fast public access
-   strong Solana integration
-   minimal infrastructure overhead
-   production scalability
-   security of blockchain intelligence data

The architecture intentionally stays lean for MVP while allowing
expansion into a full transparency platform.
