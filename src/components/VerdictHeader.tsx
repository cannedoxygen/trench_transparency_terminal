import { RiskScore } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface VerdictHeaderProps {
  riskScore: RiskScore
}

export function VerdictHeader({ riskScore }: VerdictHeaderProps) {
  const { score, label, reasons } = riskScore

  const getBadgeVariant = () => {
    switch (label) {
      case "low":
        return "low"
      case "moderate":
        return "moderate"
      case "high":
        return "high"
      case "extreme":
        return "extreme"
      default:
        return "secondary"
    }
  }

  const getScoreColor = () => {
    switch (label) {
      case "low":
        return "text-risk-low"
      case "moderate":
        return "text-risk-moderate"
      case "high":
        return "text-risk-high"
      case "extreme":
        return "text-risk-extreme"
      default:
        return "text-foreground"
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className={cn("text-5xl font-bold", getScoreColor())}>
            {score}
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Risk Score</div>
            <Badge variant={getBadgeVariant()} className="text-sm">
              {label.toUpperCase()} RISK
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Score range: 0-100
        </div>
      </div>

      {/* Risk Reasons */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold mb-3">Signals Detected</h3>
        <ul className="space-y-2">
          {reasons.map((reason, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="text-accent mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Unknowns */}
      {riskScore.unknowns.length > 0 && (
        <div className="border-t border-border pt-4 mt-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
            Uncertainties
          </h3>
          <ul className="space-y-2">
            {riskScore.unknowns.map((unknown, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-yellow-500 mt-0.5">?</span>
                <span>{unknown}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
