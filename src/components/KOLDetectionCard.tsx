"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Megaphone,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Twitter,
  Youtube,
  MessageCircle,
  HelpCircle,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { detectKOLConnections, KOLAnalysis, KOLConnection } from "@/lib/kol/detector"

interface KOLDetectionCardProps {
  tokenMint: string
  topHolders: Array<{ address: string; percentage: number }>
  deployerAddress: string | null
  fundingChain: string[]
}

export function KOLDetectionCard({
  tokenMint,
  topHolders,
  deployerAddress,
  fundingChain,
}: KOLDetectionCardProps) {
  const [analysis, setAnalysis] = useState<KOLAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const runDetection = async () => {
    setIsLoading(true)
    try {
      const result = await detectKOLConnections(
        tokenMint,
        topHolders,
        deployerAddress,
        fundingChain
      )
      setAnalysis(result)
      setHasChecked(true)
    } catch (error) {
      console.error("KOL detection error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlatformIcon = (platform: KOLConnection["profile"]["platform"]) => {
    switch (platform) {
      case "twitter": return Twitter
      case "youtube": return Youtube
      case "telegram": return MessageCircle
      case "discord": return MessageCircle
      default: return HelpCircle
    }
  }

  if (!hasChecked) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Influencer Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Check for known influencer/KOL connections
            </p>
            <Button
              onClick={runDetection}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  Detect KOLs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Influencer Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to detect KOL connections.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "border",
      analysis.riskLevel === "high" ? "border-risk-high/30" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Influencer Detection
          </CardTitle>
          {analysis.kolCount > 0 && (
            <Badge
              variant={
                analysis.riskLevel === "high" ? "high" :
                analysis.riskLevel === "medium" ? "moderate" : "outline"
              }
            >
              {analysis.kolCount} Found
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-muted-foreground">
          {analysis.summary}
        </p>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-1">
            {analysis.warnings.map((warning, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-risk-high">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Positives */}
        {analysis.positives.length > 0 && (
          <div className="space-y-1">
            {analysis.positives.map((positive, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-risk-low">
                <CheckCircle className="w-3 h-3 shrink-0" />
                {positive}
              </div>
            ))}
          </div>
        )}

        {/* Connections */}
        {analysis.connections.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Detected Connections
            </h4>
            <div className="space-y-2">
              {analysis.connections.map((connection) => {
                const PlatformIcon = getPlatformIcon(connection.profile.platform)
                return (
                  <div
                    key={connection.address}
                    className={cn(
                      "p-3 rounded-lg border text-sm",
                      connection.profile.risk === "high" ? "bg-risk-high/10 border-risk-high/30" :
                      connection.profile.risk === "medium" ? "bg-risk-moderate/10 border-risk-moderate/30" :
                      "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PlatformIcon className="w-4 h-4" />
                        <span className="font-semibold">{connection.profile.name}</span>
                        {connection.profile.verified && (
                          <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                        )}
                      </div>
                      <Badge
                        variant={
                          connection.significance === "high" ? "high" :
                          connection.significance === "medium" ? "moderate" : "outline"
                        }
                        className="text-xs"
                      >
                        {connection.significance}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <code>{connection.address.slice(0, 6)}...{connection.address.slice(-4)}</code>
                        <Badge variant="outline" className="text-[10px]">
                          {connection.relationship.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {connection.holdingPercentage !== null && (
                        <span>Holds {connection.holdingPercentage.toFixed(2)}%</span>
                      )}
                    </div>
                    {connection.profile.followers && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {connection.profile.followers.toLocaleString()} followers
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {analysis.connections.length === 0 && (
          <div className="py-4 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No known influencer connections detected</p>
            <p className="text-xs mt-1">
              This doesn&apos;t guarantee no KOL involvement - just none we can detect
            </p>
          </div>
        )}

        {/* Re-scan button */}
        <Button
          variant="outline"
          size="sm"
          onClick={runDetection}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Re-scan
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          KOL detection is based on known wallet databases and may not be complete
        </p>
      </CardContent>
    </Card>
  )
}
