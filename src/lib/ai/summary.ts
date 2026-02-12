import OpenAI from "openai"
import { AnalysisReport } from "@/types"
import { DeployerHistory } from "@/lib/deployer/history"
import { HolderAnalysis } from "@/lib/holders/analyzer"

// Lazy initialization to avoid build-time errors when API key is not set
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export interface AISummary {
  verdict: "safe" | "caution" | "danger" | "extreme_danger"
  headline: string
  summary: string
  keyPoints: string[]
  recommendation: string
}

/**
 * Generate AI-powered summary of token analysis
 */
export async function generateAISummary(
  report: AnalysisReport,
  deployerHistory: DeployerHistory | null,
  holderAnalysis: HolderAnalysis | null
): Promise<AISummary> {
  // Check if API key is configured and get client
  const openai = getOpenAIClient()
  if (!openai) {
    return generateFallbackSummary(report, deployerHistory, holderAnalysis)
  }

  try {
    const prompt = buildPrompt(report, deployerHistory, holderAnalysis)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a crypto security analyst helping traders avoid rug pulls and scams on Solana.
You analyze on-chain data and provide clear, actionable warnings.
Be direct and blunt. Traders need quick answers.
Use emojis sparingly for emphasis on critical warnings.
Never give financial advice, just risk assessment based on data.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return generateFallbackSummary(report, deployerHistory, holderAnalysis)
    }

    return parseAIResponse(response, report)
  } catch (error) {
    console.error("AI summary error:", error)
    return generateFallbackSummary(report, deployerHistory, holderAnalysis)
  }
}

function buildPrompt(
  report: AnalysisReport,
  deployerHistory: DeployerHistory | null,
  holderAnalysis: HolderAnalysis | null
): string {
  let prompt = `Analyze this Solana token for rug pull risk:\n\n`

  // Token info
  prompt += `TOKEN: ${report.metadata?.name || "Unknown"} (${report.metadata?.symbol || "???"})\n`
  prompt += `Mint: ${report.mint}\n\n`

  // Deployer info
  prompt += `DEPLOYER ANALYSIS:\n`
  prompt += `- Address: ${report.deployer.address || "Unknown"}\n`
  prompt += `- Detection confidence: ${report.deployer.confidence}\n`

  if (deployerHistory) {
    prompt += `- Previous tokens launched: ${deployerHistory.totalTokens}\n`
    prompt += `- Rugged tokens: ${deployerHistory.ruggedTokens}\n`
    prompt += `- Rug rate: ${deployerHistory.rugRate}%\n`
  }

  // Funding info
  prompt += `\nFUNDING SOURCE:\n`
  prompt += `- Type: ${report.funding.sourceType}\n`
  prompt += `- Source: ${report.funding.taggedEntity || report.funding.sourceAddress || "Unknown"}\n`
  prompt += `- Confidence: ${report.funding.confidence}\n`

  // Identity tags
  if (report.identity?.tags && report.identity.tags.length > 0) {
    prompt += `\nDEPLOYER TAGS: ${report.identity.tags.join(", ")}\n`
  }

  // Holder analysis
  if (holderAnalysis) {
    prompt += `\nHOLDER ANALYSIS:\n`
    prompt += `- Total holders: ${holderAnalysis.totalHolders}\n`
    prompt += `- Top 10 concentration: ${holderAnalysis.top10Concentration}%\n`
    prompt += `- Sniper wallets detected: ${holderAnalysis.sniperCount}\n`
    prompt += `- Insider wallets detected: ${holderAnalysis.insiderCount}\n`
    prompt += `- Deployer holding: ${holderAnalysis.deployerHolding}%\n`
    if (holderAnalysis.warnings.length > 0) {
      prompt += `- Warnings: ${holderAnalysis.warnings.join("; ")}\n`
    }
  }

  // Current risk score
  prompt += `\nCURRENT RISK SCORE: ${report.riskScore.score}/100 (${report.riskScore.label})\n`
  prompt += `Signals: ${report.riskScore.reasons.join("; ")}\n`

  prompt += `\n---\n`
  prompt += `Provide a JSON response with:\n`
  prompt += `1. verdict: "safe", "caution", "danger", or "extreme_danger"\n`
  prompt += `2. headline: One punchy line (max 10 words)\n`
  prompt += `3. summary: 2-3 sentences explaining the risk\n`
  prompt += `4. keyPoints: Array of 3-4 bullet points with key findings\n`
  prompt += `5. recommendation: One sentence advice\n`
  prompt += `\nRespond ONLY with valid JSON.`

  return prompt
}

