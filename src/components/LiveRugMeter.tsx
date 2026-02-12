"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  AlertTriangle,
  Pause,
  Play,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  checkLiveSignals,
  calculateLiveRiskAdjustment,
  getSeverityColor,
  getSeverityBg,
  LiveSignal,
} from "@/lib/live/monitor"

interface LiveRugMeterProps {
  baseRiskScore: number
  tokenMint: string
  deployerAddress: string | null
  topHolders: string[]
}

const POLL_INTERVAL = 30000 // 30 seconds

export function LiveRugMeter({
  baseRiskScore,
  tokenMint,
  deployerAddress,
  topHolders,
}: LiveRugMeterProps) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [signals, setSignals] = useState<LiveSignal[]>([])
  const [liveScore, setLiveScore] = useState(baseRiskScore)
  const [trend, setTrend] = useState<"stable" | "increasing" | "decreasing">("stable")
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkForUpdates = useCallback(async () => {
    if (!deployerAddress) return

    setIsLoading(true)
    try {
      const newSignals = await checkLiveSignals(tokenMint, deployerAddress, topHolders)
      const adjustment = calculateLiveRiskAdjustment(newSignals)
      const newScore = Math.min(100, baseRiskScore + adjustment)

      // Determine trend
      if (newScore > liveScore) {
        setTrend("increasing")
      } else if (newScore < liveScore) {
        setTrend("decreasing")
      } else {
        setTrend("stable")
      }

      setSignals(newSignals)
      setLiveScore(newScore)
      setLastUpdate(Date.now())
    } catch (error) {
      console.error("Live monitor error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [tokenMint, deployerAddress, topHolders, baseRiskScore, liveScore])

  // Polling effect
  useEffect(() => {
    if (!isMonitoring) return

    // Initial check
    checkForUpdates()

    // Set up interval
    const interval = setInterval(checkForUpdates, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [isMonitoring, checkForUpdates])

  const getRiskLabel = (score: number) => {
    if (score > 75) return "EXTREME"
    if (score > 50) return "HIGH"
    if (score > 25) return "MODERATE"
    return "LOW"
  }

  const getRiskColor = (score: number) => {
    if (score > 75) return "text-risk-extreme"
    if (score > 50) return "text-risk-high"
    if (score > 25) return "text-risk-moderate"
    return "text-risk-low"
  }

  const getMeterColor = (score: number) => {
    if (score > 75) return "bg-risk-extreme"
    if (score > 50) return "bg-risk-high"
    if (score > 25) return "bg-risk-moderate"
    return "bg-risk-low"
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  const TrendIcon = trend === "increasing" ? TrendingUp : trend === "decreasing" ? TrendingDown : Minus

  return (
    <Card className={cn(
      "border",
      liveScore > 75 ? "border-risk-extreme/30" :
      liveScore > 50 ? "border-risk-high/30" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Risk Monitor
            {isMonitoring && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isMonitoring && lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {formatTimeAgo(lastUpdate)}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={cn(
                "gap-1",
                isMonitoring ? "text-green-500 border-green-500/30" : ""
              )}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-3 h-3" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Monitor
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Meter */}
        <div className="space-y-3">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("text-4xl font-bold tabular-nums", getRiskColor(liveScore))}>
                {liveScore}
              </div>
              <div className="flex flex-col">
                <span className={cn("font-semibold", getRiskColor(liveScore))}>
                  {getRiskLabel(liveScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Base: {baseRiskScore}
                </span>
              </div>
            </div>

            {/* Trend Indicator */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-sm",
              trend === "increasing" ? "bg-risk-high/10 text-risk-high" :
              trend === "decreasing" ? "bg-risk-low/10 text-risk-low" :
              "bg-muted text-muted-foreground"
            )}>
              <TrendIcon className="w-4 h-4" />
              <span className="capitalize">{trend}</span>
            </div>
          </div>

          {/* Visual Meter */}
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 transition-all duration-500",
                getMeterColor(liveScore)
              )}
              style={{ width: `${liveScore}%` }}
            />
            {/* Base score marker */}
            <div
              className="absolute inset-y-0 w-0.5 bg-foreground/50"
              style={{ left: `${baseRiskScore}%` }}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Safe</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Extreme</span>
          </div>
        </div>

        {/* Status */}
        {!isMonitoring ? (
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Radio className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click &quot;Monitor&quot; to enable real-time rug detection
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Checks every 30 seconds for suspicious activity
            </p>
          </div>
        ) : signals.length === 0 ? (
          <div className="p-4 rounded-lg bg-risk-low/10 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-risk-low" />
            <p className="text-sm text-risk-low font-medium">
              No suspicious activity detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Monitoring deployer and top holders...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-risk-high" />
                Recent Alerts ({signals.length})
              </h4>
              {isLoading && (
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {signals.map((signal, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg text-sm",
                    getSeverityBg(signal.severity)
                  )}
                >
                  <AlertTriangle className={cn(
                    "w-4 h-4 shrink-0 mt-0.5",
                    getSeverityColor(signal.severity)
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={getSeverityColor(signal.severity)}>
                      {signal.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(signal.timestamp * 1000)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      signal.severity === "critical" ? "extreme" :
                      signal.severity === "danger" ? "high" :
                      signal.severity === "warning" ? "moderate" : "low"
                    }
                    className="shrink-0 text-xs"
                  >
                    {signal.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Live monitoring is not financial advice. Always DYOR.
        </p>
      </CardContent>
    </Card>
  )
}
