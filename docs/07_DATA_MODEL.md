# 07_DATA_MODEL.md

## Data Model --- Trench Transparency Terminal (TTT)

------------------------------------------------------------------------

## Purpose

This document defines how data is structured, cached, and optionally
persisted for the Trench Transparency Terminal web app.

The MVP prioritizes:

-   minimal persistent storage
-   fast cached analysis
-   reproducible reports
-   cost-efficient API usage

TTT is primarily a read-only intelligence system.

------------------------------------------------------------------------

## Core Data Principles

### 1. Cache First

Blockchain queries are expensive and slow.

We cache:

-   token analysis reports
-   deployer resolutions
-   wallet intelligence results

This improves:

-   speed
-   reliability
-   API credit usage

------------------------------------------------------------------------

### 2. Deterministic Reports

Given the same inputs and blockchain state, the same report should be
generated.

This ensures:

-   reproducibility
-   transparency
-   user trust

------------------------------------------------------------------------

### 3. Avoid Unnecessary Persistence

MVP does NOT require a traditional database.

Persistent storage becomes useful later for:

-   historical analytics
-   user dashboards
-   reputation scoring

------------------------------------------------------------------------

## Cached Objects

### Token Analysis Report

Key:

`report:<mint>`

Structure:

{ mint, timestamp, deployer: { address, confidence, method, evidence\[\]
}, funding: { sourceType, taggedEntity, confidence }, identityTags\[\],
riskScore, riskLabel, reasons\[\], unknowns\[\], recentTransfers\[\],
metadata }

TTL:

1--6 hours

------------------------------------------------------------------------

### Deployer Resolution Cache

Key:

`deployer:<mint>`

Structure:

{ deployerAddress, confidence, method, evidence\[\], resolvedAt }

TTL:

24 hours

Reason:

Deployer rarely changes.

------------------------------------------------------------------------

### Wallet Intelligence Cache

Key:

`wallet:<address>`

Structure:

{ identityTags\[\], fundedBy, transfers\[\], historySummary,
balancesSummary, lastUpdated }

TTL:

1--6 hours

------------------------------------------------------------------------

## Optional Persistent Database (Future)

Recommended:

Postgres (Supabase or self-hosted).

Tables:

### Reports

Stores historical public reports.

Fields:

-   id
-   mint
-   deployer
-   risk_score
-   report_json
-   created_at

------------------------------------------------------------------------

### Wallet Reputation

Future scoring system.

Fields:

-   wallet_address
-   reputation_score
-   rug_associations
-   first_seen
-   last_seen

------------------------------------------------------------------------

### Analytics

Tracks platform usage.

Fields:

-   event_type
-   timestamp
-   metadata

Examples:

-   report generated
-   report shared
-   token searched

------------------------------------------------------------------------

## Data Flow Summary

User Input → Token Mint

↓

Deployer Resolution

↓

Helius Wallet API Queries

↓

Signal Computation

↓

Risk Score Generation

↓

Cache Report

↓

Render Web Page

------------------------------------------------------------------------

## Privacy Considerations

TTT processes public blockchain data only.

We do NOT store:

-   private keys
-   wallet credentials
-   personal identity data

User IP logging should be minimal and used only for:

-   rate limiting
-   abuse prevention

------------------------------------------------------------------------

## Data Retention Policy

Cache-based data:

-   automatically expires via TTL

Persistent data (future):

-   transparent retention policy
-   user deletion options if accounts exist

------------------------------------------------------------------------

## Summary

The TTT data model emphasizes:

-   speed via caching
-   transparency via structured reports
-   scalability without heavy databases
-   future extensibility for analytics and reputation scoring
