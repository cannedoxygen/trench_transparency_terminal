"use client"

import { AssociatedWalletsAnalysis, AssociatedWallet } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GitBranch,
  Wallet,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Shield,
  Building2,
  Shuffle,
  Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WalletGraphCardProps {
  deployerAddress: string | null
  analysis: AssociatedWalletsAnalysis | null
}

export function WalletGraphCard({ deployerAddress, analysis }: WalletGraphCardProps) {
  if (!analysis || !deployerAddress) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Wallet Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to map wallet connections.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getWalletIcon = (wallet: AssociatedWallet) => {
    if (wallet.identity?.isExchange) return Building2
    if (wallet.identity?.isMixer) return Shuffle
    if (wallet.tokensDeployed > 0) return Coins
    return Wallet
  }

  const getWalletColor = (wallet: AssociatedWallet) => {
    if (wallet.identity?.isMixer) return "text-risk-extreme"
    if (wallet.riskFlags.length > 0) return "text-risk-high"
    if (wallet.identity?.isExchange) return "text-blue-500"
    if (wallet.tokensDeployed > 0) return "text-risk-moderate"
    return "text-foreground"
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Wallet Network
          </CardTitle>
          <Badge variant="outline">
            {analysis.totalAssociated} connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Graph */}
        <div className="relative pl-4 border-l-2 border-border">
          {/* Deployer Node (Root) */}
          <div className="relative mb-6">
            <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-accent border-2 border-background" />
            <div className="ml-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="font-semibold text-accent">Deployer</span>
              </div>
              <code className="text-xs text-muted-foreground">
                {formatAddress(deployerAddress)}
              </code>
            </div>
          </div>

          {/* Funding Chain (Going Up) */}
          {analysis.fundingChain.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground mb-2 ml-4">
                FUNDING CHAIN
              </div>
              {analysis.fundingChain.map((wallet, idx) => {
                const Icon = getWalletIcon(wallet)
                return (
                  <div key={wallet.address} className="relative mb-3">
                    <div className={cn(
                      "absolute -left-[21px] w-4 h-4 rounded-full border-2 border-background",
                      wallet.identity?.isMixer ? "bg-risk-extreme" :
                      wallet.identity?.isExchange ? "bg-blue-500" :
                      "bg-foreground/30"
                    )} />
                    <div className="ml-4 flex items-center gap-2">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      <div className={cn(
                        "flex-1 p-2 rounded-lg border text-sm",
                        wallet.identity?.isMixer ? "bg-risk-extreme/10 border-risk-extreme/30" :
                        wallet.riskFlags.length > 0 ? "bg-risk-high/10 border-risk-high/30" :
                        "bg-muted/30 border-border"
                      )}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", getWalletColor(wallet))} />
                          <code className="text-xs">{formatAddress(wallet.address)}</code>
                          {wallet.identity?.name && (
                            <Badge variant="outline" className="text-[10px]">
                              {wallet.identity.name}
                            </Badge>
                          )}
                        </div>
                        {wallet.riskFlags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-risk-high">
                            <AlertTriangle className="w-3 h-3" />
                            {wallet.riskFlags[0]}
                          </div>
                        )}
                        {wallet.amount && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {wallet.amount.toFixed(2)} SOL
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        L{idx + 1}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Funded Wallets (Going Down) */}
          {analysis.fundedWallets.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground mb-2 ml-4">
                FUNDED BY DEPLOYER
              </div>
              {analysis.fundedWallets.slice(0, 5).map((wallet) => {
                const Icon = getWalletIcon(wallet)
                return (
                  <div key={wallet.address} className="relative mb-3">
                    <div className={cn(
                      "absolute -left-[21px] w-4 h-4 rounded-full border-2 border-background",
                      wallet.tokensDeployed > 0 ? "bg-risk-moderate" : "bg-foreground/30"
                    )} />
                    <div className="ml-4 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className={cn(
                        "flex-1 p-2 rounded-lg border text-sm",
                        wallet.tokensDeployed > 0 ? "bg-risk-moderate/10 border-risk-moderate/30" :
                        "bg-muted/30 border-border"
                      )}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", getWalletColor(wallet))} />
                          <code className="text-xs">{formatAddress(wallet.address)}</code>
                          {wallet.tokensDeployed > 0 && (
                            <Badge variant="moderate" className="text-[10px]">
                              {wallet.tokensDeployed} tokens
                            </Badge>
                          )}
                        </div>
                        {wallet.amount && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Received {wallet.amount.toFixed(2)} SOL
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {analysis.fundedWallets.length > 5 && (
                <div className="ml-4 text-xs text-muted-foreground">
                  + {analysis.fundedWallets.length - 5} more wallets
                </div>
              )}
            </div>
          )}

          {/* Related Deployers */}
          {analysis.relatedDeployers.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground mb-2 ml-4">
                RELATED DEPLOYERS
              </div>
              {analysis.relatedDeployers.map((wallet) => (
                <div key={wallet.address} className="relative mb-3">
                  <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-risk-high border-2 border-background" />
                  <div className="ml-4 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground rotate-90" />
                    <div className="flex-1 p-2 rounded-lg bg-risk-high/10 border border-risk-high/30 text-sm">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-risk-high" />
                        <code className="text-xs">{formatAddress(wallet.address)}</code>
                        <Badge variant="high" className="text-[10px]">
                          {wallet.tokensDeployed} tokens deployed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-accent" />
            Deployer
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-risk-extreme" />
            Mixer
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Exchange
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-risk-moderate" />
            Token Deployer
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-foreground/30" />
            Wallet
          </div>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-1 border-t border-border pt-4">
            {analysis.warnings.map((warning, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-risk-high">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
