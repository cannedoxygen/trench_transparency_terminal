import { heliusClient } from "@/lib/helius/client"

export interface TokenHolder {
  address: string
  balance: number
  percentage: number
  isDeployer: boolean
  isSniper: boolean
  isInsider: boolean
  boughtAt: number | null
  boughtBlock: number | null
  identity: {
    name: string | null
    tags: string[]
    isExchange: boolean
  } | null
  riskFlags: string[]
}

export interface HolderAnalysis {
  mint: string
  totalHolders: number
  topHolders: TokenHolder[]
  sniperCount: number
  insiderCount: number
  deployerHolding: number // percentage
  top10Concentration: number // percentage
  exchangeHoldings: number // percentage
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

/**
 * Analyze token holders for suspicious patterns
 */
export async function analyzeHolders(
  mint: string,
  deployerAddress: string | null
): Promise<HolderAnalysis> {
  const warnings: string[] = []
  const topHolders: TokenHolder[] = []

  // Get token accounts (holders) and token metadata in parallel
  const [tokenAccountsResult, tokenAsset] = await Promise.all([
    heliusClient.getTokenAccounts(mint, 10), // Fetch up to 10 pages (10k holders)
    heliusClient.getAsset(mint),
  ])

  const { holders: tokenAccounts, totalHolders: apiTotalHolders } = tokenAccountsResult

  console.log(`[Holders] Fetched ${tokenAccounts.length} holders (API total: ${apiTotalHolders})`)

  if (!tokenAccounts || tokenAccounts.length === 0) {
    console.log(`[Holders] No token accounts found for ${mint}`)
    return createEmptyAnalysis(mint)
  }

  // Holders are already sorted by the client
  const sortedHolders = tokenAccounts.slice(0, 20) // Top 20 holders

  // Get total supply from token metadata
  let totalSupply = 0
  const decimals = tokenAsset?.token_info?.decimals || 9

  if (tokenAsset?.token_info?.supply) {
    totalSupply = Number(tokenAsset.token_info.supply)
    console.log(`[Holders] Token supply: ${totalSupply} (decimals: ${decimals})`)
  } else {
    // Fallback: sum all fetched holders
    totalSupply = tokenAccounts.reduce((sum, h) => sum + h.amount, 0)
    console.log(`[Holders] No supply in metadata, using sum: ${totalSupply}`)
  }

  // Debug: log top holders with percentages
  console.log(`[Holders] Top 5 holders:`)
  for (let i = 0; i < Math.min(5, sortedHolders.length); i++) {
    const h = sortedHolders[i]
    const pct = totalSupply > 0 ? ((h.amount / totalSupply) * 100).toFixed(4) : '0'
    console.log(`  ${i + 1}. ${h.address.slice(0, 8)}... amount=${h.amount} (${pct}%)`)
  }

    // Get token's first transactions to detect snipers
    const tokenTxHistory = await heliusClient.getAddressHistory(mint, 100)
    const earlyBuyers = new Set<string>()
    const buyTimestamps = new Map<string, number>()

    if (tokenTxHistory && tokenTxHistory.length > 0) {
      // Sort by timestamp to find earliest
      const sortedTxs = [...tokenTxHistory].sort((a, b) => a.timestamp - b.timestamp)
      const firstTxTime = sortedTxs[0]?.timestamp || 0

      // First 10 transactions are considered "snipers"
      for (let i = 0; i < Math.min(10, sortedTxs.length); i++) {
        const tx = sortedTxs[i]
        if (tx.tokenTransfers) {
          for (const transfer of tx.tokenTransfers) {
            if (transfer.toUserAccount && transfer.mint === mint) {
              earlyBuyers.add(transfer.toUserAccount)
              if (!buyTimestamps.has(transfer.toUserAccount)) {
                buyTimestamps.set(transfer.toUserAccount, tx.timestamp)
              }
            }
          }
        }
      }
    }

    // Get identities for top holders
    const holderAddresses = sortedHolders.map(h => h.address)
    const identities = await heliusClient.batchGetIdentities(holderAddresses)

    // Build holder profiles
    for (const holder of sortedHolders) {
      const percentage = totalSupply > 0 ? (holder.amount / totalSupply) * 100 : 0
      const identity = identities.get(holder.address)
      const isDeployer = holder.address === deployerAddress
      const isSniper = earlyBuyers.has(holder.address)
      const boughtAt = buyTimestamps.get(holder.address) || null

      const riskFlags: string[] = []

      // Flag checks
      if (isSniper && percentage > 5) {
        riskFlags.push("Early sniper with large position")
      }
      if (isDeployer && percentage > 10) {
        riskFlags.push("Deployer holding significant supply")
      }
      if (percentage > 20) {
        riskFlags.push("Whale concentration risk")
      }

      // Check for insider patterns
      let isInsider = false
      if (isSniper || isDeployer) {
        isInsider = true
      }
      // Check if funded by same source as deployer (would need additional API call)

      topHolders.push({
        address: holder.address,
        balance: holder.amount,
        percentage: Math.round(percentage * 100) / 100,
        isDeployer,
        isSniper,
        isInsider,
        boughtAt,
        boughtBlock: null,
        identity: identity ? {
          name: identity.name || null,
          tags: identity.tags || [],
          isExchange: identity.category?.toLowerCase().includes("exchange") || false,
        } : null,
        riskFlags,
      })
    }

    // Calculate metrics
    const sniperCount = topHolders.filter(h => h.isSniper).length
    const insiderCount = topHolders.filter(h => h.isInsider).length
    const deployerHolding = topHolders.find(h => h.isDeployer)?.percentage || 0
    const top10Concentration = topHolders
      .slice(0, 10)
      .reduce((sum, h) => sum + h.percentage, 0)
    const exchangeHoldings = topHolders
      .filter(h => h.identity?.isExchange)
      .reduce((sum, h) => sum + h.percentage, 0)

    // Generate warnings
    if (top10Concentration > 80) {
      warnings.push(`Top 10 holders control ${Math.round(top10Concentration)}% of supply`)
    }
    if (sniperCount >= 5) {
      warnings.push(`${sniperCount} sniper wallets detected in top holders`)
    }
    if (deployerHolding > 20) {
      warnings.push(`Deployer still holds ${Math.round(deployerHolding)}% of supply`)
    }
    if (insiderCount >= 3) {
      warnings.push(`${insiderCount} likely insider wallets detected`)
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "extreme" = "low"
    if (top10Concentration > 90 || sniperCount >= 7 || deployerHolding > 50) {
      riskLevel = "extreme"
    } else if (top10Concentration > 80 || sniperCount >= 5 || deployerHolding > 30) {
      riskLevel = "high"
    } else if (top10Concentration > 60 || sniperCount >= 3 || deployerHolding > 15) {
      riskLevel = "medium"
    }

    return {
      mint,
      totalHolders: apiTotalHolders || tokenAccounts.length,
      topHolders,
      sniperCount,
      insiderCount,
      deployerHolding: Math.round(deployerHolding * 100) / 100,
      top10Concentration: Math.round(top10Concentration * 100) / 100,
      exchangeHoldings: Math.round(exchangeHoldings * 100) / 100,
      riskLevel,
      warnings,
    }
}

function createEmptyAnalysis(mint: string): HolderAnalysis {
  return {
    mint,
    totalHolders: 0,
    topHolders: [],
    sniperCount: 0,
    insiderCount: 0,
    deployerHolding: 0,
    top10Concentration: 0,
    exchangeHoldings: 0,
    riskLevel: "low",
    warnings: ["Unable to analyze holders"],
  }
}
