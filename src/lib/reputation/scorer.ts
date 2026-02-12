import { heliusClient } from "@/lib/helius/client"
import { getDeployerHistory } from "@/lib/deployer/history"

export interface WalletReputation {
  address: string
  score: number  // 0-100 (100 = most trusted)
  label: "trusted" | "neutral" | "suspicious" | "dangerous" | "unknown"

  // Score breakdown
  breakdown: {
    accountAge: number  // 0-20 points
    activityLevel: number  // 0-15 points
    tokenDeployHistory: number  // 0-25 points (positive or negative)
    associationRisk: number  // 0-20 points deducted
    tradingPatterns: number  // 0-20 points
  }

  // Details
  details: {
    firstTx: number | null
    txCount: number
    isDeployer: boolean
    tokensDeployed: number
    rugRate: number | null
    associatedWithMixer: boolean
    associatedWithExchange: boolean
    knownEntity: string | null
  }

  // Flags
  flags: string[]
  positives: string[]
}

/**
 * Calculate reputation score for a wallet
 */
export async function calculateWalletReputation(
  address: string
): Promise<WalletReputation> {
  console.log(`[Reputation] Scoring wallet ${address.slice(0, 8)}...`)

  let score = 50  // Start neutral
  const breakdown = {
    accountAge: 0,
    activityLevel: 0,
    tokenDeployHistory: 0,
    associationRisk: 0,
    tradingPatterns: 0,
  }
  const flags: string[] = []
  const positives: string[] = []
  const details = {
    firstTx: null as number | null,
    txCount: 0,
    isDeployer: false,
    tokensDeployed: 0,
    rugRate: null as number | null,
    associatedWithMixer: false,
    associatedWithExchange: false,
    knownEntity: null as string | null,
  }

  try {
    // Parallel fetch
    const [identity, fundedBy, firstTx, deployerHistory] = await Promise.all([
      heliusClient.getWalletIdentity(address),
      heliusClient.getWalletFundedBy(address),
      heliusClient.getFirstTransaction(address),
      getDeployerHistory(address),
    ])

    // 1. Account Age Score (0-20 points)
    if (firstTx?.timestamp) {
      details.firstTx = firstTx.timestamp
      const ageInDays = (Date.now() / 1000 - firstTx.timestamp) / 86400

      if (ageInDays > 365) {
        breakdown.accountAge = 20
        positives.push("Account over 1 year old")
      } else if (ageInDays > 180) {
        breakdown.accountAge = 15
        positives.push("Account over 6 months old")
      } else if (ageInDays > 30) {
        breakdown.accountAge = 10
      } else if (ageInDays > 7) {
        breakdown.accountAge = 5
        flags.push("Account less than 1 month old")
      } else {
        breakdown.accountAge = 0
        flags.push("Very new account (< 1 week)")
      }
    }

    // 2. Activity Level Score (0-15 points)
    // Estimate based on transaction history
    const transfers = await heliusClient.getWalletTransfers(address, 100)
    details.txCount = transfers.transfers.length

    if (details.txCount > 100) {
      breakdown.activityLevel = 15
      positives.push("High activity wallet")
    } else if (details.txCount > 50) {
      breakdown.activityLevel = 12
    } else if (details.txCount > 20) {
      breakdown.activityLevel = 8
    } else if (details.txCount > 5) {
      breakdown.activityLevel = 4
    } else {
      breakdown.activityLevel = 0
      flags.push("Low activity wallet")
    }

    // 3. Token Deploy History (0-25 points, can go negative)
    if (deployerHistory && deployerHistory.totalTokens > 0) {
      details.isDeployer = true
      details.tokensDeployed = deployerHistory.totalTokens
      details.rugRate = deployerHistory.rugRate

      if (deployerHistory.rugRate === 0 && deployerHistory.totalTokens >= 3) {
        breakdown.tokenDeployHistory = 25
        positives.push(`Clean deployer record (${deployerHistory.totalTokens} tokens, 0 rugs)`)
      } else if (deployerHistory.rugRate < 20) {
        breakdown.tokenDeployHistory = 15
        positives.push("Low rug rate deployer")
      } else if (deployerHistory.rugRate < 50) {
        breakdown.tokenDeployHistory = 0
        flags.push(`Moderate rug rate: ${deployerHistory.rugRate}%`)
      } else if (deployerHistory.rugRate < 75) {
        breakdown.tokenDeployHistory = -15
        flags.push(`High rug rate: ${deployerHistory.rugRate}%`)
      } else {
        breakdown.tokenDeployHistory = -25
        flags.push(`Serial rugger: ${deployerHistory.rugRate}% rug rate`)
      }
    } else {
      // Not a deployer - neutral
      breakdown.tokenDeployHistory = 10
    }

    // 4. Association Risk (0-20 points deducted)
    if (fundedBy) {
      const funderType = fundedBy.funderType?.toLowerCase() || ""
      const funderName = fundedBy.funderName?.toLowerCase() || ""

      if (funderType.includes("mixer") || funderName.includes("mixer") || funderName.includes("tornado")) {
        details.associatedWithMixer = true
        breakdown.associationRisk = -20
        flags.push("Funded from mixer/tumbler")
      } else if (funderType.includes("exchange") || funderName.includes("binance") ||
                 funderName.includes("coinbase") || funderName.includes("kraken")) {
        details.associatedWithExchange = true
        breakdown.associationRisk = 5  // Exchange is slightly positive (KYC)
        positives.push(`Funded from ${fundedBy.funderName || "exchange"}`)
      } else if (funderType.includes("bridge")) {
        breakdown.associationRisk = -5
        flags.push("Funded from bridge (harder to trace)")
      }
    }

    // 5. Known Entity Check
    if (identity) {
      if (identity.name) {
        details.knownEntity = identity.name
        positives.push(`Known entity: ${identity.name}`)
        breakdown.tradingPatterns += 10
      }

      if (identity.tags) {
        for (const tag of identity.tags) {
          const lowerTag = tag.toLowerCase()
          if (lowerTag.includes("scammer") || lowerTag.includes("rugger") || lowerTag.includes("exploiter")) {
            breakdown.tradingPatterns = -20
            flags.push(`Tagged as: ${tag}`)
          } else if (lowerTag.includes("dex") || lowerTag.includes("protocol")) {
            breakdown.tradingPatterns += 5
          }
        }
      }
    }

    // Calculate final score
    score = 50 +
      breakdown.accountAge +
      breakdown.activityLevel +
      breakdown.tokenDeployHistory +
      breakdown.associationRisk +
      breakdown.tradingPatterns

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score))

    // Determine label
    let label: WalletReputation["label"]
    if (score >= 70) label = "trusted"
    else if (score >= 45) label = "neutral"
    else if (score >= 25) label = "suspicious"
    else label = "dangerous"

    console.log(`[Reputation] Score: ${score} (${label})`)

    return {
      address,
      score,
      label,
      breakdown,
      details,
      flags,
      positives,
    }
  } catch (error) {
    console.error("[Reputation] Error:", error)
    return {
      address,
      score: 50,
      label: "unknown",
      breakdown,
      details,
      flags: ["Unable to fetch wallet data"],
      positives: [],
    }
  }
}

/**
 * Get reputation label color
 */
export function getReputationColor(label: WalletReputation["label"]): string {
  switch (label) {
    case "trusted": return "text-risk-low"
    case "neutral": return "text-foreground"
    case "suspicious": return "text-risk-moderate"
    case "dangerous": return "text-risk-extreme"
    default: return "text-muted-foreground"
  }
}

/**
 * Get reputation badge variant
 */
export function getReputationBadge(label: WalletReputation["label"]) {
  switch (label) {
    case "trusted": return "low" as const
    case "neutral": return "outline" as const
    case "suspicious": return "moderate" as const
    case "dangerous": return "extreme" as const
    default: return "outline" as const
  }
}
