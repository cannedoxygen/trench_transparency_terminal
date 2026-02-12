# 03_API_MAP_HELIUS.md

## Helius API Capability Map for Trench Transparency Terminal (TTT)

------------------------------------------------------------------------

## Purpose

This document defines ALL Helius APIs relevant to the TTT web app and
how they will be used.

Goal:

Translate raw Solana blockchain data into transparent, understandable
token intelligence.

This file acts as:

-   developer reference
-   Claude build context
-   architecture source of truth

------------------------------------------------------------------------

## Core API Category: Wallet Intelligence (Primary Engine)

### Wallet Identity

Endpoint: GET /v1/wallet/{wallet}/identity

Used For:

-   Exchange detection
-   Known protocol tagging
-   Institutional wallet attribution

App Features Enabled:

-   Deployer identification context
-   Reputation scoring
-   Trust indicators

------------------------------------------------------------------------

### Funded‑By Endpoint

Endpoint: GET /v1/wallet/{wallet}/funded-by

This identifies:

-   original funding source
-   exchange withdrawals
-   bridge inflows
-   mixer funding

Critical Signals:

-   "Exchange funded deployer"
-   "Mixer funded deployer"
-   "Fresh bridge wallet"

Core to risk scoring.

------------------------------------------------------------------------

### Wallet Transfers

Endpoint: GET /v1/wallet/{wallet}/transfers

Used For:

-   Dev selling detection
-   Insider wallet clustering
-   Early sniper analysis
-   Cash-out tracking

Displayed As:

-   Transfer tables
-   Timeline events
-   Behavior summaries

------------------------------------------------------------------------

### Wallet History

Endpoint: GET /v1/wallet/{wallet}/history

Used For:

-   Historical transaction patterns
-   Launch cadence analysis
-   Long-term wallet behavior

Important For:

-   Reputation scoring
-   Behavioral AI summaries

------------------------------------------------------------------------

### Wallet Balances

Endpoint: GET /v1/wallet/{wallet}/balances

Used For:

-   Dev token holdings
-   Whale detection
-   Insider allocation estimation

Displayed As:

-   Token distribution summaries
-   Value indicators

------------------------------------------------------------------------

## Token / Asset Data APIs

Helius DAS (Digital Asset Standard) APIs.

Capabilities:

-   Token metadata
-   NFT ownership
-   Asset indexing
-   Holder distributions

App Uses:

-   Token context panels
-   Supply transparency
-   Holder concentration metrics

------------------------------------------------------------------------

## Enhanced Transactions API

Purpose:

Convert raw Solana transactions into human-readable events.

Detectable Events:

-   token swaps
-   NFT sales
-   liquidity actions
-   DeFi interactions

Critical For:

-   identifying dev sells
-   LP removal detection
-   suspicious transaction activity

------------------------------------------------------------------------

## Webhooks (Future Phase)

Real-time monitoring capability.

Possible Alerts:

-   Dev wallet selling
-   Liquidity removal
-   Whale entries
-   Exchange deposits

Future Product Feature:

Live token monitoring dashboard.

------------------------------------------------------------------------

## RPC Infrastructure

Helius RPC endpoints provide:

-   account queries
-   transaction lookups
-   blockchain state access

Use Cases:

-   deployer resolution from mint transaction
-   token initialization detection
-   historical transaction parsing

------------------------------------------------------------------------

## AI Integration Layer

Helius data feeds structured JSON into AI analysis modules.

AI responsibilities:

-   summarize wallet behavior
-   explain risk signals
-   highlight unknown factors

AI must NEVER hallucinate data.

Only summarize provided evidence.

------------------------------------------------------------------------

## Caching Strategy

Because Wallet API usage costs credits:

Cache:

-   deployer resolutions (24h)
-   wallet intelligence (1--6h)
-   token reports (1--6h)

This reduces:

-   latency
-   API cost
-   repeated queries

------------------------------------------------------------------------

## Known Limitations

Wallet API is currently beta.

Expect:

-   response format changes
-   incomplete tagging coverage
-   occasional missing identity data

App must always:

-   show uncertainty
-   avoid definitive claims without evidence

------------------------------------------------------------------------

## Summary

Helius provides:

-   wallet intelligence
-   identity attribution
-   funding transparency
-   transaction interpretation
-   asset indexing

Together these enable TTT to function as:

A public Solana transparency intelligence platform.
