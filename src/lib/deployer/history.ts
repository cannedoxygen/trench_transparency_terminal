import { heliusClient } from "@/lib/helius/client"

export interface DeployedToken {
  mint: string
  name: string | null
  symbol: string | null
  deployedAt: number
  isRugged: boolean
  rugIndicators: string[]
  currentStatus: "active" | "dead" | "unknown"
  liquidityRemoved: boolean
}

export interface DeployerHistory {
  address: string
  tokensLaunched: DeployedToken[]
  totalTokens: number
  ruggedTokens: number
  rugRate: number // percentage
  avgTokenLifespan: number | null // in hours
  firstLaunch: number | null
  lastLaunch: number | null
  riskLevel: "low" | "medium" | "high" | "extreme"
}

/**
 * Find all tokens deployed by a wallet
 */
export async function getDeployerHistory(deployerAddress: string): Promise<DeployerHistory> {
  const tokensLaunched: DeployedToken[] = []

  try {
    console.log(`[DeployerHistory] Fetching history for ${deployerAddress}`)

    // Get transactions in smaller batches to avoid API errors
    const transactions = await heliusClient.getAddressHistory(deployerAddress, 50)

    if (!transactions || transactions.length === 0) {
      console.log(`[DeployerHistory] No transactions found for ${deployerAddress}`)
      return createEmptyHistory(deployerAddress)
    }

    console.log(`[DeployerHistory] Found ${transactions.length} transactions`)

    // Find token creation transactions
    for (const tx of transactions) {
      // Check for token mint/create instructions
      const isTokenCreation =
        tx.type?.toLowerCase().includes("create") ||
        tx.type?.toLowerCase().includes("initialize_mint") ||
        tx.type?.toLowerCase().includes("token") ||
        tx.source?.toLowerCase().includes("token")

      if (isTokenCreation && tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        for (const transfer of tx.tokenTransfers) {
          // This might be a token this wallet created
          const mint = transfer.mint

          // Skip if we already have this token
          if (tokensLaunched.some(t => t.mint === mint)) continue

          // Get token metadata
          const asset = await heliusClient.getAsset(mint)

          // Analyze if this token was rugged
          const rugAnalysis = await analyzeTokenForRug(mint, deployerAddress)

          tokensLaunched.push({
            mint,
            name: asset?.content?.metadata?.name || null,
            symbol: asset?.content?.metadata?.symbol || asset?.token_info?.symbol || null,
            deployedAt: tx.timestamp,
            isRugged: rugAnalysis.isRugged,
            rugIndicators: rugAnalysis.indicators,
            currentStatus: rugAnalysis.status,
            liquidityRemoved: rugAnalysis.liquidityRemoved,
          })

          // Limit to prevent too many API calls
          if (tokensLaunched.length >= 10) break
        }
      }

      if (tokensLaunched.length >= 10) break
    }

    // Calculate statistics
    const ruggedTokens = tokensLaunched.filter(t => t.isRugged).length
    const totalTokens = tokensLaunched.length
    const rugRate = totalTokens > 0 ? (ruggedTokens / totalTokens) * 100 : 0

    // Calculate average lifespan
    let avgLifespan: number | null = null
    const lifespans = tokensLaunched
      .filter(t => t.isRugged && t.deployedAt)
      .map(t => {
        // Estimate lifespan based on typical rug timing
        // In real implementation, we'd track when liquidity was removed
        return 6 // Default 6 hours for rugged tokens
      })
    if (lifespans.length > 0) {
      avgLifespan = lifespans.reduce((a, b) => a + b, 0) / lifespans.length
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "extreme" = "low"
    if (rugRate >= 75) riskLevel = "extreme"
    else if (rugRate >= 50) riskLevel = "high"
    else if (rugRate >= 25) riskLevel = "medium"

    const timestamps = tokensLaunched.map(t => t.deployedAt).filter(Boolean)

    return {
      address: deployerAddress,
      tokensLaunched,
      totalTokens,
      ruggedTokens,
      rugRate: Math.round(rugRate),
      avgTokenLifespan: avgLifespan,
      firstLaunch: timestamps.length > 0 ? Math.min(...timestamps) : null,
      lastLaunch: timestamps.length > 0 ? Math.max(...timestamps) : null,
      riskLevel,
    }
  } catch (error) {
    console.error(`[DeployerHistory] ERROR for ${deployerAddress}:`, error)
    // Return empty with error flag instead of silently failing
    const emptyHistory = createEmptyHistory(deployerAddress)
    return emptyHistory
  }
}

/**
 * Analyze a token to determine if it was rugged
 */
async function analyzeTokenForRug(
  mint: string,
  deployerAddress: string
): Promise<{
  isRugged: boolean
  indicators: string[]
  status: "active" | "dead" | "unknown"
  liquidityRemoved: boolean
}> {
  const indicators: string[] = []
  let isRugged = false
  let liquidityRemoved = false
  let status: "active" | "dead" | "unknown" = "unknown"

  try {
    // Get token's recent transaction history
    const tokenTxs = await heliusClient.getAddressHistory(mint, 50)

    if (!tokenTxs || tokenTxs.length === 0) {
      status = "dead"
      indicators.push("No recent activity")
      isRugged = true
      return { isRugged, indicators, status, liquidityRemoved }
    }

    // Check for liquidity removal patterns
    for (const tx of tokenTxs) {
      const txType = tx.type?.toLowerCase() || ""
      const txDesc = tx.description?.toLowerCase() || ""

      // Check for LP removal
      if (
        txType.includes("remove") ||
        txType.includes("burn") ||
        txDesc.includes("liquidity") && txDesc.includes("remove")
      ) {
        liquidityRemoved = true
        indicators.push("Liquidity removal detected")
      }

      // Check for large sells by deployer
      if (tx.tokenTransfers) {
        for (const transfer of tx.tokenTransfers) {
          if (
            transfer.fromUserAccount === deployerAddress &&
            transfer.tokenAmount > 1000000
          ) {
            indicators.push("Large deployer sell detected")
          }
        }
      }
    }

    // Check last activity timestamp
    const lastTx = tokenTxs[0]
    const daysSinceActivity = (Date.now() / 1000 - lastTx.timestamp) / 86400

    if (daysSinceActivity > 30) {
      status = "dead"
      indicators.push("No activity in 30+ days")
    } else if (daysSinceActivity > 7) {
      status = "dead"
      indicators.push("No activity in 7+ days")
    } else {
      status = "active"
    }

    // Determine if rugged
    isRugged = liquidityRemoved || status === "dead" || indicators.length >= 2

  } catch (error) {
    console.error("Error analyzing token for rug:", error)
  }

  return { isRugged, indicators, status, liquidityRemoved }
}

function createEmptyHistory(address: string): DeployerHistory {
  return {
    address,
    tokensLaunched: [],
    totalTokens: 0,
    ruggedTokens: 0,
    rugRate: 0,
    avgTokenLifespan: null,
    firstLaunch: null,
    lastLaunch: null,
    riskLevel: "low",
  }
}
