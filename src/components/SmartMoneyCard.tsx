"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Loader2,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { analyzeSmartMoney, SmartMoneyAnalysis } from "@/lib/smartmoney/tracker"

interface SmartMoneyCardProps {
  tokenMint: string
  topHolders: Array<{ address: string; percentage: number }>
  tokenCreatedAt: number | null
}

export function SmartMoneyCard({
  tokenMint,
  topHolders,
  tokenCreatedAt,
}: SmartMoneyCardProps) {
  const [analysis, setAnalysis] = useState<SmartMoneyAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const runAnalysis = async () => {
    setIsLoading(true)
    try {
      const result = await analyzeSmartMoney(tokenMint, topHolders, tokenCreatedAt)
      setAnalysis(result)
      setHasChecked(true)
    } catch (error) {
      console.error("Smart money analysis error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentConfig = () => {
    if (!analysis) return { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/50" }

    switch (analysis.sentiment) {
      case "bullish":
        return { icon: TrendingUp, color: "text-risk-low", bg: "bg-risk-low/10" }
      case "bearish":
        return { icon: TrendingDown, color: "text-risk-high", bg: "bg-risk-high/10" }
      default:
        return { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/50" }
    }
  }

  const config = getSentimentConfig()
  const SentimentIcon = config.icon

  // Show loading or analyze button if not checked yet
  if (!hasChecked) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Smart Money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Brain className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Analyze top holders to find high-reputation wallets
            </p>
            <Button
              onClick={runAnalysis}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Find Smart Money
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This may take a few seconds
            </p>
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
            <Brain className="w-5 h-5" />
            Smart Money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to analyze smart money.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Smart Money
          </CardTitle>
          <Badge
            variant={
              analysis.sentiment === "bullish" ? "low" :
              analysis.sentiment === "bearish" ? "high" : "outline"
            }
          >
            {analysis.sentiment.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className={cn("p-4 rounded-lg", config.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SentimentIcon className={cn("w-8 h-8", config.color)} />
              <div>
                <div className="text-2xl font-bold">
                  {analysis.smartMoneyCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Smart Wallets
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn("text-2xl font-bold", config.color)}>
                {analysis.smartMoneyHolding.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Holdings
              </div>
            </div>
          </div>
        </div>

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

        {/* Top Smart Money Wallets */}
        {analysis.topSmartMoney.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Top Smart Money Holders
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analysis.topSmartMoney.slice(0, 5).map((wallet) => (
                <div
                  key={wallet.address}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Shield className={cn(
                      "w-4 h-4",
                      wallet.reputation >= 70 ? "text-risk-low" : "text-foreground"
                    )} />
                    <div>
                      <div className="font-mono text-xs">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                      {wallet.knownAs && (
                        <div className="text-xs text-muted-foreground">
                          {wallet.knownAs}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {wallet.isEarlyBuyer && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Early
                      </Badge>
                    )}
                    <div className="text-right">
                      <div className="font-semibold">
                        {wallet.holdingPercentage.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {wallet.reputation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {analysis.topSmartMoney.length === 0 && (
          <div className="py-4 text-center text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No high-reputation wallets found among top holders</p>
          </div>
        )}

        {/* Re-analyze button */}
        <Button
          variant="outline"
          size="sm"
          onClick={runAnalysis}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Re-analyze
        </Button>
      </CardContent>
    </Card>
  )
}
