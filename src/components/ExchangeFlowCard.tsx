"use client"

import { ExchangeFlowAnalysis } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, Building2, AlertTriangle, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExchangeFlowCardProps {
  analysis: ExchangeFlowAnalysis | null
}

export function ExchangeFlowCard({ analysis }: ExchangeFlowCardProps) {
  if (!analysis || (analysis.recentTransfers.length === 0 && !analysis.cashOutDetected)) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Exchange Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No exchange activity detected for this deployer.
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
            <Building2 className="w-5 h-5" />
            Exchange Activity
          </CardTitle>
          {analysis.cashOutDetected && (
            <Badge variant="extreme" className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Cash Out
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            {analysis.warnings.map((warning, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg text-sm",
                  analysis.cashOutDetected ? "bg-risk-extreme/10" : "bg-risk-high/10"
                )}
              >
                <AlertTriangle className={cn(
                  "w-4 h-4 shrink-0 mt-0.5",
                  analysis.cashOutDetected ? "text-risk-extreme" : "text-risk-high"
                )} />
                <span className={analysis.cashOutDetected ? "text-risk-extreme" : "text-risk-high"}>
                  {warning}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Flow Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn("p-3 rounded-lg", analysis.totalDeposits > 10 ? "bg-risk-high/10" : "bg-muted/50")}>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs">Deposits</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              analysis.totalDeposits > 10 ? "text-risk-high" : ""
            )}>
              {analysis.totalDeposits.toFixed(2)} SOL
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <ArrowDownLeft className="w-4 h-4" />
              <span className="text-xs">Withdrawals</span>
            </div>
            <div className="text-lg font-bold">
              {analysis.totalWithdrawals.toFixed(2)} SOL
            </div>
          </div>
        </div>

        {/* Exchanges Used */}
        {analysis.exchangesUsed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Exchanges Used</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.exchangesUsed.map((exchange) => (
                <Badge key={exchange} variant="outline" className="text-xs">
                  {exchange}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transfers */}
        {analysis.recentTransfers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Recent Activity</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {analysis.recentTransfers.slice(0, 10).map((transfer, i) => (
                <div
                  key={transfer.signature}
                  className={cn(
                    "flex items-center justify-between p-2 rounded text-sm",
                    transfer.direction === "deposit" ? "bg-risk-high/5" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {transfer.direction === "deposit" ? (
                      <ArrowUpRight className="w-4 h-4 text-risk-high" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {transfer.direction === "deposit" ? "To" : "From"}
                    </span>
                    <span className="font-medium">{transfer.exchange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-sm",
                      transfer.direction === "deposit" ? "text-risk-high" : "text-green-500"
                    )}>
                      {transfer.direction === "deposit" ? "-" : "+"}
                      {transfer.amount.toFixed(2)} {transfer.token}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(transfer.timestamp)}
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

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)

  if (seconds < 60) return "now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return `${Math.floor(seconds / 604800)}w`
}
