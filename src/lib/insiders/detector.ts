import { heliusClient } from "@/lib/helius/client"

export interface InsiderWallet {
  address: string
  holding: number  // percentage of supply
  buyTimestamp: number | null
  fundingSource: string | null
  clusterId: number
  clusterRole: "leader" | "member"
  riskFlags: string[]
  identity: {
    name: string | null
    isExchange: boolean
  } | null
}

export interface InsiderCluster {
  id: number
  name: string  // e.g., "Cluster A", "Same Funder Group"
  type: "same_funder" | "coordinated_buy" | "fund_network" | "mixed"
  wallets: InsiderWallet[]
  totalHolding: number  // Combined percentage of supply
  commonFunder: string | null
  avgBuyTime: number | null
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

export interface InsiderAnalysis {
  tokenMint: string
  totalInsiders: number
  totalInsiderHolding: number
  clusters: InsiderCluster[]
  coordinationScore: number  // 0-100 how coordinated insiders appear
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

interface HolderData {
  address: string
  amount: number
  percentage: number
  buyTimestamp: number | null
  fundingSource: string | null
}

/**
 * Detect insider clusters for a token
 */
export async function detectInsiderClusters(
  tokenMint: string,
  topHolders: Array<{ address: string; percentage: number }>,
  deployerAddress: string | null
): Promise<InsiderAnalysis> {
  console.log(`[InsiderDetection] Analyzing ${topHolders.length} holders for ${tokenMint.slice(0, 8)}...`)

  const warnings: string[] = []
  const clusters: InsiderCluster[] = []

  // Filter out known addresses (exchanges, deployer)
  const holdersToAnalyze = topHolders.filter(h =>
    h.address !== deployerAddress &&
    h.percentage > 0.1  // Only analyze holders with > 0.1%
  ).slice(0, 30)  // Analyze top 30

  if (holdersToAnalyze.length < 3) {
    return createEmptyAnalysis(tokenMint)
  }

  try {
    // Step 1: Get funding sources for all holders
    console.log(`[InsiderDetection] Fetching funding sources...`)
    const holderData: HolderData[] = []

    for (const holder of holdersToAnalyze) {
      try {
        const fundedBy = await heliusClient.getWalletFundedBy(holder.address)
        holderData.push({
          address: holder.address,
          amount: 0,
          percentage: holder.percentage,
          buyTimestamp: null,  // Would need transaction analysis
          fundingSource: fundedBy?.funder || null,
        })
      } catch {
        holderData.push({
          address: holder.address,
          amount: 0,
          percentage: holder.percentage,
          buyTimestamp: null,
          fundingSource: null,
        })
      }
    }

    // Step 2: Identify clusters by same funding source
    const funderGroups = new Map<string, HolderData[]>()

    for (const holder of holderData) {
      if (holder.fundingSource) {
        const existing = funderGroups.get(holder.fundingSource) || []
        existing.push(holder)
        funderGroups.set(holder.fundingSource, existing)
      }
    }

    let clusterId = 0

    // Create clusters for groups with 2+ wallets from same funder
    for (const [funder, members] of Array.from(funderGroups.entries())) {
      if (members.length >= 2) {
        const totalHolding = members.reduce((sum, m) => sum + m.percentage, 0)

        // Get funder identity
        let funderIdentity = null
        try {
          funderIdentity = await heliusClient.getWalletIdentity(funder)
        } catch {
          // Ignore
        }

        const clusterWarnings: string[] = []

        if (members.length >= 4) {
          clusterWarnings.push(`${members.length} wallets funded from same source`)
        }
        if (totalHolding > 10) {
          clusterWarnings.push(`Cluster controls ${totalHolding.toFixed(1)}% of supply`)
        }

        const wallets: InsiderWallet[] = members.map((m, idx) => ({
          address: m.address,
          holding: m.percentage,
          buyTimestamp: m.buyTimestamp,
          fundingSource: m.fundingSource,
          clusterId,
          clusterRole: idx === 0 ? "leader" : "member",
          riskFlags: m.percentage > 5 ? ["Large holder"] : [],
          identity: null,
        }))

        // Determine risk level for cluster
        let clusterRisk: InsiderCluster["riskLevel"] = "low"
        if (totalHolding > 20 || members.length >= 5) clusterRisk = "extreme"
        else if (totalHolding > 10 || members.length >= 4) clusterRisk = "high"
        else if (totalHolding > 5 || members.length >= 3) clusterRisk = "medium"

        clusters.push({
          id: clusterId,
          name: funderIdentity?.name ? `${funderIdentity.name} Network` : `Cluster ${String.fromCharCode(65 + clusterId)}`,
          type: "same_funder",
          wallets,
          totalHolding,
          commonFunder: funder,
          avgBuyTime: null,
          riskLevel: clusterRisk,
          warnings: clusterWarnings,
        })

        clusterId++
      }
    }

    // Step 3: Look for deployer-funded wallets
    if (deployerAddress) {
      const deployerFundedWallets = holderData.filter(
        h => h.fundingSource === deployerAddress
      )

      if (deployerFundedWallets.length >= 1) {
        const totalHolding = deployerFundedWallets.reduce((sum, m) => sum + m.percentage, 0)

        const wallets: InsiderWallet[] = deployerFundedWallets.map((m, idx) => ({
          address: m.address,
          holding: m.percentage,
          buyTimestamp: m.buyTimestamp,
          fundingSource: m.fundingSource,
          clusterId,
          clusterRole: idx === 0 ? "leader" : "member",
          riskFlags: ["Funded by deployer"],
          identity: null,
        }))

        clusters.push({
          id: clusterId,
          name: "Deployer-Funded Wallets",
          type: "fund_network",
          wallets,
          totalHolding,
          commonFunder: deployerAddress,
          avgBuyTime: null,
          riskLevel: "extreme",
          warnings: [
            `${deployerFundedWallets.length} holder(s) funded directly by deployer`,
            `Combined holding: ${totalHolding.toFixed(1)}%`
          ],
        })

        warnings.push(`Deployer funded ${deployerFundedWallets.length} top holder(s)`)
        clusterId++
      }
    }

    // Step 4: Calculate overall metrics
    const totalInsiders = clusters.reduce((sum, c) => sum + c.wallets.length, 0)
    const totalInsiderHolding = clusters.reduce((sum, c) => sum + c.totalHolding, 0)

    // Calculate coordination score (0-100)
    let coordinationScore = 0
    if (clusters.length > 0) {
      coordinationScore = Math.min(100,
        (clusters.length * 15) +
        (totalInsiders * 5) +
        (totalInsiderHolding * 2)
      )
    }

    // Generate warnings
    if (totalInsiderHolding > 30) {
      warnings.push(`Insider clusters control ${totalInsiderHolding.toFixed(1)}% of supply`)
    }
    if (clusters.length >= 3) {
      warnings.push(`${clusters.length} distinct insider clusters detected`)
    }
    if (clusters.some(c => c.type === "same_funder" && c.wallets.length >= 4)) {
      warnings.push("Large coordinated wallet group detected")
    }

    // Calculate overall risk
    let riskLevel: InsiderAnalysis["riskLevel"] = "low"
    if (coordinationScore > 60 || totalInsiderHolding > 25) riskLevel = "extreme"
    else if (coordinationScore > 40 || totalInsiderHolding > 15) riskLevel = "high"
    else if (coordinationScore > 20 || totalInsiderHolding > 8) riskLevel = "medium"

    console.log(`[InsiderDetection] Found ${clusters.length} clusters, ${totalInsiders} insiders, ${totalInsiderHolding.toFixed(1)}% holding`)

    return {
      tokenMint,
      totalInsiders,
      totalInsiderHolding,
      clusters,
      coordinationScore,
      riskLevel,
      warnings,
    }
  } catch (error) {
    console.error("[InsiderDetection] Error:", error)
    return createEmptyAnalysis(tokenMint)
  }
}

function createEmptyAnalysis(tokenMint: string): InsiderAnalysis {
  return {
    tokenMint,
    totalInsiders: 0,
    totalInsiderHolding: 0,
    clusters: [],
    coordinationScore: 0,
    riskLevel: "low",
    warnings: [],
  }
}
