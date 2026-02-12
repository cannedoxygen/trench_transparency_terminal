import {
  RiskScore,
  RiskLabel,
  FundingSourceType,
  Transfer,
} from "@/types"
import {
  SIGNAL_WEIGHTS,
  identifyFundingType,
  isWalletFresh,
  isFastFundDeploy,
  EXCHANGE_PATTERNS,
} from "./signals"

interface ScoringInput {
  fundingSourceType: FundingSourceType
  fundingTags: string[]
  fundingLabel: string | null
  walletFirstTx: number | null
  walletTxCount: number
  fundTimestamp: number | null
  deployTimestamp: number | null
  recentTransfers: Transfer[]
  deployerConfidence: "high" | "medium" | "low" | "unknown"
}

function getLabelFromScore(score: number): RiskLabel {
  if (score <= 25) return "low"
  if (score <= 50) return "moderate"
  if (score <= 75) return "high"
  return "extreme"
}

export function calculateRiskScore(input: ScoringInput): RiskScore {
  let score = 0
  const reasons: string[] = []
  const unknowns: string[] = []

  // 1. Funding source analysis
  const fundingType = input.fundingSourceType ||
    identifyFundingType(input.fundingTags, input.fundingLabel)

  switch (fundingType) {
    case "mixer":
      score += SIGNAL_WEIGHTS.MIXER_FUNDED
      reasons.push("Deployer wallet funded through mixer (+35)")
      break
    case "bridge":
      score += SIGNAL_WEIGHTS.BRIDGE_FUNDED
      reasons.push("Deployer wallet funded through bridge (+15)")
      break
    case "exchange":
      score += SIGNAL_WEIGHTS.EXCHANGE_FUNDED
      reasons.push("Deployer wallet funded from exchange (+10)")
      break
    case "unknown":
      score += SIGNAL_WEIGHTS.UNKNOWN_FUNDING
      reasons.push("Funding source could not be identified (+5)")
      unknowns.push("Original funding source is unclear")
      break
    case "direct":
      // Direct funding from known wallet - no penalty
      break
  }

  // 2. Wallet freshness
  const isFresh = isWalletFresh(input.walletFirstTx, input.walletTxCount)
  if (isFresh) {
    score += SIGNAL_WEIGHTS.FRESH_WALLET
    if (!input.walletFirstTx) {
      reasons.push("Fresh wallet with no prior history (+10)")
    } else {
      const ageInDays = Math.floor(
        (Date.now() / 1000 - input.walletFirstTx) / 86400
      )
      reasons.push(
        `Relatively new wallet (${ageInDays} days old, ${input.walletTxCount} txns) (+10)`
      )
    }
  }

  // 3. Fast fund → deploy timing
  const fastFund = isFastFundDeploy(input.fundTimestamp, input.deployTimestamp)
  if (fastFund.isFast && fastFund.severity === "30min") {
    score += SIGNAL_WEIGHTS.FAST_FUND_DEPLOY_30MIN
    reasons.push(
      `Very fast deployment after funding (${Math.round(fastFund.timeMinutes || 0)} min) (+15)`
    )
  } else if (fastFund.isFast && fastFund.severity === "3h") {
    score += SIGNAL_WEIGHTS.FAST_FUND_DEPLOY_3H
    reasons.push(
      `Quick deployment after funding (${Math.round((fastFund.timeMinutes || 0) / 60)}h) (+10)`
    )
  }

  // 4. Exchange cash-out detection
  const exchangeTransfers = detectExchangeCashOut(input.recentTransfers)
  if (exchangeTransfers > 0) {
    score += SIGNAL_WEIGHTS.EXCHANGE_CASHOUT
    reasons.push(`Early transfers to exchanges detected (${exchangeTransfers} txns) (+10)`)
  }

  // 5. Spray transfers detection (many transfers to fresh wallets)
  const sprayCount = detectSprayTransfers(input.recentTransfers)
  if (sprayCount >= 5) {
    score += SIGNAL_WEIGHTS.SPRAY_TRANSFERS
    reasons.push(`Multiple transfers to fresh wallets (${sprayCount} recipients) (+10)`)
  }

  // 6. Add unknowns based on data availability
  if (input.deployerConfidence === "unknown") {
    unknowns.push("Deployer wallet could not be determined with confidence")
  } else if (input.deployerConfidence === "low") {
    unknowns.push("Deployer identification has low confidence")
  }

  if (!input.fundTimestamp) {
    unknowns.push("Original funding timestamp unknown")
  }

  // Cap score at 100
  score = Math.min(score, 100)

  return {
    score,
    label: getLabelFromScore(score),
    reasons: reasons.length > 0 ? reasons : ["No significant risk signals detected"],
    unknowns,
  }
}

function detectExchangeCashOut(transfers: Transfer[]): number {
  if (!transfers || transfers.length === 0) return 0

  // Look for outbound transfers to exchange-tagged wallets
  const exchangeTransfers = transfers.filter((t) => {
    if (t.type !== "send") return false
    if (!t.counterpartyTag) return false

    const tag = t.counterpartyTag.toLowerCase()
    return EXCHANGE_PATTERNS.some((pattern) => tag.includes(pattern))
  })

  return exchangeTransfers.length
}

function detectSprayTransfers(transfers: Transfer[]): number {
  if (!transfers || transfers.length === 0) return 0

  // Count unique recipients of outbound transfers
  const recipients = new Set<string>()

  transfers.forEach((t) => {
    if (t.type === "send") {
      recipients.add(t.counterparty)
    }
  })

  return recipients.size
}

export function formatScoreExplanation(riskScore: RiskScore): string {
  const lines: string[] = []

  lines.push(`Risk Score: ${riskScore.score}/100 (${riskScore.label.toUpperCase()})`)
  lines.push("")
  lines.push("Signals detected:")

  riskScore.reasons.forEach((reason) => {
    lines.push(`• ${reason}`)
  })

  if (riskScore.unknowns.length > 0) {
    lines.push("")
    lines.push("Uncertainties:")
    riskScore.unknowns.forEach((unknown) => {
      lines.push(`• ${unknown}`)
    })
  }

  return lines.join("\n")
}
