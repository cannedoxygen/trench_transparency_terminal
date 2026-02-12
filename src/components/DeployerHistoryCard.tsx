"use client"

import { DeployerHistory } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, AlertTriangle, CheckCircle, XCircle, Skull } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeployerHistoryCardProps {
  history: DeployerHistory | null
  deployerAddress: string | null
}

export function DeployerHistoryCard({ history, deployerAddress }: DeployerHistoryCardProps) {
  if (!history || history.totalTokens === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Deployer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {deployerAddress
              ? "No previous token launches found for this deployer."
              : "Deployer address unknown - cannot check history."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRiskConfig = () => {
    switch (history.riskLevel) {
      case "extreme":
        return {
          color: "text-risk-extreme",
          bgColor: "bg-risk-extreme/10",
          borderColor: "border-risk-extreme/30",
          badge: "extreme" as const,
          icon: Skull,
        }
      case "high":
        return {
          color: "text-risk-high",
          bgColor: "bg-risk-high/10",
          borderColor: "border-risk-high/30",
          badge: "high" as const,
          icon: AlertTriangle,
        }
      case "medium":
        return {
          color: "text-risk-moderate",
          bgColor: "bg-risk-moderate/10",
          borderColor: "border-risk-moderate/30",
          badge: "moderate" as const,
          icon: AlertTriangle,
        }
      default:
        return {
          color: "text-risk-low",
          bgColor: "bg-risk-low/10",
          borderColor: "border-risk-low/30",
          badge: "low" as const,
          icon: CheckCircle,
        }
    }
  }

  const config = getRiskConfig()
  const Icon = config.icon

  return (
    <Card className={cn("border-2", config.borderColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Deployer History
          </CardTitle>
          <Badge variant={config.badge}>
            {history.rugRate}% Rug Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className={cn("p-3 rounded-lg text-center", config.bgColor)}>
            <div className="text-2xl font-bold">{history.totalTokens}</div>
            <div className="text-xs text-muted-foreground">Total Tokens</div>
          </div>
          <div className={cn("p-3 rounded-lg text-center", history.ruggedTokens > 0 ? "bg-risk-high/10" : "bg-risk-low/10")}>
            <div className={cn("text-2xl font-bold", history.ruggedTokens > 0 ? "text-risk-high" : "text-risk-low")}>
              {history.ruggedTokens}
            </div>
            <div className="text-xs text-muted-foreground">Rugged</div>
          </div>
          <div className={cn("p-3 rounded-lg text-center", config.bgColor)}>
            <div className={cn("text-2xl font-bold", config.color)}>
              {history.rugRate}%
            </div>
            <div className="text-xs text-muted-foreground">Rug Rate</div>
          </div>
        </div>

        {/* Warning Message */}
        {history.rugRate > 50 && (
          <div className="flex items-start gap-2 p-3 bg-risk-extreme/10 rounded-lg border border-risk-extreme/30">
            <Icon className="w-5 h-5 text-risk-extreme shrink-0 mt-0.5" />
            <p className="text-sm text-risk-extreme font-medium">
              This deployer has rugged more than half of their token launches. Extreme caution advised.
            </p>
          </div>
        )}

        {/* Recent Tokens */}
        {history.tokens.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Recent Launches</h4>
            <div className="space-y-2">
              {history.tokens.slice(0, 5).map((token, i) => (
                <div
                  key={token.mint || i}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg text-sm",
                    token.isRugged ? "bg-risk-high/10" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {token.isRugged ? (
                      <XCircle className="w-4 h-4 text-risk-high" />
                    ) : token.currentStatus === "active" ? (
                      <CheckCircle className="w-4 h-4 text-risk-low" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted-foreground/30" />
                    )}
                    <span className="font-medium">
                      {token.name || token.symbol || token.mint.slice(0, 8) + "..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {token.isRugged && (
                      <Badge variant="high" className="text-xs">RUGGED</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(token.deployedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
