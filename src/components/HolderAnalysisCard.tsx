"use client"

import { HolderAnalysis } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Target, Eye, AlertTriangle, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface HolderAnalysisCardProps {
  analysis: HolderAnalysis | null
}

export function HolderAnalysisCard({ analysis }: HolderAnalysisCardProps) {
  if (!analysis || analysis.totalHolders === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Holder Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to analyze token holders.
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
    <Card className={cn("border", analysis.riskLevel === "extreme" || analysis.riskLevel === "high" ? config.borderColor : "")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Holder Analysis
          </CardTitle>
          <Badge variant={config.badge}>
            {analysis.totalHolders.toLocaleString()} Holders
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBox
            label="Top 10"
            value={`${analysis.top10Concentration}%`}
            icon={<Wallet className="w-4 h-4" />}
            warning={analysis.top10Concentration > 80}
          />
          <MetricBox
            label="Snipers"
            value={analysis.sniperCount.toString()}
            icon={<Target className="w-4 h-4" />}
            warning={analysis.sniperCount >= 5}
          />
          <MetricBox
            label="Insiders"
            value={analysis.insiderCount.toString()}
            icon={<Eye className="w-4 h-4" />}
            warning={analysis.insiderCount >= 3}
          />
          <MetricBox
            label="Deployer"
            value={`${analysis.deployerHolding}%`}
            icon={<Users className="w-4 h-4" />}
            warning={analysis.deployerHolding > 20}
          />
        </div>

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

        {/* Top Holders Table */}
        {analysis.topHolders.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Top Holders</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Address</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.topHolders.slice(0, 10).map((holder, i) => (
                    <tr key={holder.address} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                          </span>
                          {holder.identity && (
                            <Badge variant="outline" className="text-xs">
                              {holder.identity}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className={cn(
                        "py-2 text-right font-medium",
                        holder.percentage > 10 ? "text-risk-high" : ""
                      )}>
                        {holder.percentage}%
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {holder.isDeployer && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                              DEV
                            </Badge>
                          )}
                          {holder.isSniper && (
                            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                              SNIPER
                            </Badge>
                          )}
                          {holder.isInsider && !holder.isDeployer && !holder.isSniper && (
                            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                              INSIDER
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricBox({
  label,
  value,
  icon,
  warning,
}: {
  label: string
  value: string
  icon: React.ReactNode
  warning?: boolean
}) {
  return (
    <div className={cn(
      "p-3 rounded-lg text-center",
      warning ? "bg-risk-high/10" : "bg-muted/50"
    )}>
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={cn(
        "text-lg font-bold",
        warning ? "text-risk-high" : ""
      )}>
        {value}
      </div>
    </div>
  )
}
