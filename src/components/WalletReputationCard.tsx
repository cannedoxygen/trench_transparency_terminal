"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Coins,
  Link2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WalletReputation, getReputationColor, getReputationBadge } from "@/lib/reputation/scorer"

interface WalletReputationCardProps {
  initialAddress?: string
  showSearch?: boolean
}

export function WalletReputationCard({
  initialAddress,
  showSearch = true,
}: WalletReputationCardProps) {
  const [address, setAddress] = useState(initialAddress || "")
  const [reputation, setReputation] = useState<WalletReputation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkReputation = async (addressToCheck?: string) => {
    const targetAddress = addressToCheck || address
    if (!targetAddress.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reputation?address=${targetAddress}`)
      const data = await response.json()

      if (data.success && data.data) {
        setReputation(data.data)
      } else {
        setError(data.error || "Failed to check reputation")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-check if initial address provided
  useEffect(() => {
    if (initialAddress) {
      checkReputation(initialAddress)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getShieldIcon = () => {
    if (!reputation) return ShieldQuestion
    switch (reputation.label) {
      case "trusted": return ShieldCheck
      case "dangerous": return ShieldAlert
      case "suspicious": return ShieldAlert
      default: return Shield
    }
  }

  const ShieldIcon = getShieldIcon()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Wallet Reputation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {showSearch && (
          <div className="flex gap-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter wallet address..."
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={() => checkReputation()}
              disabled={isLoading || !address.trim()}
              className="gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Check
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-risk-high/10 text-risk-high text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Analyzing wallet...</p>
          </div>
        )}

        {/* Reputation Display */}
        {reputation && !isLoading && (
          <div className="space-y-4">
            {/* Main Score */}
            <div className={cn(
              "p-4 rounded-lg",
              reputation.label === "trusted" ? "bg-risk-low/10" :
              reputation.label === "dangerous" ? "bg-risk-extreme/10" :
              reputation.label === "suspicious" ? "bg-risk-moderate/10" :
              "bg-muted/50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldIcon className={cn(
                    "w-10 h-10",
                    getReputationColor(reputation.label)
                  )} />
                  <div>
                    <div className={cn(
                      "text-3xl font-bold",
                      getReputationColor(reputation.label)
                    )}>
                      {reputation.score}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reputation Score
                    </div>
                  </div>
                </div>
                <Badge variant={getReputationBadge(reputation.label)} className="text-sm">
                  {reputation.label.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-2">
              <ScoreBreakdownItem
                icon={Clock}
                label="Account Age"
                value={reputation.breakdown.accountAge}
                maxValue={20}
              />
              <ScoreBreakdownItem
                icon={Activity}
                label="Activity"
                value={reputation.breakdown.activityLevel}
                maxValue={15}
              />
              <ScoreBreakdownItem
                icon={Coins}
                label="Deploy History"
                value={reputation.breakdown.tokenDeployHistory}
                maxValue={25}
                canBeNegative
              />
              <ScoreBreakdownItem
                icon={Link2}
                label="Associations"
                value={reputation.breakdown.associationRisk}
                maxValue={20}
                canBeNegative
              />
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              {reputation.details.isDeployer && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Tokens Deployed</span>
                  <span className="font-semibold">{reputation.details.tokensDeployed}</span>
                </div>
              )}
              {reputation.details.rugRate !== null && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Rug Rate</span>
                  <span className={cn(
                    "font-semibold",
                    reputation.details.rugRate > 50 ? "text-risk-extreme" :
                    reputation.details.rugRate > 25 ? "text-risk-high" : ""
                  )}>
                    {reputation.details.rugRate}%
                  </span>
                </div>
              )}
              {reputation.details.knownEntity && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Known As</span>
                  <span className="font-semibold">{reputation.details.knownEntity}</span>
                </div>
              )}
            </div>

            {/* Flags & Positives */}
            {reputation.flags.length > 0 && (
              <div className="space-y-1">
                {reputation.flags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-risk-high">
                    <AlertTriangle className="w-3 h-3" />
                    {flag}
                  </div>
                ))}
              </div>
            )}

            {reputation.positives.length > 0 && (
              <div className="space-y-1">
                {reputation.positives.map((positive, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-risk-low">
                    <CheckCircle className="w-3 h-3" />
                    {positive}
                  </div>
                ))}
              </div>
            )}

            {/* Address */}
            <div className="text-xs text-muted-foreground font-mono truncate">
              {reputation.address}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!reputation && !isLoading && !error && showSearch && (
          <div className="py-8 text-center text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enter a wallet address to check reputation</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ScoreBreakdownItem({
  icon: Icon,
  label,
  value,
  maxValue,
  canBeNegative = false,
}: {
  icon: React.ElementType
  label: string
  value: number
  maxValue: number
  canBeNegative?: boolean
}) {
  const percentage = canBeNegative
    ? ((value + maxValue) / (maxValue * 2)) * 100
    : (value / maxValue) * 100

  const color = value < 0 ? "text-risk-high" : value > maxValue / 2 ? "text-risk-low" : "text-foreground"

  return (
    <div className="p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              value < 0 ? "bg-risk-high" : "bg-risk-low"
            )}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
        <span className={cn("text-xs font-semibold tabular-nums", color)}>
          {value > 0 ? "+" : ""}{value}
        </span>
      </div>
    </div>
  )
}
