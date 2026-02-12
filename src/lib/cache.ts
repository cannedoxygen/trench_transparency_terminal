import { Redis } from "@upstash/redis"
import { AnalysisReport, DeployerInfo } from "@/types"

// TTL values in seconds
const TTL = {
  REPORT: 6 * 60 * 60, // 6 hours
  DEPLOYER: 24 * 60 * 60, // 24 hours
  WALLET: 6 * 60 * 60, // 6 hours
}

// Cache key prefixes
const KEYS = {
  REPORT: "report:",
  DEPLOYER: "deployer:",
  WALLET: "wallet:",
}

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn("Redis credentials not configured, caching disabled")
    return null
  }

  try {
    redis = new Redis({ url, token })
    return redis
  } catch (error) {
    console.error("Failed to initialize Redis:", error)
    return null
  }
}

export async function getCachedReport(
  mint: string
): Promise<AnalysisReport | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const cached = await client.get<AnalysisReport>(`${KEYS.REPORT}${mint}`)
    return cached
  } catch (error) {
    console.error("Cache read error:", error)
    return null
  }
}

export async function cacheReport(
  mint: string,
  report: AnalysisReport
): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.set(`${KEYS.REPORT}${mint}`, report, { ex: TTL.REPORT })
  } catch (error) {
    console.error("Cache write error:", error)
  }
}

export async function getCachedDeployer(
  mint: string
): Promise<DeployerInfo | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const cached = await client.get<DeployerInfo>(`${KEYS.DEPLOYER}${mint}`)
    return cached
  } catch (error) {
    console.error("Cache read error:", error)
    return null
  }
}

export async function cacheDeployer(
  mint: string,
  deployer: DeployerInfo
): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.set(`${KEYS.DEPLOYER}${mint}`, deployer, { ex: TTL.DEPLOYER })
  } catch (error) {
    console.error("Cache write error:", error)
  }
}

export interface WalletIntelligence {
  tags: string[]
  label: string | null
  firstTxTimestamp: number | null
  transactionCount: number
  fundedBy: {
    address: string | null
    type: string | null
    timestamp: number | null
  }
}

export async function getCachedWallet(
  address: string
): Promise<WalletIntelligence | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const cached = await client.get<WalletIntelligence>(
      `${KEYS.WALLET}${address}`
    )
    return cached
  } catch (error) {
    console.error("Cache read error:", error)
    return null
  }
}

export async function cacheWallet(
  address: string,
  intel: WalletIntelligence
): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.set(`${KEYS.WALLET}${address}`, intel, { ex: TTL.WALLET })
  } catch (error) {
    console.error("Cache write error:", error)
  }
}

export async function invalidateReport(mint: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.del(`${KEYS.REPORT}${mint}`)
  } catch (error) {
    console.error("Cache invalidate error:", error)
  }
}
