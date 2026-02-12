"use client"

import { AISummary } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, AlertTriangle, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AISummaryCardProps {
  summary: AISummary
}

export function AISummaryCard({ summary }: AISummaryCardProps) {
  const getVerdictConfig = () => {
    switch (summary.verdict) {
      case "extreme_danger":
        return {
          icon: XCircle,
          color: "text-risk-extreme",
          bgColor: "bg-risk-extreme/10",
          borderColor: "border-risk-extreme/30",
          badge: "extreme",
          label: "EXTREME RISK",
        }
      case "danger":
        return {
          icon: AlertTriangle,
          color: "text-risk-high",
          bgColor: "bg-risk-high/10",
          borderColor: "border-risk-high/30",
          badge: "high",
          label: "HIGH RISK",
        }
      case "caution":
        return {
          icon: AlertCircle,
          color: "text-risk-moderate",
          bgColor: "bg-risk-moderate/10",
          borderColor: "border-risk-moderate/30",
          badge: "moderate",
          label: "CAUTION",
        }
      default:
        return {
          icon: CheckCircle,
          color: "text-risk-low",
          bgColor: "bg-risk-low/10",
          borderColor: "border-risk-low/30",
          badge: "low",
          label: "LOWER RISK",
        }
    }
  }

  const config = getVerdictConfig()
  const Icon = config.icon

  return (
    <Card className={cn("border-2", config.borderColor, config.bgColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analysis
          </CardTitle>
          <Badge variant={config.badge as "low" | "moderate" | "high" | "extreme"}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline */}
        <div className="flex items-start gap-3">
          <Icon className={cn("w-6 h-6 mt-0.5 shrink-0", config.color)} />
          <h3 className={cn("text-xl font-bold", config.color)}>
            {summary.headline}
          </h3>
        </div>

        {/* Summary */}
        <p className="text-foreground leading-relaxed">
          {summary.summary}
        </p>

        {/* Key Points */}
        {summary.keyPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Key Findings</h4>
            <ul className="space-y-1">
              {summary.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={cn("mt-1", config.color)}>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div className={cn("p-3 rounded-lg", config.bgColor)}>
          <p className="text-sm font-medium">
            💡 {summary.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
