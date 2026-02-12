import { heliusClient } from "@/lib/helius/client"
import { calculateWalletReputation } from "@/lib/reputation/scorer"

export interface SmartMoneyWallet {
  address: string
  reputation: number
  reputationLabel: "trusted" | "neutral" | "suspicious" | "dangerous" | "unknown"
  holding: number  // Token amount
  holdingPercentage: number  // % of total supply
  entryTimestamp: number | null
  knownAs: string | null
  isEarlyBuyer: boolean
  pnlEstimate: "profit" | "loss" | "unknown"
}

export interface SmartMoneyAnalysis {
  tokenMint: string
  smartMoneyCount: number
  smartMoneyHolding: number  // Total % held by smart money
  topSmartMoney: SmartMoneyWallet[]
  sentiment: "bullish" | "neutral" | "bearish"
  recentActivity: "entering" | "holding" | "exiting" | "none"
  warnings: string[]
  positives: string[]
}

/**
 * Analyze smart money presence in a token
 */
export async function analyzeSmartMoney(
  tokenMint: string,
  topHolders: Array<{ address: string; percentage: number }>,
  tokenCreatedAt: number | null
): Promise<SmartMoneyAnalysis> {
  console.log(`[SmartMoney] Analyzing smart money for ${tokenMint.slice(0, 8)}...`)

  const smartMoneyWallets: SmartMoneyWallet[] = []
  const warnings: string[] = []
  const positives: string[] = []

  // Analyze top 20 holders for smart money
  const holdersToCheck = topHolders.slice(0, 20)

  for (const holder of holdersToCheck) {
    try {
      // Get reputation for this holder
      const reputation = await calculateWalletReputation(holder.address)

      // Only consider "trusted" or high neutral scores as smart money
      if (reputation.score >= 60) {
        // Check if they're an early buyer
        let entryTimestamp: number | null = null
        let isEarlyBuyer = false

        try {
          // Get their token account creation to estimate entry time
          const transfers = await heliusClient.getWalletTransfers(holder.address, 50)
          const tokenTransfers = transfers.transfers.filter(
            t => t.token.mint === tokenMint && t.direction === "in"
          )

          if (tokenTransfers.length > 0) {
            // Get oldest buy
            entryTimestamp = Math.min(...tokenTransfers.map(t => t.timestamp))

            // Check if early buyer (within first 10 minutes of token creation)
            if (tokenCreatedAt && entryTimestamp - tokenCreatedAt < 600) {
              isEarlyBuyer = true
            }
          }
        } catch {
          // Couldn't get transfer history
        }

        smartMoneyWallets.push({
          address: holder.address,
          reputation: reputation.score,
          reputationLabel: reputation.label,
          holding: 0,  // Would need token balance
          holdingPercentage: holder.percentage,
          entryTimestamp,
          knownAs: reputation.details.knownEntity,
          isEarlyBuyer,
          pnlEstimate: "unknown",  // Would need price data
        })
      }
    } catch (error) {
      console.error(`[SmartMoney] Error checking ${holder.address}:`, error)
    }
  }

  // Sort by reputation score
  smartMoneyWallets.sort((a, b) => b.reputation - a.reputation)

  // Calculate totals
  const smartMoneyCount = smartMoneyWallets.length
  const smartMoneyHolding = smartMoneyWallets.reduce(
    (sum, w) => sum + w.holdingPercentage,
    0
  )

  // Determine sentiment
  let sentiment: SmartMoneyAnalysis["sentiment"] = "neutral"
  if (smartMoneyCount >= 5 && smartMoneyHolding > 10) {
    sentiment = "bullish"
    positives.push(`${smartMoneyCount} high-reputation wallets hold ${smartMoneyHolding.toFixed(1)}%`)
  } else if (smartMoneyCount === 0 && topHolders.length >= 10) {
    sentiment = "bearish"
    warnings.push("No high-reputation wallets among top holders")
  }

  // Check for early smart money
  const earlySmartMoney = smartMoneyWallets.filter(w => w.isEarlyBuyer)
  if (earlySmartMoney.length > 0) {
    positives.push(`${earlySmartMoney.length} smart money wallet(s) bought early`)
  }

  // Check for known entities
  const knownEntities = smartMoneyWallets.filter(w => w.knownAs)
  if (knownEntities.length > 0) {
    positives.push(`Known entities: ${knownEntities.map(w => w.knownAs).join(", ")}`)
  }

  // Determine recent activity (would need historical data for accuracy)
  let recentActivity: SmartMoneyAnalysis["recentActivity"] = "none"
  if (smartMoneyCount > 0) {
    recentActivity = "holding"
  }

  console.log(`[SmartMoney] Found ${smartMoneyCount} smart money wallets holding ${smartMoneyHolding.toFixed(1)}%`)

  return {
    tokenMint,
    smartMoneyCount,
    smartMoneyHolding,
    topSmartMoney: smartMoneyWallets.slice(0, 10),
    sentiment,
    recentActivity,
    warnings,
    positives,
  }
}
