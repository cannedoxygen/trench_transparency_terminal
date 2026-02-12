import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { AnalysisReport } from "@/types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatRequest {
  message: string
  report: AnalysisReport
  history: Array<{ role: "user" | "assistant"; content: string }>
}

interface ChatResponse {
  success: boolean
  reply?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json()
    const { message, report, history } = body

    if (!message || !report) {
      return NextResponse.json(
        { success: false, error: "Missing message or report data" },
        { status: 400 }
      )
    }

    // Build context from the analysis report
    const context = buildReportContext(report)

    // Build the system prompt
    const systemPrompt = `You are TrenchGuard, an AI assistant specializing in Solana token risk analysis. You help users understand the risks of tokens they're considering buying.

You have access to a detailed analysis report for the token being discussed. Use this data to answer questions accurately and helpfully.

ANALYSIS REPORT DATA:
${context}

GUIDELINES:
- Be direct and concise - traders need quick answers
- If something looks risky, say so clearly
- Use the actual data from the report to back up your points
- If asked "should I buy this?" give a balanced risk assessment, not financial advice
- You can use casual crypto/trading language (ape, degen, rug, etc.)
- If data is missing or unknown, acknowledge it
- Never make up data that isn't in the report
- Keep responses under 200 words unless the user asks for detail

PERSONALITY:
- Knowledgeable but approachable
- Protective of users (err on the side of caution)
- Straight-talking, no corporate speak
- Can be witty but always prioritizes clarity`

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ]

    // Add conversation history (last 10 messages max)
    const recentHistory = history.slice(-10)
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // Add current message
    messages.push({ role: "user", content: message })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response."

    return NextResponse.json({ success: true, reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    )
  }
}

function buildReportContext(report: AnalysisReport): string {
  const sections: string[] = []

  // Token Info
  sections.push(`TOKEN: ${report.metadata?.name || "Unknown"} (${report.metadata?.symbol || "?"})`)
  sections.push(`Mint: ${report.mint}`)
  sections.push(`Risk Score: ${report.riskScore.score}/100 (${report.riskScore.label.toUpperCase()})`)

  // Risk Reasons
  if (report.riskScore.reasons.length > 0) {
    sections.push(`\nRISK FACTORS:\n${report.riskScore.reasons.map(r => `- ${r}`).join("\n")}`)
  }

  // Deployer Info
  sections.push(`\nDEPLOYER:`)
  sections.push(`- Address: ${report.deployer.address || "Unknown"}`)
  sections.push(`- Detection Confidence: ${report.deployer.confidence}`)
  if (report.walletAge) {
    const ageInDays = (Date.now() / 1000 - report.walletAge) / 86400
    sections.push(`- Wallet Age: ${ageInDays.toFixed(1)} days`)
  }
  if (report.tokenCreatedAt) {
    const tokenAgeInDays = (Date.now() / 1000 - report.tokenCreatedAt) / 86400
    sections.push(`- Token Age: ${tokenAgeInDays.toFixed(1)} days`)
  }

  // Deployer History
  if (report.deployerHistory) {
    sections.push(`\nDEPLOYER HISTORY:`)
    sections.push(`- Total Tokens Launched: ${report.deployerHistory.totalTokens}`)
    sections.push(`- Rugged Tokens: ${report.deployerHistory.ruggedTokens}`)
    sections.push(`- Rug Rate: ${report.deployerHistory.rugRate}%`)
  }

  // Deployer Personality
  if (report.deployerPersonality) {
    sections.push(`\nDEPLOYER PROFILE:`)
    sections.push(`- Type: ${report.deployerPersonality.profileType.replace(/_/g, " ")}`)
    sections.push(`- Summary: ${report.deployerPersonality.personalitySummary}`)
    if (report.deployerPersonality.riskIndicators.length > 0) {
      sections.push(`- Risk Indicators: ${report.deployerPersonality.riskIndicators.join("; ")}`)
    }
  }

  // Funding
  sections.push(`\nFUNDING SOURCE:`)
  sections.push(`- Type: ${report.funding.sourceType}`)
  if (report.funding.taggedEntity) {
    sections.push(`- Entity: ${report.funding.taggedEntity}`)
  }

  // Holder Analysis
  if (report.holderAnalysis) {
    sections.push(`\nHOLDER ANALYSIS:`)
    sections.push(`- Total Holders: ${report.holderAnalysis.totalHolders}`)
    sections.push(`- Top 10 Concentration: ${report.holderAnalysis.top10Concentration}%`)
    sections.push(`- Sniper Wallets: ${report.holderAnalysis.sniperCount}`)
    sections.push(`- Insider Wallets: ${report.holderAnalysis.insiderCount}`)
    if (report.holderAnalysis.deployerHolding > 0) {
      sections.push(`- Deployer Still Holds: ${report.holderAnalysis.deployerHolding}%`)
    }
  }

  // Insider Clusters
  if (report.insiderAnalysis && report.insiderAnalysis.clusters.length > 0) {
    sections.push(`\nINSIDER CLUSTERS:`)
    sections.push(`- Total Clusters: ${report.insiderAnalysis.clusters.length}`)
    sections.push(`- Total Insiders: ${report.insiderAnalysis.totalInsiders}`)
    sections.push(`- Insider Holdings: ${report.insiderAnalysis.totalInsiderHolding.toFixed(1)}%`)
    sections.push(`- Coordination Score: ${report.insiderAnalysis.coordinationScore}/100`)
  }

  // Exchange Flows
  if (report.exchangeFlows) {
    sections.push(`\nEXCHANGE ACTIVITY:`)
    sections.push(`- Total Deposits to CEX: ${report.exchangeFlows.totalDeposits.toFixed(2)} SOL`)
    sections.push(`- Cash Out Detected: ${report.exchangeFlows.cashOutDetected ? "YES" : "No"}`)
    if (report.exchangeFlows.cashOutDetected) {
      sections.push(`- Cash Out Amount: ${report.exchangeFlows.cashOutAmount.toFixed(2)} SOL`)
    }
  }

  // Associated Wallets
  if (report.associatedWallets) {
    sections.push(`\nASSOCIATED WALLETS:`)
    sections.push(`- Total Connected: ${report.associatedWallets.totalAssociated}`)
    sections.push(`- Funding Chain Depth: ${report.associatedWallets.fundingChain.length}`)
    if (report.associatedWallets.relatedDeployers.length > 0) {
      sections.push(`- Related Token Deployers: ${report.associatedWallets.relatedDeployers.length}`)
    }
  }

  // AI Summary
  if (report.aiSummary) {
    sections.push(`\nAI VERDICT: ${report.aiSummary.verdict.replace(/_/g, " ").toUpperCase()}`)
    sections.push(`Headline: ${report.aiSummary.headline}`)
    sections.push(`Summary: ${report.aiSummary.summary}`)
  }

  return sections.join("\n")
}
