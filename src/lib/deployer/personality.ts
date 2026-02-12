import { heliusClient } from "@/lib/helius/client"
import { getDeployerHistory } from "./history"

export interface TimingPattern {
  avgDaysBetweenLaunches: number | null
  preferredDayOfWeek: string | null  // e.g., "Monday", "Weekend"
  preferredTimeOfDay: string | null  // e.g., "Morning", "Night"
  launchFrequency: "rapid" | "regular" | "occasional" | "rare" | "unknown"
}

export interface LiquidityPattern {
  typicalLiquidityRemovalSpeed: "immediate" | "fast" | "gradual" | "holds" | "unknown"
  avgTimeToFirstSell: number | null  // seconds
  sellPatternDescription: string | null
}

export interface NamingPattern {
  usesMemeCoinNames: boolean
  usesTrendyKeywords: boolean
  commonThemes: string[]
  namingStyle: "meme" | "professional" | "generic" | "trendy" | "mixed"
}

export interface BehaviorMetrics {
  avgTokenLifespanDays: number | null
  longestSurvivingToken: { name: string; days: number } | null
  shortestLivedToken: { name: string; days: number } | null
  percentTokensDead: number
  totalValueExtracted: number | null  // estimated SOL
}

export interface DeployerPersonality {
  deployerAddress: string
  profileType: "serial_rugger" | "pump_and_dumper" | "legitimate" | "unknown" | "new_deployer"
  confidence: "high" | "medium" | "low"

  // Behavioral patterns
  timing: TimingPattern
  liquidity: LiquidityPattern
  naming: NamingPattern
  behavior: BehaviorMetrics

  // Summary
  riskIndicators: string[]
  positiveIndicators: string[]
  personalitySummary: string

  // Risk assessment
  riskLevel: "low" | "medium" | "high" | "extreme"
}

// Meme/trendy keywords to detect naming patterns
const MEME_KEYWORDS = [
  "doge", "shib", "pepe", "wojak", "moon", "elon", "inu", "floki",
  "baby", "safe", "rocket", "mars", "chad", "based", "cope", "seethe",
  "wagmi", "gm", "fren", "anon", "ape", "pump", "bonk", "cat", "dog"
]

const TRENDY_KEYWORDS = [
  "ai", "gpt", "trump", "biden", "maga", "wif", "hat", "meta",
  "nft", "sol", "eth", "btc", "defi", "yield", "stake"
]

/**
 * Build a personality profile for a deployer based on their history
 */
export async function buildDeployerPersonality(
  deployerAddress: string
): Promise<DeployerPersonality> {
  console.log(`[Personality] Building profile for ${deployerAddress.slice(0, 8)}...`)

  try {
    // Get deployer's token history
    const history = await getDeployerHistory(deployerAddress)

    if (!history || history.totalTokens === 0) {
      return createNewDeployerProfile(deployerAddress)
    }

    // Analyze timing patterns
    const timing = analyzeTimingPatterns(history.tokensLaunched)

    // Analyze liquidity patterns
    const liquidity = analyzeLiquidityPatterns(history.tokensLaunched)

    // Analyze naming patterns
    const naming = analyzeNamingPatterns(history.tokensLaunched)

    // Calculate behavior metrics
    const behavior = calculateBehaviorMetrics(history.tokensLaunched)

    // Determine profile type and risk indicators
    const { profileType, riskIndicators, positiveIndicators, confidence } =
      determineProfileType(history, timing, liquidity, naming, behavior)

    // Generate personality summary
    const personalitySummary = generatePersonalitySummary(
      profileType, history, timing, liquidity, behavior
    )

    // Calculate overall risk level
    const riskLevel = calculateRiskLevel(
      history.rugRate, riskIndicators.length, positiveIndicators.length, profileType
    )

    console.log(`[Personality] Profile: ${profileType}, Risk: ${riskLevel}`)

    return {
      deployerAddress,
      profileType,
      confidence,
      timing,
      liquidity,
      naming,
      behavior,
      riskIndicators,
      positiveIndicators,
      personalitySummary,
      riskLevel,
    }
  } catch (error) {
    console.error("[Personality] Error:", error)
    return createNewDeployerProfile(deployerAddress)
  }
}

