"use client"

import { AssociatedWalletsAnalysis, AssociatedWallet } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, ArrowRight, AlertTriangle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { shortenAddress } from "@/lib/utils"

interface AssociatedWalletsCardProps {
  analysis: AssociatedWalletsAnalysis | null
}

export function AssociatedWalletsCard({ analysis }: AssociatedWalletsCardProps) {
  if (!analysis || analysis.totalAssociated === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Associated Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No associated wallets detected.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRiskConfig = () => {
    switch (analysis.riskLevel) {
      case "extreme":
        return {
          color: "text-risk-extreme",
          bgColor: "bg-risk-extreme/10",
          borderColor: "border-risk-extreme/30",
          badge: "extreme" as const,
        }
      case "high":
        return {
          color: "text-risk-high",
          bgColor: "bg-risk-high/10",
          borderColor: "border-risk-high/30",
          badge: "high" as const,
        }
      case "medium":
        return {
          color: "text-risk-moderate",
          bgColor: "bg-risk-moderate/10",
          borderColor: "border-risk-moderate/30",
          badge: "moderate" as const,
        }
      default:
        return {
          color: "text-risk-low",
          bgColor: "bg-risk-low/10",
          borderColor: "border-risk-low/30",
          badge: "low" as const,
        }
    }
  }

  const config = getRiskConfig()

  return (
    <Card className={cn("border", analysis.riskLevel !== "low" ? config.borderColor : "")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Associated Wallets
          </CardTitle>
          <Badge variant={config.badge}>
            {analysis.totalAssociated} Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            {analysis.warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 bg-risk-high/10 rounded-lg text-sm"
              >
                <AlertTriangle className="w-4 h-4 text-risk-high shrink-0 mt-0.5" />
                <span className="text-risk-high">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Funding Chain */}
        {analysis.fundingChain.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Funding Chain</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {analysis.fundingChain.map((wallet, i) => (
                <div key={wallet.address} className="flex items-center gap-2">
                  <WalletBadge wallet={wallet} />
                  {i < analysis.fundingChain.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              ))}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className="bg-accent/10">
                Deployer
              </Badge>
            </div>
          </div>
        )}

        {/* Related Deployers */}
        {analysis.relatedDeployers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Also Deployed Tokens
            </h4>
            <div className="space-y-1">
              {analysis.relatedDeployers.map((wallet) => (
                <div
                  key={wallet.address}
                  className="flex items-center justify-between p-2 bg-risk-high/10 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{shortenAddress(wallet.address, 6)}</code>
                    {wallet.identity?.name && (
                      <Badge variant="outline" className="text-xs">
                        {wallet.identity.name}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="high" className="text-xs">
                    {wallet.tokensDeployed} token(s)
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Funded Wallets */}
        {analysis.fundedWallets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Deployer Sent Funds To
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.fundedWallets.slice(0, 5).map((wallet) => (
                <WalletBadge key={wallet.address} wallet={wallet} small />
              ))}
              {analysis.fundedWallets.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{analysis.fundedWallets.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Shared Funder Wallets */}
        {analysis.sharedFunderWallets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Same Funder As
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.sharedFunderWallets.slice(0, 5).map((wallet) => (
                <WalletBadge key={wallet.address} wallet={wallet} small />
              ))}
              {analysis.sharedFunderWallets.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{analysis.sharedFunderWallets.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WalletBadge({ wallet, small = false }: { wallet: AssociatedWallet; small?: boolean }) {
  const isMixer = wallet.identity?.isMixer || wallet.riskFlags.some(f => f.toLowerCase().includes("mixer"))
  const isExchange = wallet.identity?.isExchange
  const hasTokens = wallet.tokensDeployed > 0

  return (
    <a
      href={`https://solscan.io/account/${wallet.address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors",
        isMixer ? "bg-risk-extreme/20 text-risk-extreme hover:bg-risk-extreme/30" :
        hasTokens ? "bg-risk-high/20 text-risk-high hover:bg-risk-high/30" :
        isExchange ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" :
        "bg-muted hover:bg-muted/80"
      )}
    >
      {wallet.identity?.name ? wallet.identity.name : shortenAddress(wallet.address, small ? 4 : 6)}
      {isMixer && <span title="Mixer">🌀</span>}
      {hasTokens && <span title="Also deployed tokens">🪙</span>}
      {isExchange && <span title="Exchange">🏦</span>}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  )
}
