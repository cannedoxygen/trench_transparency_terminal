import { FundingInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { shortenAddress, formatTimestamp } from "@/lib/utils"
import { ExternalLink, AlertTriangle, Building2, Shuffle, Globe } from "lucide-react"

interface FundingSourceCardProps {
  funding: FundingInfo
}

export function FundingSourceCard({ funding }: FundingSourceCardProps) {
  const getSourceIcon = () => {
    switch (funding.sourceType) {
      case "exchange":
        return <Building2 className="w-5 h-5" />
      case "mixer":
        return <Shuffle className="w-5 h-5 text-risk-extreme" />
      case "bridge":
        return <Globe className="w-5 h-5 text-risk-moderate" />
      default:
        return <AlertTriangle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getSourceBadge = () => {
    switch (funding.sourceType) {
      case "mixer":
        return <Badge variant="extreme">Mixer</Badge>
      case "bridge":
        return <Badge variant="moderate">Bridge</Badge>
      case "exchange":
        return <Badge variant="secondary">Exchange</Badge>
      case "direct":
        return <Badge variant="low">Direct</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSourceDescription = () => {
    switch (funding.sourceType) {
      case "mixer":
        return "This wallet was funded through a mixing service, which is commonly used to obscure the source of funds."
      case "bridge":
        return "This wallet was funded via a cross-chain bridge, making it harder to trace the original source."
      case "exchange":
        return "This wallet was funded from a centralized exchange withdrawal."
      case "direct":
        return "This wallet was funded directly from another known wallet."
      default:
        return "The original funding source could not be determined."
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Funding Source</CardTitle>
          {getSourceBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Type */}
        <div className="flex items-center gap-3">
          {getSourceIcon()}
          <div>
            <div className="font-medium capitalize">
              {funding.sourceType === "unknown"
                ? "Unknown Source"
                : `${funding.sourceType} Funded`}
            </div>
            {funding.taggedEntity && (
              <div className="text-sm text-muted-foreground">
                {funding.taggedEntity}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{getSourceDescription()}</p>

        {/* Source Address */}
        {funding.sourceAddress && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Funding Address
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {shortenAddress(funding.sourceAddress, 8)}
              </code>
              <a
                href={`https://solscan.io/account/${funding.sourceAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-muted rounded transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {funding.timestamp && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Funding Date
            </div>
            <div className="text-sm">{formatTimestamp(funding.timestamp)}</div>
          </div>
        )}

        {/* Confidence */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="capitalize">{funding.confidence}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
