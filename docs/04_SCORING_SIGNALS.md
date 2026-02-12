# 04_SCORING_SIGNALS.md

## Risk Scoring System --- Trench Transparency Terminal (TTT)

------------------------------------------------------------------------

## Purpose

This document defines the explainable risk scoring model used by TTT.

The score is NOT financial advice. It is a transparency indicator based
on observable blockchain behavior.

Core goals:

-   clarity
-   explainability
-   reproducibility
-   conservative interpretation

Every score MUST include:

-   numeric value (0--100)
-   reason bullets
-   uncertainty disclosure

------------------------------------------------------------------------

## Score Interpretation

  Score     Label       Meaning
  --------- ----------- --------------------------
  0--25     Low Risk    Few suspicious signals
  26--50    Moderate    Some caution signals
  51--75    High Risk   Multiple risk indicators
  76--100   Extreme     Strong rug-style signals

Always display reasons.

Never show score without explanation.

------------------------------------------------------------------------

## Primary Signals

### Funding Source (High Weight)

From Wallet API `/funded-by`:

-   Mixer funded → +35
-   Bridge funded → +15
-   Exchange funded → +10
-   Unknown source → +5

Reason: Funding origin often correlates with launch intent.

------------------------------------------------------------------------

### Wallet Freshness

Indicators:

-   little or no transaction history
-   very recent wallet creation
-   minimal balance history

Score impact:

+10

Reason: Throwaway deployer wallets are common in rugs.

------------------------------------------------------------------------

### Rapid Fund → Deploy Timing

If funding occurs shortly before first major activity:

-   under 30 minutes → +15
-   under 3 hours → +10

Reason: Fast launches after funding suggest opportunistic deployment.

------------------------------------------------------------------------

### Exchange Cash-Out Behavior

Detected via:

-   transfers to exchange-tagged wallets
-   repeated outbound transfers shortly after launch

Score impact:

+10

Reason: Early cash-out can signal exit behavior.

------------------------------------------------------------------------

### Spray Transfers

Multiple transfers to fresh wallets shortly after launch:

+10

Reason: Often associated with insider distribution or obfuscation.

------------------------------------------------------------------------

## Secondary Signals (Future)

Not in MVP but planned:

-   LP removal detection
-   insider concentration clustering
-   cross-token deployer history
-   liquidity lock verification
-   holder distribution anomalies

These will refine scoring later.

------------------------------------------------------------------------

## Unknowns / Uncertainty Handling

If data unavailable:

-   explicitly show "Unknown"
-   reduce scoring confidence
-   avoid speculative language

Example:

"Funding source unknown --- data incomplete."

------------------------------------------------------------------------

## AI Summary Constraints

AI layer must:

-   only summarize structured signals
-   never invent facts
-   always reference scoring reasons

AI output format:

-   verdict sentence
-   bullet reasons
-   uncertainty note

------------------------------------------------------------------------

## Anti-Abuse Principles

Avoid:

-   labeling wallets as malicious
-   definitive accusations
-   overconfidence

Always frame as:

"Observed signals suggest elevated risk."

------------------------------------------------------------------------

## Future Improvements

-   Machine learning signal weighting
-   Reputation scoring database
-   Cross-wallet clustering
-   Historical rug pattern modeling

These will remain explainable.

Black-box scoring is not allowed.

------------------------------------------------------------------------

## Summary

The TTT scoring system prioritizes:

-   transparency
-   evidence-based signals
-   clear communication
-   responsible risk framing

Trust comes from explainability, not complexity.
