"use client"

import { InsiderAnalysis, InsiderCluster } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  AlertTriangle,
  Link2,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface InsiderClustersCardProps {
  analysis: InsiderAnalysis | null
}

export function InsiderClustersCard({ analysis }: InsiderClustersCardProps) {
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set())

  if (!analysis || analysis.clusters.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Insider Clusters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No coordinated insider clusters detected.
          </p>
        </CardContent>
      </Card>
    )
  }

  const toggleCluster = (id: number) => {
    const newExpanded = new Set(expandedClusters)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedClusters(newExpanded)
  }

  const getRiskConfig = () => {
    switch (analysis.riskLevel) {
      case "extreme":
        return {
          color: "text-risk-extreme",
          bgColor: "bg-risk-extreme/10",
          borderColor: "border-risk-extreme/30",
        }
      case "high":
        return {
          color: "text-risk-high",
          bgColor: "bg-risk-high/10",
          borderColor: "border-risk-high/30",
        }
      case "medium":
        return {
          color: "text-risk-moderate",
          bgColor: "bg-risk-moderate/10",
          borderColor: "border-risk-moderate/30",
        }
      default:
        return {
          color: "text-risk-low",
          bgColor: "bg-risk-low/10",
          borderColor: "border-risk-low/30",
        }
    }
  }

  const getClusterRiskBadge = (riskLevel: InsiderCluster["riskLevel"]) => {
    switch (riskLevel) {
      case "extreme": return "extreme" as const
      case "high": return "high" as const
      case "medium": return "moderate" as const
      default: return "low" as const
    }
  }

  const getClusterTypeIcon = (type: InsiderCluster["type"]) => {
    switch (type) {
      case "same_funder": return Link2
      case "fund_network": return Wallet
      case "coordinated_buy": return Users
      default: return Users
    }
  }

  const config = getRiskConfig()

  return (
    <Card className={cn("border", analysis.riskLevel !== "low" ? config.borderColor : "")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Insider Clusters
          </CardTitle>
          <Badge variant={getClusterRiskBadge(analysis.riskLevel)}>
            {analysis.riskLevel.toUpperCase()} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={cn("p-3 rounded-lg text-center", config.bgColor)}>
            <div className="text-2xl font-bold">{analysis.clusters.length}</div>
            <div className="text-xs text-muted-foreground">Clusters</div>
          </div>
          <div className={cn("p-3 rounded-lg text-center", analysis.totalInsiders > 5 ? "bg-risk-high/10" : "bg-muted/50")}>
            <div className={cn("text-2xl font-bold", analysis.totalInsiders > 5 ? "text-risk-high" : "")}>
              {analysis.totalInsiders}
            </div>
            <div className="text-xs text-muted-foreground">Insiders</div>
          </div>
          <div className={cn("p-3 rounded-lg text-center", analysis.totalInsiderHolding > 15 ? "bg-risk-high/10" : "bg-muted/50")}>
            <div className={cn("text-2xl font-bold", analysis.totalInsiderHolding > 15 ? "text-risk-high" : "")}>
              {analysis.totalInsiderHolding.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Holding</div>
          </div>
        </div>

        {/* Coordination Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Coordination Score</span>
            <span className={cn(
              "font-semibold",
              analysis.coordinationScore > 60 ? "text-risk-extreme" :
              analysis.coordinationScore > 40 ? "text-risk-high" :
              analysis.coordinationScore > 20 ? "text-risk-moderate" : ""
            )}>
              {analysis.coordinationScore}/100
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                analysis.coordinationScore > 60 ? "bg-risk-extreme" :
                analysis.coordinationScore > 40 ? "bg-risk-high" :
                analysis.coordinationScore > 20 ? "bg-risk-moderate" : "bg-risk-low"
              )}
              style={{ width: `${analysis.coordinationScore}%` }}
            />
          </div>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            {analysis.warnings.map((warning, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg text-sm",
                  "bg-risk-high/10"
                )}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-risk-high" />
                <span className="text-risk-high">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Clusters List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Detected Clusters</h4>

          {analysis.clusters.map((cluster) => {
            const ClusterIcon = getClusterTypeIcon(cluster.type)
            const isExpanded = expandedClusters.has(cluster.id)

            return (
              <div
                key={cluster.id}
                className={cn(
                  "border rounded-lg overflow-hidden",
                  cluster.riskLevel === "extreme" ? "border-risk-extreme/30" :
                  cluster.riskLevel === "high" ? "border-risk-high/30" : "border-border"
                )}
              >
                {/* Cluster Header */}
                <button
                  onClick={() => toggleCluster(cluster.id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ClusterIcon className={cn(
                      "w-5 h-5",
                      cluster.riskLevel === "extreme" ? "text-risk-extreme" :
                      cluster.riskLevel === "high" ? "text-risk-high" : "text-muted-foreground"
                    )} />
                    <div className="text-left">
                      <div className="font-semibold text-sm">{cluster.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cluster.wallets.length} wallets - {cluster.totalHolding.toFixed(1)}% holding
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getClusterRiskBadge(cluster.riskLevel)} className="text-xs">
                      {cluster.riskLevel}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                    {/* Cluster Warnings */}
                    {cluster.warnings.length > 0 && (
                      <div className="space-y-1">
                        {cluster.warnings.map((warning, i) => (
                          <div key={i} className="text-xs text-risk-high flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Common Funder */}
                    {cluster.commonFunder && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Common Funder: </span>
                        <code className="bg-muted px-1 py-0.5 rounded">
                          {cluster.commonFunder.slice(0, 8)}...{cluster.commonFunder.slice(-4)}
                        </code>
                      </div>
                    )}

                    {/* Wallets List */}
                    <div className="space-y-1">
                      {cluster.wallets.map((wallet) => (
                        <div
                          key={wallet.address}
                          className="flex items-center justify-between p-2 rounded bg-background text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Wallet className={cn(
                              "w-3 h-3",
                              wallet.clusterRole === "leader" ? "text-accent" : "text-muted-foreground"
                            )} />
                            <code className="text-muted-foreground">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </code>
                            {wallet.clusterRole === "leader" && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                Lead
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {wallet.riskFlags.map((flag, i) => (
                              <Badge key={i} variant="high" className="text-[10px] px-1 py-0">
                                {flag}
                              </Badge>
                            ))}
                            <span className="font-mono font-semibold">
                              {wallet.holding.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
