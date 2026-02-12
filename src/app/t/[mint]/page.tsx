import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { VerdictHeader } from "@/components/VerdictHeader"
import { TokenInfoCard } from "@/components/TokenInfoCard"
import { DeployerCard } from "@/components/DeployerCard"
import { FundingSourceCard } from "@/components/FundingSourceCard"
import { TransfersTable } from "@/components/TransfersTable"
import { SharePanel } from "@/components/SharePanel"
import { AISummaryCard } from "@/components/AISummaryCard"
import { DeployerHistoryCard } from "@/components/DeployerHistoryCard"
import { HolderAnalysisCard } from "@/components/HolderAnalysisCard"
import { AssociatedWalletsCard } from "@/components/AssociatedWalletsCard"
import { ExchangeFlowCard } from "@/components/ExchangeFlowCard"
import { PersonalityProfileCard } from "@/components/PersonalityProfileCard"
import { InsiderClustersCard } from "@/components/InsiderClustersCard"
import { AICopilot } from "@/components/AICopilot"
import { LiveRugMeter } from "@/components/LiveRugMeter"
import { SmartMoneyCard } from "@/components/SmartMoneyCard"
import { WalletGraphCard } from "@/components/WalletGraphCard"
import { KOLDetectionCard } from "@/components/KOLDetectionCard"
import { isValidSolanaAddress } from "@/lib/utils"
import { analyzeToken } from "@/lib/analyze"
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react"

interface PageProps {
  params: Promise<{ mint: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { mint } = await params

  return {
    title: `Token Analysis | Trench Transparency Terminal`,
    description: `Risk analysis report for Solana token ${mint}`,
    openGraph: {
      title: `Token Analysis | Trench Transparency Terminal`,
      description: `See the risk analysis for this Solana token`,
    },
  }
}

export default async function ReportPage({ params }: PageProps) {
  const { mint } = await params

  if (!isValidSolanaAddress(mint)) {
    notFound()
  }

  const result = await analyzeToken(mint)

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Trench Terminal</span>
          </Link>
          {result.cached && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Cached
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!result.success ? (
          <ErrorState error={result.error || "Unknown error"} mint={mint} />
        ) : result.data ? (
          <div className="space-y-6">
            {/* Verdict Header */}
            <VerdictHeader riskScore={result.data.riskScore} />

            {/* AI Summary - Prominent Display */}
            {result.data.aiSummary && (
              <AISummaryCard summary={result.data.aiSummary} />
            )}

            {/* Live Risk Monitor */}
            <LiveRugMeter
              baseRiskScore={result.data.riskScore.score}
              tokenMint={result.data.mint}
              deployerAddress={result.data.deployer.address}
              topHolders={result.data.holderAnalysis?.topHolders.map(h => h.address) || []}
            />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Info */}
              <TokenInfoCard
                mint={result.data.mint}
                metadata={result.data.metadata}
              />

              {/* Deployer */}
              <DeployerCard
                deployer={result.data.deployer}
                identity={result.data.identity}
                walletAge={result.data.walletAge}
                tokenCreatedAt={result.data.tokenCreatedAt}
              />

              {/* Funding Source */}
              <FundingSourceCard funding={result.data.funding} />

              {/* Share Panel */}
              <SharePanel
                mint={result.data.mint}
                riskScore={result.data.riskScore}
                tokenName={result.data.metadata?.name}
              />
            </div>

            {/* Deployer History & Personality Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DeployerHistoryCard
                history={result.data.deployerHistory}
                deployerAddress={result.data.deployer.address}
              />
              <PersonalityProfileCard personality={result.data.deployerPersonality} />
            </div>

            {/* Holder Analysis & Insider Clusters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HolderAnalysisCard analysis={result.data.holderAnalysis} />
              <InsiderClustersCard analysis={result.data.insiderAnalysis} />
            </div>

            {/* Associated Wallets & Exchange Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssociatedWalletsCard analysis={result.data.associatedWallets} />
              <ExchangeFlowCard analysis={result.data.exchangeFlows} />
            </div>

            {/* Smart Money & KOL Detection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SmartMoneyCard
                tokenMint={result.data.mint}
                topHolders={result.data.holderAnalysis?.topHolders.map(h => ({
                  address: h.address,
                  percentage: h.percentage,
                })) || []}
                tokenCreatedAt={result.data.tokenCreatedAt}
              />
              <KOLDetectionCard
                tokenMint={result.data.mint}
                topHolders={result.data.holderAnalysis?.topHolders.map(h => ({
                  address: h.address,
                  percentage: h.percentage,
                })) || []}
                deployerAddress={result.data.deployer.address}
                fundingChain={result.data.associatedWallets?.fundingChain.map(w => w.address) || []}
              />
            </div>

            {/* Wallet Network Graph */}
            <WalletGraphCard
              deployerAddress={result.data.deployer.address}
              analysis={result.data.associatedWallets}
            />

            {/* Transfers Table */}
            <TransfersTable
              transfers={result.data.recentTransfers}
              deployerAddress={result.data.deployer.address}
            />

            {/* Disclaimer */}
            <Disclaimer />

            {/* AI Copilot Chat */}
            <AICopilot report={result.data} />
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Analyze another token
          </Link>
          <div className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://helius.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Helius
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function ErrorState({ error, mint }: { error: string; mint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-12 h-12 text-risk-high mb-4" />
      <h1 className="text-xl font-semibold mb-2">Analysis Failed</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
      <div className="flex gap-4">
        <Link
          href={`/t/${mint}`}
          className="flex items-center gap-2 text-accent hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Link>
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Go Home
        </Link>
      </div>
    </div>
  )
}

function Disclaimer() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
      <p>
        <strong className="text-foreground">Disclaimer:</strong> This analysis is
        provided for informational purposes only and should not be considered
        financial advice. Risk scores are based on observable blockchain data and
        may not capture all relevant factors. Always conduct your own research
        before making any investment decisions.
      </p>
    </div>
  )
}