function analyzeTimingPatterns(tokens: Array<{
  deployedAt: number
  name: string | null
}>): TimingPattern {
  if (tokens.length < 2) {
    return {
      avgDaysBetweenLaunches: null,
      preferredDayOfWeek: null,
      preferredTimeOfDay: null,
      launchFrequency: "unknown",
    }
  }

  // Sort by deployment time
  const sorted = [...tokens].sort((a, b) => a.deployedAt - b.deployedAt)

  // Calculate gaps between launches
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const gapDays = (sorted[i].deployedAt - sorted[i - 1].deployedAt) / 86400
    gaps.push(gapDays)
  }

  const avgDaysBetweenLaunches = gaps.length > 0
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length
    : null

  // Analyze day of week preference
  const dayCount: Record<string, number> = {}
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  for (const token of tokens) {
    const date = new Date(token.deployedAt * 1000)
    const day = days[date.getUTCDay()]
    dayCount[day] = (dayCount[day] || 0) + 1
  }

  const maxDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]
  const preferredDayOfWeek = maxDay && maxDay[1] >= tokens.length * 0.3
    ? maxDay[0]
    : null

  // Analyze time of day preference
  const timeSlots = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }
  for (const token of tokens) {
    const hour = new Date(token.deployedAt * 1000).getUTCHours()
    if (hour >= 5 && hour < 12) timeSlots.Morning++
    else if (hour >= 12 && hour < 17) timeSlots.Afternoon++
    else if (hour >= 17 && hour < 21) timeSlots.Evening++
    else timeSlots.Night++
  }

  const maxTime = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0]
  const preferredTimeOfDay = maxTime && maxTime[1] >= tokens.length * 0.4
    ? maxTime[0]
    : null

  // Determine launch frequency
  let launchFrequency: TimingPattern["launchFrequency"] = "unknown"
  if (avgDaysBetweenLaunches !== null) {
    if (avgDaysBetweenLaunches < 1) launchFrequency = "rapid"
    else if (avgDaysBetweenLaunches < 7) launchFrequency = "regular"
    else if (avgDaysBetweenLaunches < 30) launchFrequency = "occasional"
    else launchFrequency = "rare"
  }

  return {
    avgDaysBetweenLaunches,
    preferredDayOfWeek,
    preferredTimeOfDay,
    launchFrequency,
  }
}

function analyzeLiquidityPatterns(tokens: Array<{
  rugIndicators: string[]
  currentStatus: "active" | "dead" | "unknown"
}>): LiquidityPattern {
  // Analyze rug indicators for liquidity patterns
  let quickRugs = 0
  let gradualSells = 0
  let holds = 0

  for (const token of tokens) {
    const indicators = token.rugIndicators.map(i => i.toLowerCase())

    if (indicators.some(i => i.includes("immediate") || i.includes("instant"))) {
      quickRugs++
    } else if (indicators.some(i => i.includes("gradual") || i.includes("slow"))) {
      gradualSells++
    } else if (token.currentStatus === "active") {
      holds++
    }
  }

  const total = tokens.length || 1

  let typicalLiquidityRemovalSpeed: LiquidityPattern["typicalLiquidityRemovalSpeed"] = "unknown"
  if (quickRugs / total > 0.5) typicalLiquidityRemovalSpeed = "immediate"
  else if ((quickRugs + gradualSells) / total > 0.5) typicalLiquidityRemovalSpeed = "fast"
  else if (gradualSells / total > 0.3) typicalLiquidityRemovalSpeed = "gradual"
  else if (holds / total > 0.5) typicalLiquidityRemovalSpeed = "holds"

  let sellPatternDescription: string | null = null
  if (typicalLiquidityRemovalSpeed === "immediate") {
    sellPatternDescription = "Typically removes liquidity within hours of launch"
  } else if (typicalLiquidityRemovalSpeed === "fast") {
    sellPatternDescription = "Usually exits positions within 1-2 days"
  } else if (typicalLiquidityRemovalSpeed === "gradual") {
    sellPatternDescription = "Tends to sell gradually over multiple days"
  } else if (typicalLiquidityRemovalSpeed === "holds") {
    sellPatternDescription = "Often maintains positions for extended periods"
  }

  return {
    typicalLiquidityRemovalSpeed,
    avgTimeToFirstSell: null, // Would need more detailed tx analysis
    sellPatternDescription,
  }
}

