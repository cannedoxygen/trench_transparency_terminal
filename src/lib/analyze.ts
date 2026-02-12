import { heliusClient, WalletFundedByResponse, WalletIdentityResponse } from "@/lib/helius/client"
import { resolveDeployer, getWalletTransactionCount } from "@/lib/deployer/resolver"
import { getDeployerHistory } from "@/lib/deployer/history"
import { buildDeployerPersonality } from "@/lib/deployer/personality"
import { analyzeHolders } from "@/lib/holders/analyzer"
import { analyzeAssociatedWallets } from "@/lib/wallets/associated"
import { analyzeExchangeFlows } from "@/lib/exchange/tracker"
import { detectInsiderClusters } from "@/lib/insiders/detector"
import { generateAISummary } from "@/lib/ai/summary"
import { calculateRiskScore } from "@/lib/scoring/calculator"
import { getCachedReport, cacheReport } from "@/lib/cache"
import {
  AnalysisReport,
  FundingInfo,
  WalletIdentity,
  Transfer,
  TokenMetadata,
  FundingSourceType,
  DeployerHistory,
  HolderAnalysis,
  AssociatedWalletsAnalysis,
  ExchangeFlowAnalysis,
  DeployerPersonality,
  InsiderAnalysis,
} from "@/types"

function determineFundingType(
  fundedBy: WalletFundedByResponse | null,
  identity: WalletIdentityResponse | null
): FundingSourceType {
  if (!fundedBy) return "unknown"

  const funderType = fundedBy.funderType?.toLowerCase() || ""
  const funderName = fundedBy.funderName?.toLowerCase() || ""

  if (funderType.includes("mixer") || funderName.includes("mixer") || funderName.includes("tornado")) {
    return "mixer"
  }
  if (funderType.includes("bridge") || funderName.includes("bridge") || funderName.includes("wormhole")) {
    return "bridge"
  }
  if (funderType.includes("exchange") || funderType.includes("cex") ||
      funderName.includes("binance") || funderName.includes("coinbase") ||
      funderName.includes("kraken") || funderName.includes("okx")) {
    return "exchange"
  }
  if (identity?.category?.toLowerCase().includes("exchange")) return "exchange"
  if (identity?.category?.toLowerCase().includes("bridge")) return "bridge"
  if (fundedBy.funderName) return "direct"

  return "unknown"
}

