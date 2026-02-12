# 05_UI_UX_STYLE_GUIDE.md

## UI / UX Style Guide --- Trench Transparency Terminal (TTT)

------------------------------------------------------------------------

## Purpose

This document defines the visual and interaction design standards for
the TTT web app.

Primary goals:

-   clarity for non-technical users
-   fast comprehension of risk signals
-   professional, trustworthy aesthetic
-   Helius-inspired modern crypto interface

This is NOT a terminal tool visually --- it is a clean public web app.

------------------------------------------------------------------------

## Core Design Philosophy

### 1. Transparency First

Data should always be:

-   readable
-   structured
-   easy to interpret

Avoid clutter.

------------------------------------------------------------------------

### 2. Minimal but Bold

Inspired by Helius Labs design:

-   dark backgrounds
-   large headings
-   strong accent color
-   generous spacing

The interface should feel:

modern + serious + data-focused.

------------------------------------------------------------------------

### 3. Mobile First

Most trench users are on phones.

Requirements:

-   responsive layouts
-   readable tables
-   tap-friendly buttons
-   fast loading

------------------------------------------------------------------------

## Color Palette

### Primary Background

Black:

#090909

Used for:

-   main background
-   header areas
-   cards (slightly lighter variant)

------------------------------------------------------------------------

### Text Color

Off-white:

#DBDBDB

Used for:

-   body text
-   headings
-   labels

Never pure white unless needed.

------------------------------------------------------------------------

### Accent Color

Helius orange:

#E84125

Used for:

-   CTA buttons
-   highlights
-   risk indicators
-   active elements

Do NOT overuse.

Accent = emphasis only.

------------------------------------------------------------------------

### Risk Indicator Colors

Low Risk: Muted green

Moderate: Amber / yellow

High: Orange-red

Extreme: Red

Always pair color with text label.

------------------------------------------------------------------------

## Typography

### Headings

Large, bold, high contrast.

Short sentences preferred.

Example:

"Token Risk Analysis"

Not:

"Comprehensive Token Risk Analysis Dashboard"

------------------------------------------------------------------------

### Body Text

-   readable size
-   clear spacing
-   no dense paragraphs

Crypto users skim quickly.

------------------------------------------------------------------------

## Layout Structure

### Homepage

Hero section:

-   large headline
-   token input box
-   analyze button
-   example tokens

Followed by:

-   how it works
-   credibility explanation
-   footer links

------------------------------------------------------------------------

### Report Page

Top → Bottom flow:

1.  Verdict header
2.  Token info card
3.  Deployer analysis card
4.  Funding source card
5.  Activity / transfers
6.  Risk explanation
7.  Share buttons

Users should understand risk within 3 seconds.

------------------------------------------------------------------------

## Component Standards

### Cards

Use for:

-   token info
-   deployer info
-   signals
-   summaries

Style:

-   rounded corners
-   subtle border
-   dark gray background

------------------------------------------------------------------------

### Tables

Used for:

-   transfers
-   wallet history

Requirements:

-   sortable columns
-   timestamps readable
-   mobile scrolling support

------------------------------------------------------------------------

### Badges

Used for:

-   identity tags
-   risk labels
-   funding source indicators

Keep consistent shape.

------------------------------------------------------------------------

### Buttons

Primary:

Accent orange.

Secondary:

Neutral gray.

Always clear action wording:

-   Analyze
-   Copy
-   Share
-   View Wallet

------------------------------------------------------------------------

## Interaction Guidelines

### Loading States

Must include:

-   skeleton cards
-   spinner fallback
-   clear progress indicator

Blockchain queries can take time.

------------------------------------------------------------------------

### Error States

Always explain:

-   missing data
-   API limits
-   unresolved deployer

Never show cryptic errors.

------------------------------------------------------------------------

### Tooltips

Use sparingly.

Good for:

-   explaining signals
-   clarifying technical terms

------------------------------------------------------------------------

## Branding Tone

Professional but approachable.

Avoid:

-   hype language
-   meme overload
-   aggressive warnings

Goal:

Trustworthy intelligence platform.

------------------------------------------------------------------------

## Accessibility

Required:

-   high contrast text
-   keyboard navigation
-   screen-reader labels
-   readable font sizes

Crypto tools often ignore accessibility --- we won't.

------------------------------------------------------------------------

## Future Enhancements

-   dark/light toggle
-   advanced terminal view toggle
-   customizable dashboards
-   exportable reports

------------------------------------------------------------------------

## Summary

The TTT interface should feel:

clean trustworthy modern data-focused

Design must reinforce credibility.