function analyzeNamingPatterns(tokens: Array<{
  name: string | null
  symbol: string | null
}>): NamingPattern {
  const names = tokens
    .map(t => (t.name || t.symbol || "").toLowerCase())
    .filter(n => n.length > 0)

  if (names.length === 0) {
    return {
      usesMemeCoinNames: false,
      usesTrendyKeywords: false,
      commonThemes: [],
      namingStyle: "generic",
    }
  }

  let memeCount = 0
  let trendyCount = 0
  const themes: Record<string, number> = {}

  for (const name of names) {
    let hasMeme = false
    let hasTrendy = false

    for (const keyword of MEME_KEYWORDS) {
      if (name.includes(keyword)) {
        hasMeme = true
        themes[keyword] = (themes[keyword] || 0) + 1
      }
    }

    for (const keyword of TRENDY_KEYWORDS) {
      if (name.includes(keyword)) {
        hasTrendy = true
        themes[keyword] = (themes[keyword] || 0) + 1
      }
    }

    if (hasMeme) memeCount++
    if (hasTrendy) trendyCount++
  }

  const usesMemeCoinNames = memeCount / names.length > 0.3
  const usesTrendyKeywords = trendyCount / names.length > 0.3

  // Get top themes
  const commonThemes = Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme)

  // Determine naming style
  let namingStyle: NamingPattern["namingStyle"] = "generic"
  if (usesMemeCoinNames && usesTrendyKeywords) namingStyle = "mixed"
  else if (usesMemeCoinNames) namingStyle = "meme"
  else if (usesTrendyKeywords) namingStyle = "trendy"
  else if (names.some(n => n.length > 15 || /[A-Z]/.test(n))) namingStyle = "professional"

  return {
    usesMemeCoinNames,
    usesTrendyKeywords,
    commonThemes,
    namingStyle,
  }
}

function calculateBehaviorMetrics(tokens: Array<{
  name: string | null
  deployedAt: number
  currentStatus: "active" | "dead" | "unknown"
}>): BehaviorMetrics {
  if (tokens.length === 0) {
    return {
      avgTokenLifespanDays: null,
      longestSurvivingToken: null,
      shortestLivedToken: null,
      percentTokensDead: 0,
      totalValueExtracted: null,
    }
  }

  const now = Date.now() / 1000
  const lifespans: Array<{ name: string; days: number }> = []

  for (const token of tokens) {
    const ageDays = (now - token.deployedAt) / 86400
    lifespans.push({
      name: token.name || "Unknown",
      days: ageDays,
    })
  }

  const sorted = [...lifespans].sort((a, b) => b.days - a.days)

  const avgTokenLifespanDays = lifespans.reduce((sum, t) => sum + t.days, 0) / lifespans.length

  const deadTokens = tokens.filter(t => t.currentStatus === "dead").length
  const percentTokensDead = (deadTokens / tokens.length) * 100

  return {
    avgTokenLifespanDays,
    longestSurvivingToken: sorted[0] || null,
    shortestLivedToken: sorted[sorted.length - 1] || null,
    percentTokensDead,
    totalValueExtracted: null, // Would need detailed analysis
  }
}

function determineProfileType(
  history: { totalTokens: number; rugRate: number; ruggedTokens: number },
  timing: TimingPattern,
  liquidity: LiquidityPattern,
  naming: NamingPattern,
  behavior: BehaviorMetrics
): {
  profileType: DeployerPersonality["profileType"]
  riskIndicators: string[]
  positiveIndicators: string[]
  confidence: "high" | "medium" | "low"
} {
  const riskIndicators: string[] = []
  const positiveIndicators: string[] = []

  // High rug rate
  if (history.rugRate > 70) {
    riskIndicators.push(`${history.rugRate}% of tokens have rug indicators`)
  } else if (history.rugRate < 20 && history.totalTokens >= 3) {
    positiveIndicators.push("Low historical rug rate")
  }

  // Rapid launching
  if (timing.launchFrequency === "rapid") {
    riskIndicators.push("Launches tokens in rapid succession")
  }

  // Quick liquidity removal
  if (liquidity.typicalLiquidityRemovalSpeed === "immediate") {
    riskIndicators.push("Pattern of immediate liquidity removal")
  } else if (liquidity.typicalLiquidityRemovalSpeed === "holds") {
    positiveIndicators.push("Tends to maintain positions")
  }

  // Meme coin focus
  if (naming.usesMemeCoinNames && naming.usesTrendyKeywords) {
    riskIndicators.push("Focuses on trendy/meme token names")
  }

  // High token mortality
  if (behavior.percentTokensDead > 80 && history.totalTokens >= 3) {
    riskIndicators.push(`${behavior.percentTokensDead.toFixed(0)}% of tokens are dead`)
  } else if (behavior.percentTokensDead < 30 && history.totalTokens >= 3) {
    positiveIndicators.push("Most tokens still active")
  }

  // Multiple tokens
  if (history.totalTokens > 10) {
    riskIndicators.push(`High volume: ${history.totalTokens} tokens deployed`)
  } else if (history.totalTokens >= 3 && history.totalTokens <= 5) {
    positiveIndicators.push("Moderate deployment history")
  }

  // Determine profile type
  let profileType: DeployerPersonality["profileType"] = "unknown"
  let confidence: "high" | "medium" | "low" = "low"

  if (history.totalTokens < 2) {
    profileType = "new_deployer"
    confidence = "low"
  } else if (
    history.rugRate > 60 &&
    timing.launchFrequency === "rapid" &&
    (liquidity.typicalLiquidityRemovalSpeed === "immediate" ||
     liquidity.typicalLiquidityRemovalSpeed === "fast")
  ) {
    profileType = "serial_rugger"
    confidence = "high"
  } else if (
    history.rugRate > 40 ||
    (history.totalTokens > 5 && behavior.percentTokensDead > 70)
  ) {
    profileType = "pump_and_dumper"
    confidence = history.totalTokens >= 5 ? "high" : "medium"
  } else if (
    history.rugRate < 30 &&
    behavior.percentTokensDead < 50 &&
    liquidity.typicalLiquidityRemovalSpeed !== "immediate"
  ) {
    profileType = "legitimate"
    confidence = history.totalTokens >= 3 ? "medium" : "low"
  }

  return { profileType, riskIndicators, positiveIndicators, confidence }
}

