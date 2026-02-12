import { NextRequest, NextResponse } from "next/server"
import { heliusClient } from "@/lib/helius/client"
import { resolveDeployer, getWalletTransactionCount } from "@/lib/deployer/resolver"
import { calculateRiskScore } from "@/lib/scoring/calculator"
import { identifyFundingType } from "@/lib/scoring/signals"
import {
  getCachedReport,
  cacheReport,
  getCachedWallet,
  cacheWallet,
} from "@/lib/cache"
import { isValidSolanaAddress } from "@/lib/utils"
import {
  AnalysisReport,
  AnalyzeResponse,
  FundingInfo,
  WalletIdentity,
  Transfer,
  TokenMetadata,
} from "@/types"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mint = searchParams.get("mint")

  // Validate mint address
  if (!mint) {
    return NextResponse.json<AnalyzeResponse>(
      { success: false, error: "Missing mint parameter" },
      { status: 400 }
    )
  }

  if (!isValidSolanaAddress(mint)) {
    return NextResponse.json<AnalyzeResponse>(
      { success: false, error: "Invalid Solana address format" },
      { status: 400 }
    )
  }

  try {
    // Check cache first
    const cachedReport = await getCachedReport(mint)
    if (cachedReport) {
      return NextResponse.json<AnalyzeResponse>({
        success: true,
        data: cachedReport,
        cached: true,
      })
    }

    // Resolve deployer
    const deployerResult = await resolveDeployer(mint)

    // Get wallet intelligence if we have a deployer
    let walletIdentity: WalletIdentity | null = null
    let fundingInfo: FundingInfo = {
      sourceType: "unknown",
      sourceAddress: null,
      taggedEntity: null,
      confidence: "low",
      timestamp: null,
    }
    let recentTransfers: Transfer[] = []
    let walletAge: number | null = null
    let fundToDeployTime: number | null = null
    let walletTxCount = 0

    if (deployerResult.address) {
      // Check wallet cache
      let walletIntel = await getCachedWallet(deployerResult.address)

      if (!walletIntel) {
        // Fetch wallet data from Helius
        const [txHistory, txCount] = await Promise.all([
          heliusClient.getAddressHistory(deployerResult.address, 50),
          getWalletTransactionCount(deployerResult.address),
        ])

        walletTxCount = txCount

        // Find first transaction timestamp
        if (txHistory && txHistory.length > 0) {
          const sortedTxs = [...txHistory].sort(
            (a, b) => a.timestamp - b.timestamp
          )
          walletAge = sortedTxs[0].timestamp
        }

        // Analyze funding source from transaction history
        let fundingSource: {
          address: string | null
          type: string | null
          timestamp: number | null
        } = {
          address: null,
          type: null,
          timestamp: null,
        }

        // Look for initial funding in transaction history
        if (txHistory && txHistory.length > 0) {
          const sortedTxs = [...txHistory].sort(
            (a, b) => a.timestamp - b.timestamp
          )

          for (const tx of sortedTxs) {
            // Look for native SOL transfers to this wallet
            if (tx.nativeTransfers) {
              const incomingTransfer = tx.nativeTransfers.find(
                (t) => t.toUserAccount === deployerResult.address
              )
              if (incomingTransfer) {
                fundingSource = {
                  address: incomingTransfer.fromUserAccount,
                  type: null, // Will be determined by tags
                  timestamp: tx.timestamp,
                }
                break
              }
            }
          }
        }

        walletIntel = {
          tags: [],
          label: null,
          firstTxTimestamp: walletAge,
          transactionCount: walletTxCount,
          fundedBy: fundingSource,
        }

        // Cache wallet intelligence
        await cacheWallet(deployerResult.address, walletIntel)
      } else {
        walletAge = walletIntel.firstTxTimestamp
        walletTxCount = walletIntel.transactionCount
      }

      // Build wallet identity
      walletIdentity = {
        address: deployerResult.address,
        tags: walletIntel.tags,
        isExchange: walletIntel.tags.some((t) =>
          t.toLowerCase().includes("exchange")
        ),
        isMixer: walletIntel.tags.some((t) =>
          t.toLowerCase().includes("mixer")
        ),
        isBridge: walletIntel.tags.some((t) =>
          t.toLowerCase().includes("bridge")
        ),
        label: walletIntel.label,
      }

      // Determine funding type
      const fundingType = identifyFundingType(
        walletIntel.tags,
        walletIntel.label
      )

      fundingInfo = {
        sourceType: fundingType,
        sourceAddress: walletIntel.fundedBy.address,
        taggedEntity: walletIntel.label,
        confidence: fundingType === "unknown" ? "low" : "medium",
        timestamp: walletIntel.fundedBy.timestamp,
      }

      // Calculate fund to deploy time
      if (walletIntel.fundedBy.timestamp && deployerResult.firstTxTimestamp) {
        fundToDeployTime =
          deployerResult.firstTxTimestamp - walletIntel.fundedBy.timestamp
      }

      // Get recent transfers
      const txHistory = await heliusClient.getAddressHistory(
        deployerResult.address,
        20
      )
      if (txHistory) {
        recentTransfers = txHistory
          .filter((tx) => tx.nativeTransfers || tx.tokenTransfers)
          .slice(0, 10)
          .map((tx) => {
            const nativeTransfer = tx.nativeTransfers?.[0]
            const isSend =
              nativeTransfer?.fromUserAccount === deployerResult.address

            return {
              signature: tx.signature,
              timestamp: tx.timestamp,
              type: isSend ? "send" : "receive",
              amount: nativeTransfer?.amount || 0,
              counterparty: isSend
                ? nativeTransfer?.toUserAccount || "unknown"
                : nativeTransfer?.fromUserAccount || "unknown",
              counterpartyTag: null,
            }
          })
      }
    }

    // Get token metadata
    let tokenMetadata: TokenMetadata | null = null
    const asset = await heliusClient.getAsset(mint)
    if (asset) {
      tokenMetadata = {
        mint,
        name: asset.content?.metadata?.name || null,
        symbol:
          asset.content?.metadata?.symbol ||
          asset.token_info?.symbol ||
          null,
        decimals: asset.token_info?.decimals || 9,
        supply: asset.token_info?.supply?.toString() || null,
        image: asset.content?.links?.image || null,
      }
    }

    // Calculate risk score
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

    // Build report
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
      tokenCreatedAt: deployerResult.firstTxTimestamp || null,
      fundToDeployTime,
      deployerHistory: null,
      holderAnalysis: null,
      associatedWallets: null,
      exchangeFlows: null,
      deployerPersonality: null,
      insiderAnalysis: null,
      aiSummary: null,
    }

    // Cache the report
    await cacheReport(mint, report)

    return NextResponse.json<AnalyzeResponse>({
      success: true,
      data: report,
      cached: false,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json<AnalyzeResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    )
  }
}
