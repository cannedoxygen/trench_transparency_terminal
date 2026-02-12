import { heliusClient } from "@/lib/helius/client"

// Known KOL/Influencer wallets (this would be a database in production)
// Note: These are placeholder examples - in production you'd maintain a real database
const KNOWN_KOLS: Record<string, KOLProfile> = {
  // Example format - these would be real addresses in production
  // "WalletAddress123...": { name: "CryptoInfluencer", platform: "twitter", followers: 500000, risk: "low" }
}

export interface KOLProfile {
  name: string
  platform: "twitter" | "youtube" | "telegram" | "discord" | "unknown"
  followers: number | null
  risk: "low" | "medium" | "high"  // Risk of being a paid promoter
  verified: boolean
}

export interface KOLConnection {
  address: string
  profile: KOLProfile
  relationship: "holder" | "early_buyer" | "funder" | "funded_by_deployer"
  holdingPercentage: number | null
  significance: "high" | "medium" | "low"
}

export interface KOLAnalysis {
  tokenMint: string
  kolCount: number
  connections: KOLConnection[]
  warnings: string[]
  positives: string[]
  riskLevel: "low" | "medium" | "high"
  summary: string
}

/**
 * Detect KOL/Influencer connections to a token
 */
export async function detectKOLConnections(
  tokenMint: string,
  topHolders: Array<{ address: string; percentage: number }>,
  deployerAddress: string | null,
  fundingChain: string[]
): Promise<KOLAnalysis> {
  console.log(`[KOL] Detecting influencer connections for ${tokenMint.slice(0, 8)}...`)

  const connections: KOLConnection[] = []
  const warnings: string[] = []
  const positives: string[] = []

  // Check top holders for known KOLs
  for (const holder of topHolders) {
    const kol = KNOWN_KOLS[holder.address]
    if (kol) {
      connections.push({
        address: holder.address,
        profile: kol,
        relationship: "holder",
        holdingPercentage: holder.percentage,
        significance: holder.percentage > 5 ? "high" : holder.percentage > 1 ? "medium" : "low",
      })
    }
  }

  // Check funding chain for known KOLs
  for (const funder of fundingChain) {
    const kol = KNOWN_KOLS[funder]
    if (kol) {
      connections.push({
        address: funder,
        profile: kol,
        relationship: "funder",
        holdingPercentage: null,
        significance: "high",
      })
    }
  }

  // Use Helius identity API to find known entities that might be KOLs
  const addressesToCheck = [
    ...topHolders.slice(0, 20).map(h => h.address),
    ...fundingChain,
  ]

  try {
    const identities = await heliusClient.batchGetIdentities(addressesToCheck)

    for (const [address, identity] of Array.from(identities.entries())) {
      if (!identity?.name) continue

      // Check if identity suggests influencer/KOL
      const name = identity.name.toLowerCase()
      const tags = identity.tags?.map(t => t.toLowerCase()) || []

      const isLikelyKOL =
        tags.some(t => t.includes("influencer") || t.includes("kol") || t.includes("creator")) ||
        name.includes("influencer") ||
        identity.category?.toLowerCase().includes("influencer")

      if (isLikelyKOL) {
        const holder = topHolders.find(h => h.address === address)

        connections.push({
          address,
          profile: {
            name: identity.name,
            platform: "unknown",
            followers: null,
            risk: "medium",
            verified: false,
          },
          relationship: holder ? "holder" : "funder",
          holdingPercentage: holder?.percentage || null,
          significance: "medium",
        })
      }
    }
  } catch (error) {
    console.error("[KOL] Error checking identities:", error)
  }

  // Generate warnings and positives
  if (connections.length > 0) {
    const highSigConnections = connections.filter(c => c.significance === "high")

    if (highSigConnections.length > 0) {
      warnings.push(`${highSigConnections.length} significant influencer connection(s) detected`)
    }

    const fundingKOLs = connections.filter(c => c.relationship === "funder")
    if (fundingKOLs.length > 0) {
      warnings.push("Token funded by or connected to influencer wallets")
    }

    const holderKOLs = connections.filter(c => c.relationship === "holder")
    if (holderKOLs.length > 0 && holderKOLs.some(k => k.profile.risk === "low")) {
      positives.push("Reputable influencers are holding")
    }
  }

  // Calculate risk level
  let riskLevel: KOLAnalysis["riskLevel"] = "low"
  const highRiskKOLs = connections.filter(c => c.profile.risk === "high")
  const fundingConnections = connections.filter(c => c.relationship === "funder" || c.relationship === "funded_by_deployer")

  if (highRiskKOLs.length > 0 || fundingConnections.length > 0) {
    riskLevel = "high"
  } else if (connections.length > 2) {
    riskLevel = "medium"
  }

  // Generate summary
  let summary = ""
  if (connections.length === 0) {
    summary = "No known influencer connections detected among holders or funding chain."
  } else if (riskLevel === "high") {
    summary = `Detected ${connections.length} influencer connection(s). Some may indicate coordinated promotion.`
  } else {
    summary = `Found ${connections.length} potential influencer connection(s). Monitor for coordinated activity.`
  }

  console.log(`[KOL] Found ${connections.length} KOL connections`)

  return {
    tokenMint,
    kolCount: connections.length,
    connections,
    warnings,
    positives,
    riskLevel,
    summary,
  }
}

/**
 * Add a KOL to the known list (would be API call in production)
 */
export function addKnownKOL(address: string, profile: KOLProfile): void {
  KNOWN_KOLS[address] = profile
}

/**
 * Check if an address is a known KOL
 */
export function isKnownKOL(address: string): KOLProfile | null {
  return KNOWN_KOLS[address] || null
}