function generatePersonalitySummary(
  profileType: DeployerPersonality["profileType"],
  history: { totalTokens: number; rugRate: number },
  timing: TimingPattern,
  liquidity: LiquidityPattern,
  behavior: BehaviorMetrics
): string {
  const parts: string[] = []

  // Profile type description
  switch (profileType) {
    case "serial_rugger":
      parts.push("This deployer shows strong patterns of serial rug pulling.")
      break
    case "pump_and_dumper":
      parts.push("This deployer appears to focus on pump-and-dump schemes.")
      break
    case "legitimate":
      parts.push("This deployer shows signs of legitimate project development.")
      break
    case "new_deployer":
      parts.push("This is a relatively new deployer with limited history.")
      break
    default:
      parts.push("This deployer's behavior patterns are unclear.")
  }

  // Add context
  if (history.totalTokens > 1) {
    parts.push(`They have launched ${history.totalTokens} tokens with a ${history.rugRate}% rug rate.`)
  }

  if (timing.launchFrequency === "rapid") {
    parts.push("Tokens are launched in rapid succession, often within hours of each other.")
  } else if (timing.launchFrequency === "regular") {
    parts.push("New tokens are launched on a regular schedule.")
  }

  if (liquidity.sellPatternDescription) {
    parts.push(liquidity.sellPatternDescription + ".")
  }

  if (behavior.avgTokenLifespanDays !== null && behavior.avgTokenLifespanDays < 7) {
    parts.push("Most tokens become inactive within a week of launch.")
  }

  return parts.join(" ")
}

function calculateRiskLevel(
  rugRate: number,
  riskIndicatorCount: number,
  positiveIndicatorCount: number,
  profileType: DeployerPersonality["profileType"]
): DeployerPersonality["riskLevel"] {
  if (profileType === "serial_rugger") return "extreme"
  if (profileType === "pump_and_dumper") return "high"

  const score = rugRate + (riskIndicatorCount * 10) - (positiveIndicatorCount * 5)

  if (score > 70) return "extreme"
  if (score > 50) return "high"
  if (score > 25) return "medium"
  return "low"
}

function createNewDeployerProfile(deployerAddress: string): DeployerPersonality {
  return {
    deployerAddress,
    profileType: "new_deployer",
    confidence: "low",
    timing: {
      avgDaysBetweenLaunches: null,
      preferredDayOfWeek: null,
      preferredTimeOfDay: null,
      launchFrequency: "unknown",
    },
    liquidity: {
      typicalLiquidityRemovalSpeed: "unknown",
      avgTimeToFirstSell: null,
      sellPatternDescription: null,
    },
    naming: {
      usesMemeCoinNames: false,
      usesTrendyKeywords: false,
      commonThemes: [],
      namingStyle: "generic",
    },
    behavior: {
      avgTokenLifespanDays: null,
      longestSurvivingToken: null,
      shortestLivedToken: null,
      percentTokensDead: 0,
      totalValueExtracted: null,
    },
    riskIndicators: ["New deployer with no history"],
    positiveIndicators: [],
    personalitySummary: "This is a new deployer with no established track record. Exercise caution as there is no historical data to assess their behavior patterns.",
    riskLevel: "medium",
  }
}
