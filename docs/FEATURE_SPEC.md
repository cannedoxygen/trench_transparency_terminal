# FEATURE_SPEC.md

## Trench Transparency Terminal --- Feature Specification

------------------------------------------------------------------------

## Core Function

Public web app where users paste a Solana token mint address and receive
a transparent intelligence report.

Primary goals:

-   blockchain transparency
-   deployer attribution
-   risk awareness
-   shareable analysis

------------------------------------------------------------------------

## MVP Features

### Token Input

-   paste token mint address
-   validation before analysis
-   example tokens on homepage

### Deployer Resolution

-   infer deployer from earliest mint transaction
-   show confidence level
-   show evidence and method

### Wallet Intelligence

Using Helius Wallet API:

-   funded-by source
-   identity tags
-   transfers
-   wallet history summary

### Risk Score

Explainable scoring system:

-   numeric score (0--100)
-   label (low / moderate / high / extreme)
-   reasons list
-   unknown factors

### Report Page

URL:

/t/\[mint\]

Contains:

-   verdict header
-   token info
-   deployer analysis
-   funding source
-   recent activity
-   share buttons

------------------------------------------------------------------------

## Phase 2 Features

-   wallet reputation scoring
-   insider holder clustering
-   liquidity monitoring signals
-   improved visual analytics

------------------------------------------------------------------------

## Phase 3 Features

-   real-time alerts
-   webhook integration
-   watchlists
-   AI investigation assistant

------------------------------------------------------------------------

## Non-Goals (MVP)

-   trading execution
-   wallet custody
-   financial advice