function parseAIResponse(response: string, report: AnalysisReport): AISummary {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        verdict: parsed.verdict || determineVerdict(report.riskScore.score),
        headline: parsed.headline || "Analysis Complete",
        summary: parsed.summary || "Unable to generate detailed summary.",
        keyPoints: parsed.keyPoints || [],
        recommendation: parsed.recommendation || "Do your own research.",
      }
    }
  } catch (e) {
    console.error("Failed to parse AI response:", e)
  }

  // Fallback if JSON parsing fails
  return {
    verdict: determineVerdict(report.riskScore.score),
    headline: "Analysis Complete",
    summary: response.slice(0, 300),
    keyPoints: report.riskScore.reasons.slice(0, 4),
    recommendation: "Review the detailed analysis below.",
  }
}

function determineVerdict(score: number): AISummary["verdict"] {
  if (score >= 75) return "extreme_danger"
  if (score >= 50) return "danger"
  if (score >= 25) return "caution"
  return "safe"
}

function generateFallbackSummary(
  report: AnalysisReport,
  deployerHistory: DeployerHistory | null,
  holderAnalysis: HolderAnalysis | null
): AISummary {
  const score = report.riskScore.score
  const verdict = determineVerdict(score)

  let headline = ""
  let summary = ""
  const keyPoints: string[] = []

  // Build headline based on most critical finding
  if (deployerHistory && deployerHistory.rugRate > 50) {
    headline = `⚠️ Serial Rugger Alert - ${deployerHistory.rugRate}% Rug Rate`
  } else if (report.funding.sourceType === "mixer") {
    headline = `🚨 Mixer-Funded Deployer Detected`
  } else if (holderAnalysis && holderAnalysis.sniperCount >= 5) {
    headline = `⚠️ Heavy Sniper Activity Detected`
  } else if (score >= 75) {
    headline = `🚨 Extreme Risk - Multiple Red Flags`
  } else if (score >= 50) {
    headline = `⚠️ High Risk - Proceed with Caution`
  } else if (score >= 25) {
    headline = `⚡ Moderate Risk - Some Concerns`
  } else {
    headline = `✅ Lower Risk - Standard Signals`
  }

  // Build summary
  const parts: string[] = []

  if (deployerHistory && deployerHistory.totalTokens > 0) {
    parts.push(
      `Deployer has launched ${deployerHistory.totalTokens} tokens with ${deployerHistory.ruggedTokens} rugs (${deployerHistory.rugRate}% rug rate).`
    )
  }

  if (report.funding.sourceType === "mixer") {
    parts.push("Deployer wallet was funded through a mixer, obscuring the source of funds.")
  } else if (report.funding.sourceType === "bridge") {
    parts.push("Deployer wallet was funded via bridge, making origin harder to trace.")
  } else if (report.funding.taggedEntity) {
    parts.push(`Deployer funded from ${report.funding.taggedEntity}.`)
  }

  if (holderAnalysis) {
    if (holderAnalysis.top10Concentration > 80) {
      parts.push(`Top 10 wallets control ${holderAnalysis.top10Concentration}% of supply.`)
    }
    if (holderAnalysis.sniperCount >= 3) {
      parts.push(`${holderAnalysis.sniperCount} sniper wallets among top holders.`)
    }
  }

  summary = parts.join(" ") || "Limited data available for comprehensive analysis."

  // Build key points
  keyPoints.push(...report.riskScore.reasons.slice(0, 3))

  if (deployerHistory && deployerHistory.rugRate > 0) {
    keyPoints.push(`Deployer rug history: ${deployerHistory.ruggedTokens}/${deployerHistory.totalTokens} tokens`)
  }

  if (holderAnalysis?.warnings) {
    keyPoints.push(...holderAnalysis.warnings.slice(0, 2))
  }

  // Recommendation
  let recommendation = ""
  if (verdict === "extreme_danger") {
    recommendation = "Strongly consider avoiding this token. Multiple high-risk indicators present."
  } else if (verdict === "danger") {
    recommendation = "High risk detected. If entering, use small size and set stop losses."
  } else if (verdict === "caution") {
    recommendation = "Some risk factors present. Research thoroughly before investing."
  } else {
    recommendation = "Lower risk profile, but always DYOR. No token is completely safe."
  }

  return {
    verdict,
    headline,
    summary,
    keyPoints: keyPoints.slice(0, 5),
    recommendation,
  }
}