export async function analyzeToken(mint: string): Promise<{
  success: boolean
  data?: AnalysisReport
  error?: string
  cached?: boolean
}> {
  try {
    // Check cache
    const cachedReport = await getCachedReport(mint)
    if (cachedReport) {
      return { success: true, data: cachedReport, cached: true }
    }

    console.log(`[Analysis] Starting analysis for ${mint}`)

    // Step 1: Resolve deployer
    const deployerResult = await resolveDeployer(mint)
    console.log(`[Analysis] Deployer: ${deployerResult.address || "unknown"}`)

    // Initialize
    let walletIdentity: WalletIdentity | null = null
    let fundingInfo: FundingInfo = {
      sourceType: "unknown",
      sourceAddress: null,
      taggedEntity: null,
      confidence: "low",
      timestamp: null,
    }
    let recentTransfers: Transfer[] = []
    let walletAge: number | null = null // Deployer wallet's first tx
    let tokenCreatedAt: number | null = null // Token's creation time
    let fundToDeployTime: number | null = null
    let walletTxCount = 0
    let deployerHistory: DeployerHistory | null = null
    let holderAnalysis: HolderAnalysis | null = null
    let associatedWallets: AssociatedWalletsAnalysis | null = null
    let exchangeFlows: ExchangeFlowAnalysis | null = null
    let deployerPersonality: DeployerPersonality | null = null
    let insiderAnalysis: InsiderAnalysis | null = null

    if (deployerResult.address) {
      // Step 2: Parallel fetch of all deployer intelligence
      console.log(`[Analysis] Fetching deployer intelligence...`)

      const [
        deployerIdentity,
        fundedBy,
        transfers,
        txCount,
        firstTx,
        history,
        holders,
      ] = await Promise.all([
        heliusClient.getWalletIdentity(deployerResult.address),
        heliusClient.getWalletFundedBy(deployerResult.address),
        heliusClient.getWalletTransfers(deployerResult.address, 50),
        getWalletTransactionCount(deployerResult.address),
        heliusClient.getFirstTransaction(deployerResult.address),
        getDeployerHistory(deployerResult.address),
        analyzeHolders(mint, deployerResult.address),
      ])

      walletTxCount = txCount

      // Track token creation time (from deployer resolver)
      if (deployerResult.firstTxTimestamp) {
        tokenCreatedAt = deployerResult.firstTxTimestamp
        console.log(`[Analysis] Token created: ${new Date(tokenCreatedAt * 1000).toISOString()}`)
      }

      // Track deployer wallet's first activity
      if (firstTx?.timestamp) {
        walletAge = firstTx.timestamp
        console.log(`[Analysis] Deployer wallet first tx: ${new Date(walletAge * 1000).toISOString()}`)
      } else if (fundedBy?.timestamp) {
        walletAge = fundedBy.timestamp
        console.log(`[Analysis] Deployer wallet funded: ${new Date(walletAge * 1000).toISOString()}`)
      }

      // If deployer wallet is newer than token, it might be wrong deployer
      // In that case, use token creation time as fallback for display
      if (walletAge && tokenCreatedAt && walletAge > tokenCreatedAt) {
        console.log(`[Analysis] Warning: Deployer wallet (${new Date(walletAge * 1000).toISOString()}) newer than token (${new Date(tokenCreatedAt * 1000).toISOString()})`)
      }

      // Process deployer history
      if (history && history.totalTokens > 0) {
        deployerHistory = {
          totalTokens: history.totalTokens,
          ruggedTokens: history.ruggedTokens,
          rugRate: history.rugRate,
          tokens: history.tokensLaunched.map(t => ({
            mint: t.mint,
            name: t.name,
            symbol: t.symbol,
            deployedAt: t.deployedAt,
            isRugged: t.isRugged,
            rugIndicators: t.rugIndicators,
            currentStatus: t.currentStatus,
          })),
          riskLevel: history.riskLevel,
        }
        console.log(`[Analysis] Deployer history: ${history.totalTokens} tokens, ${history.rugRate}% rug rate`)
      }

      // Process holder analysis
      if (holders) {
        holderAnalysis = {
          totalHolders: holders.totalHolders,
          topHolders: holders.topHolders.map(h => ({
            address: h.address,
            percentage: h.percentage,
            isDeployer: h.isDeployer,
            isSniper: h.isSniper,
            isInsider: h.isInsider,
            identity: h.identity?.name || null,
            riskFlags: h.riskFlags,
          })),
          sniperCount: holders.sniperCount,
          insiderCount: holders.insiderCount,
          top10Concentration: holders.top10Concentration,
          deployerHolding: holders.deployerHolding,
          exchangeHoldings: holders.exchangeHoldings,
          warnings: holders.warnings,
          riskLevel: holders.riskLevel,
        }
        console.log(`[Analysis] Holders: ${holders.totalHolders} total, ${holders.sniperCount} snipers`)
      }

      // Analyze associated wallets
      console.log(`[Analysis] Analyzing associated wallets...`)
      const associated = await analyzeAssociatedWallets(deployerResult.address)
      if (associated.totalAssociated > 0) {
        associatedWallets = associated
        console.log(`[Analysis] Associated wallets: ${associated.totalAssociated} found, risk: ${associated.riskLevel}`)
      }

      // Analyze exchange flows
      console.log(`[Analysis] Analyzing exchange flows...`)
      const exchanges = await analyzeExchangeFlows(deployerResult.address)
      if (exchanges.recentTransfers.length > 0 || exchanges.cashOutDetected) {
        exchangeFlows = exchanges
        console.log(`[Analysis] Exchange flows: ${exchanges.totalDeposits.toFixed(2)} SOL deposited, cash out: ${exchanges.cashOutDetected}`)
      }

      // Build deployer personality profile
      console.log(`[Analysis] Building deployer personality profile...`)
      deployerPersonality = await buildDeployerPersonality(deployerResult.address)
      console.log(`[Analysis] Personality: ${deployerPersonality.profileType}, Risk: ${deployerPersonality.riskLevel}`)

      // Detect insider clusters (if we have holder data)
      if (holderAnalysis && holderAnalysis.topHolders.length > 0) {
        console.log(`[Analysis] Detecting insider clusters...`)
        insiderAnalysis = await detectInsiderClusters(
          mint,
          holderAnalysis.topHolders.map(h => ({ address: h.address, percentage: h.percentage })),
          deployerResult.address
        )
        console.log(`[Analysis] Insiders: ${insiderAnalysis.totalInsiders} in ${insiderAnalysis.clusters.length} clusters`)
      }

      // Get funder identity
      let funderIdentity: WalletIdentityResponse | null = null
      if (fundedBy?.funder) {
        funderIdentity = await heliusClient.getWalletIdentity(fundedBy.funder)
      }

      // Build wallet identity
      walletIdentity = {
        address: deployerResult.address,
        tags: deployerIdentity?.tags || [],
        isExchange: deployerIdentity?.category?.toLowerCase().includes("exchange") || false,
        isMixer: deployerIdentity?.category?.toLowerCase().includes("mixer") || false,
        isBridge: deployerIdentity?.category?.toLowerCase().includes("bridge") || false,
        label: deployerIdentity?.name || deployerIdentity?.type || null,
      }

      // Build funding info
      const fundingType = determineFundingType(fundedBy, funderIdentity)
      fundingInfo = {
        sourceType: fundingType,
        sourceAddress: fundedBy?.funder || null,
        taggedEntity: fundedBy?.funderName || funderIdentity?.name || null,
        confidence: fundedBy ? (fundedBy.funderName ? "high" : "medium") : "low",
        timestamp: fundedBy?.timestamp || null,
      }

      if (fundedBy?.timestamp && deployerResult.firstTxTimestamp) {
        fundToDeployTime = deployerResult.firstTxTimestamp - fundedBy.timestamp
      }

      // Process transfers
      if (transfers.transfers.length > 0) {
        const counterparties = Array.from(new Set(transfers.transfers.map(t => t.counterparty)))
        const counterpartyIdentities = await heliusClient.batchGetIdentities(counterparties)

        recentTransfers = transfers.transfers.map(t => ({
          signature: t.signature,
          timestamp: t.timestamp,
          type: t.direction === "out" ? "send" : "receive",
          amount: t.token.amount,
          counterparty: t.counterparty,
          counterpartyTag: t.counterpartyName || counterpartyIdentities.get(t.counterparty)?.name || null,
          isToken: t.token.mint !== "So11111111111111111111111111111111111111112",
          tokenSymbol: t.token.symbol,
        }))
      } else {
        // Fallback to RPC
        const txHistory = await heliusClient.getAddressHistory(deployerResult.address, 30)
        if (txHistory) {
          for (const tx of txHistory) {
            if (tx.nativeTransfers) {
              for (const transfer of tx.nativeTransfers) {
                if (transfer.amount < 1000) continue
                const isSend = transfer.fromUserAccount === deployerResult.address
                const isReceive = transfer.toUserAccount === deployerResult.address
                if (isSend || isReceive) {
                  recentTransfers.push({
                    signature: tx.signature,
                    timestamp: tx.timestamp,
                    type: isSend ? "send" : "receive",
                    amount: transfer.amount / 1e9,
                    counterparty: isSend ? transfer.toUserAccount : transfer.fromUserAccount,
                    counterpartyTag: null,
                  })
                }
              }
            }
            if (recentTransfers.length >= 30) break
          }
        }
      }
    }

    // Step 3: Get token metadata
    let tokenMetadata: TokenMetadata | null = null
    const asset = await heliusClient.getAsset(mint)
    if (asset) {
      tokenMetadata = {
        mint,
        name: asset.content?.metadata?.name || null,
        symbol: asset.content?.metadata?.symbol || asset.token_info?.symbol || null,
        decimals: asset.token_info?.decimals || 9,
        supply: asset.token_info?.supply?.toString() || null,
        image: asset.content?.links?.image || null,
      }
    }

    // Step 4: Calculate risk score
    const riskScore = calculateRiskScore({
      fundingSourceType: fundingInfo.sourceType,
      fundingTags: walletIdentity?.tags || [],
      fundingLabel: walletIdentity?.label || null,
      walletFirstTx: walletAge,
      walletTxCount,
      fundTimestamp: fundingInfo.timestamp,
      deployTimestamp: deployerResult.firstTxTimestamp,
      recentTransfers,
      deployerConfidence: deployerResult.confidence,
    })

    // Boost risk for deployer history
    if (deployerHistory && deployerHistory.rugRate > 50) {
      riskScore.score = Math.min(100, riskScore.score + 30)
      riskScore.reasons.unshift(`🚨 Deployer has ${deployerHistory.rugRate}% rug rate (${deployerHistory.ruggedTokens}/${deployerHistory.totalTokens} tokens)`)
    } else if (deployerHistory && deployerHistory.rugRate > 25) {
      riskScore.score = Math.min(100, riskScore.score + 15)
      riskScore.reasons.unshift(`⚠️ Deployer has ${deployerHistory.rugRate}% rug rate`)
    }

    // Boost for holder concentration
    if (holderAnalysis && holderAnalysis.top10Concentration > 80) {
      riskScore.score = Math.min(100, riskScore.score + 10)
      riskScore.reasons.push(`Top 10 holders control ${holderAnalysis.top10Concentration}% of supply`)
    }

    // Boost for snipers
    if (holderAnalysis && holderAnalysis.sniperCount >= 5) {
      riskScore.score = Math.min(100, riskScore.score + 10)
      riskScore.reasons.push(`${holderAnalysis.sniperCount} sniper wallets detected`)
    }

    // Known bad actor
    if (walletIdentity?.tags?.some(t =>
      t.toLowerCase().includes("scammer") ||
      t.toLowerCase().includes("rugger") ||
      t.toLowerCase().includes("exploiter")
    )) {
      riskScore.score = Math.min(100, riskScore.score + 50)
      riskScore.reasons.unshift("🚨 Deployer tagged as known bad actor")
    }

    // Boost for associated wallet risks
    if (associatedWallets) {
      // Mixer in funding chain
      const hasMixer = associatedWallets.fundingChain.some(w =>
        w.identity?.isMixer || w.riskFlags.some(f => f.toLowerCase().includes("mixer"))
      )
      if (hasMixer) {
        riskScore.score = Math.min(100, riskScore.score + 20)
        riskScore.reasons.push("Mixer detected in funding chain")
      }

      // Related deployers (other wallets that also deployed tokens)
      if (associatedWallets.relatedDeployers.length > 0) {
        riskScore.score = Math.min(100, riskScore.score + 10)
        riskScore.reasons.push(`${associatedWallets.relatedDeployers.length} connected wallet(s) also deployed tokens`)
      }
    }

    // Boost for exchange cash-out patterns
    if (exchangeFlows) {
      if (exchangeFlows.cashOutDetected) {
        riskScore.score = Math.min(100, riskScore.score + 25)
        riskScore.reasons.push(`Cash out detected: ${exchangeFlows.cashOutAmount.toFixed(1)} SOL to exchanges`)
      } else if (exchangeFlows.totalDeposits > 20) {
        riskScore.score = Math.min(100, riskScore.score + 10)
        riskScore.reasons.push(`${exchangeFlows.totalDeposits.toFixed(1)} SOL deposited to exchanges`)
      }
    }

    // Boost for deployer personality risk
    if (deployerPersonality) {
      if (deployerPersonality.profileType === "serial_rugger") {
        riskScore.score = Math.min(100, riskScore.score + 30)
        riskScore.reasons.push("Deployer profile: Serial rugger pattern detected")
      } else if (deployerPersonality.profileType === "pump_and_dumper") {
        riskScore.score = Math.min(100, riskScore.score + 20)
        riskScore.reasons.push("Deployer profile: Pump & dump pattern detected")
      }
    }

    // Boost for insider clusters
    if (insiderAnalysis && insiderAnalysis.clusters.length > 0) {
      if (insiderAnalysis.totalInsiderHolding > 25) {
        riskScore.score = Math.min(100, riskScore.score + 20)
        riskScore.reasons.push(`Insider clusters control ${insiderAnalysis.totalInsiderHolding.toFixed(1)}% of supply`)
      } else if (insiderAnalysis.totalInsiderHolding > 10) {
        riskScore.score = Math.min(100, riskScore.score + 10)
        riskScore.reasons.push(`${insiderAnalysis.clusters.length} coordinated wallet cluster(s) detected`)
      }

      // Deployer-funded wallets holding
      const deployerFundedCluster = insiderAnalysis.clusters.find(c => c.type === "fund_network")
      if (deployerFundedCluster) {
        riskScore.score = Math.min(100, riskScore.score + 15)
        riskScore.reasons.push(`Deployer funded ${deployerFundedCluster.wallets.length} holder wallet(s)`)
      }
    }

    // Update label
    if (riskScore.score > 75) riskScore.label = "extreme"
    else if (riskScore.score > 50) riskScore.label = "high"
    else if (riskScore.score > 25) riskScore.label = "moderate"

    // Step 5: Build report (without AI summary first)
    const report: AnalysisReport = {
      mint,
      timestamp: Math.floor(Date.now() / 1000),
      deployer: {
        address: deployerResult.address,
        confidence: deployerResult.confidence,
        method: deployerResult.method,
        evidence: deployerResult.evidence,
      },
      funding: fundingInfo,
      identity: walletIdentity,
      riskScore,
      recentTransfers,
      metadata: tokenMetadata,
      walletAge,
      tokenCreatedAt,
      fundToDeployTime,
      deployerHistory,
      holderAnalysis,
      associatedWallets,
      exchangeFlows,
      deployerPersonality,
      insiderAnalysis,
      aiSummary: null,
    }

    // Step 6: Generate AI summary
    console.log(`[Analysis] Generating AI summary...`)
    const aiSummary = await generateAISummary(
      report,
      deployerHistory ? { ...deployerHistory, address: deployerResult.address || "", tokensLaunched: [], firstLaunch: null, lastLaunch: null, avgTokenLifespan: null } : null,
      holderAnalysis ? { ...holderAnalysis, mint, topHolders: [] } : null
    )
    report.aiSummary = aiSummary
    console.log(`[Analysis] AI verdict: ${aiSummary.verdict}`)

    // Cache and return
    await cacheReport(mint, report)

    return { success: true, data: report, cached: false }
  } catch (error) {
    console.error("Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    }
  }
}
